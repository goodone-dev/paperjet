package collection

import (
	"context"

	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CollectionRequestRepository interface {
	database.BaseRepository[gorm.DB, uuid.UUID, CollectionRequest]
	FindMaxIdx(ctx context.Context, conds map[string]any) (maxIdx int, err error)
	UpdateIdxAndFolder(ctx context.Context, id uuid.UUID, idx int, folderID *uuid.UUID) error
}
