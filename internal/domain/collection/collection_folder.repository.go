package collection

import (
	"context"

	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CollectionFolderRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, CollectionFolder]
	FindMaxIdx(ctx context.Context, conds map[string]any) (int, error)
	UpdateIdxAndParent(ctx context.Context, id uuid.UUID, idx int, parentID *uuid.UUID) error
}
