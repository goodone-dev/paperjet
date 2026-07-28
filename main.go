package main

import (
	"context"
	"embed"

	collectionRepoImpl "github.com/goodone-dev/postie/internal/application/collection/repository"
	collectionUsecaseImpl "github.com/goodone-dev/postie/internal/application/collection/usecase"
	workspaceRepoImpl "github.com/goodone-dev/postie/internal/application/workspace/repository"
	workspaceUsecaseImpl "github.com/goodone-dev/postie/internal/application/workspace/usecase"
	"github.com/goodone-dev/postie/internal/config"
	"github.com/goodone-dev/postie/internal/domain/collection"
	"github.com/goodone-dev/postie/internal/domain/environment"
	"github.com/goodone-dev/postie/internal/domain/workspace"
	"github.com/goodone-dev/postie/internal/infrastructure/database/sqlite"
	"github.com/goodone-dev/postie/internal/infrastructure/logger"

	environmentRepoImpl "github.com/goodone-dev/postie/internal/application/environment/repository"
	environmentUsecaseImpl "github.com/goodone-dev/postie/internal/application/environment/usecase"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"gorm.io/gorm"
)

//go:embed all:frontend/build
var assets embed.FS

func main() {
	ctx := context.Background()

	// Load configuration
	err := config.Load()
	if err != nil {
		logger.Fatal(ctx, err, "❌ Could not load environment variables")
	}

	// Initialize database
	dbConn := sqlite.Open(ctx)

	// Workspace Dependency Injection
	workspaceBaseRepo := sqlite.NewBaseRepository[gorm.DB, uuid.UUID, workspace.Workspace](dbConn)
	workspaceRepo := workspaceRepoImpl.NewWorkspaceRepository(workspaceBaseRepo)
	workspaceUsecase := workspaceUsecaseImpl.NewWorkspaceUsecase(workspaceRepo)

	// Collection Dependency Injection
	collectionBaseRepo := sqlite.NewBaseRepository[gorm.DB, uuid.UUID, collection.Collection](dbConn)
	collectionRepo := collectionRepoImpl.NewCollectionRepository(collectionBaseRepo)
	folderBaseRepo := sqlite.NewBaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder](dbConn)
	folderRepo := collectionRepoImpl.NewCollectionFolderRepository(folderBaseRepo)
	requestBaseRepo := sqlite.NewBaseRepository[gorm.DB, uuid.UUID, collection.CollectionRequest](dbConn)
	requestRepo := collectionRepoImpl.NewCollectionRequestRepository(requestBaseRepo)
	collectionUsecase := collectionUsecaseImpl.NewCollectionUsecase(collectionRepo, folderRepo, requestRepo)

	// Environment Dependency Injection
	environmentBaseRepo := sqlite.NewBaseRepository[gorm.DB, uuid.UUID, environment.Environment](dbConn)
	environmentRepo := environmentRepoImpl.NewEnvironmentRepository(environmentBaseRepo)
	environmentUsecase := environmentUsecaseImpl.NewEnvironmentUsecase(environmentRepo)

	// Create an instance of the app structure
	app := NewApp(App{
		workspaceUsecase:   workspaceUsecase,
		collectionUsecase:  collectionUsecase,
		environmentUsecase: environmentUsecase,
	})

	// Create application with options
	err = wails.Run(&options.App{
		Title:            "Postie",
		Width:            1024,
		Height:           768,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []any{
			app,
		},
	})

	if err != nil {
		logger.Fatal(ctx, err, "❌ Could not run application")
	}
}
