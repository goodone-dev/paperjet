package sqlite

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	migratesqlite "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/goodone-dev/paperjet/internal/config"
	"github.com/goodone-dev/paperjet/internal/infrastructure/logger"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type sqliteConnection struct {
	DB *gorm.DB
}

func Open(ctx context.Context) *sqliteConnection {
	conn := &sqliteConnection{
		DB: open(ctx),
	}

	go conn.Monitor(ctx)

	return conn
}

func open(ctx context.Context) *gorm.DB {
	gormConfig := &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	}

	dsn := fmt.Sprintf("%s?_foreign_keys=on", config.DB.Name)
	db, err := gorm.Open(sqlite.Open(dsn), gormConfig)
	if err != nil {
		logger.Fatal(ctx, err, "❌ SQLite failed to open database").Write()
	}

	sqlDB, err := db.DB()
	if err != nil {
		logger.Fatal(ctx, err, "❌ SQLite failed to access connection pool").Write()
	}

	sqlDB.SetMaxOpenConns(config.DB.MaxOpenConnections)
	sqlDB.SetMaxIdleConns(config.DB.MaxIdleConnections)
	sqlDB.SetConnMaxLifetime(config.DB.ConnMaxLifetime)

	err = sqlDB.Ping()
	if err != nil {
		logger.Fatal(ctx, err, "❌ SQLite connection test failed").Write()
	}

	// SQLite disables foreign key enforcement by default.
	// Enable it so ON DELETE CASCADE works correctly.
	if err = db.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
		logger.Fatal(ctx, err, "❌ SQLite failed to enable foreign keys").Write()
	}

	if !config.DB.AutoMigrate {
		return db
	}

	migrateDriver, err := migratesqlite.WithInstance(sqlDB, &migratesqlite.Config{})
	if err != nil {
		logger.Fatal(ctx, err, "❌ SQLite failed to initialize migration driver").Write()
	}

	m, err := migrate.NewWithDatabaseInstance("file://migrations/sqlite", "sqlite", migrateDriver)
	if err != nil {
		logger.Fatal(ctx, err, "❌ SQLite failed to create migration instance").Write()
	}

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		logger.Fatal(ctx, err, "❌ SQLite failed migration").Write()
	}

	return db
}

func (c *sqliteConnection) Shutdown(ctx context.Context) error {
	if err := close(c.DB); err != nil {
		return err
	}

	return nil
}

func close(conn *gorm.DB) error {
	sqlDB, err := conn.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

func (c *sqliteConnection) Ping(ctx context.Context) error {
	db, err := c.DB.DB()
	if err != nil {
		return err
	} else if err := db.Ping(); err != nil {
		return err
	}

	return nil
}

func (c *sqliteConnection) Monitor(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	var wasLost bool

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			err := c.Ping(ctx)
			if err != nil {
				if !wasLost {
					logger.Errorf(ctx, err, "🛑 SQLite connection lost").Write()
					wasLost = true
				}
			} else {
				if wasLost {
					logger.Info(ctx, "✅ SQLite connection restored").Write()
					wasLost = false
				}
			}
		}
	}
}
