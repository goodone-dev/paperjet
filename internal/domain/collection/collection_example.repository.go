package collection

import (
	"context"

	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CollectionExampleRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, CollectionExample]
	FindMaxIdx(ctx context.Context, conds map[string]any) (maxIdx int, err error)
}
