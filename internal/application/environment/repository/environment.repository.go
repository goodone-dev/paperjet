package repository

import (
	"github.com/goodone-dev/paperjet/internal/domain/environment"
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type environmentRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, environment.Environment]
}

func NewEnvironmentRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, environment.Environment]) environment.EnvironmentRepository {
	return &environmentRepository{
		baseRepo,
	}
}
