package main

import (
	"context"
	"embed"

	collectionRepoImpl "github.com/goodone-dev/paperjet/internal/application/collection/repository"
	collectionUsecaseImpl "github.com/goodone-dev/paperjet/internal/application/collection/usecase"
	workspaceRepoImpl "github.com/goodone-dev/paperjet/internal/application/workspace/repository"
	workspaceUsecaseImpl "github.com/goodone-dev/paperjet/internal/application/workspace/usecase"
	"github.com/goodone-dev/paperjet/internal/config"
	"github.com/goodone-dev/paperjet/internal/domain/collection"
	"github.com/goodone-dev/paperjet/internal/domain/environment"
	"github.com/goodone-dev/paperjet/internal/domain/workspace"
	"github.com/goodone-dev/paperjet/internal/infrastructure/database/sqlite"
	"github.com/goodone-dev/paperjet/internal/infrastructure/logger"

	environmentRepoImpl "github.com/goodone-dev/paperjet/internal/application/environment/repository"
	environmentUsecaseImpl "github.com/goodone-dev/paperjet/internal/application/environment/usecase"
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

	menu := NewMenu(app)

	// Create application with options
	err = wails.Run(&options.App{
		Title:            "PaperJet",
		Width:            1024,
		Height:           768,
		Menu:             menu,
		Frameless:        true,
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
