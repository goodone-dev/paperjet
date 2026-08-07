package config

import (
	"os"
	"path/filepath"
	"time"

	"github.com/spf13/viper"
)

var ContextTimeout time.Duration
var Application ApplicationConfig
var DB DBConfig
var Logger LoggerConfig

type Environment string

const (
	EnvLocal Environment = "local"
	EnvDev   Environment = "development"
	EnvStag  Environment = "staging"
	EnvProd  Environment = "production"
)

type ApplicationConfig struct {
	Name string      `mapstructure:"APP_NAME"`
	Env  Environment `mapstructure:"APP_ENV"`
	Port int         `mapstructure:"APP_PORT"`
}

type DBConfig struct {
	Name               string        `mapstructure:"DB_NAME"`
	AutoMigrate        bool          `mapstructure:"DB_AUTO_MIGRATE"`
	MaxOpenConnections int           `mapstructure:"DB_MAX_OPEN_CONNECTIONS"`
	MaxIdleConnections int           `mapstructure:"DB_MAX_IDLE_CONNECTIONS"`
	ConnMaxLifetime    time.Duration `mapstructure:"DB_CONN_MAX_LIFETIME"`
	InsertBatchSize    int           `mapstructure:"DB_INSERT_BATCH_SIZE"`
}

type LoggerConfig struct {
	Level int `mapstructure:"LOGGER_LEVEL"`
}

var (
	HomeDir, _ = os.UserHomeDir()
	ConfigDir  = filepath.Join(HomeDir, ".paperjet")
	ConfigPath = filepath.Join(ConfigDir, "config")
)

func Load() (err error) {
	viper.SetConfigName("config")
	viper.AddConfigPath(ConfigDir)
	viper.AddConfigPath(".")

	setDefaultConfig()

	if err = viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return
		}
		if err = os.MkdirAll(ConfigDir, 0755); err == nil {
			viper.SafeWriteConfigAs(ConfigPath)
		}
	}

	// Unmarshal each section explicitly
	if err = viper.Unmarshal(&Application); err != nil {
		return
	}
	if err = viper.Unmarshal(&DB); err != nil {
		return
	}
	if err = viper.Unmarshal(&Logger); err != nil {
		return
	}

	ContextTimeout = viper.GetDuration("CONTEXT_TIMEOUT")

	return
}

func setDefaultConfig() {
	viper.SetDefault("CONTEXT_TIMEOUT", "5s")

	// Application defaults
	viper.SetDefault("APP_NAME", "paperjet")
	viper.SetDefault("APP_PORT", 8080)
	viper.SetDefault("APP_ENV", "local")

	// DB defaults
	viper.SetDefault("DB_NAME", filepath.Join(ConfigDir, "paperjet.db"))
	viper.SetDefault("DB_AUTO_MIGRATE", true)
	viper.SetDefault("DB_MAX_OPEN_CONNECTIONS", 10)
	viper.SetDefault("DB_MAX_IDLE_CONNECTIONS", 10)
	viper.SetDefault("DB_CONN_MAX_LIFETIME", "300s")
	viper.SetDefault("DB_INSERT_BATCH_SIZE", 100)

	// Logger defaults
	viper.SetDefault("LOGGER_LEVEL", "0")
}
