package repository

import (
	"github.com/goodone-dev/paperjet/internal/domain/workspace"
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type workspaceRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, workspace.Workspace]
}

func NewWorkspaceRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, workspace.Workspace]) workspace.WorkspaceRepository {
	return &workspaceRepository{
		baseRepo,
	}
}
