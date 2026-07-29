package environment

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EnvironmentRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, Environment]
}
