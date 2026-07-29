package repository

import (
	"context"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/goodone-dev/paperjet/internal/domain/collection"
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type collectionRequestRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionRequest]
}

func NewCollectionRequestRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionRequest]) collection.CollectionRequestRepository {
	return &collectionRequestRepository{
		baseRepo,
	}
}

func (r *collectionRequestRepository) FindMaxIdx(ctx context.Context, conds map[string]any) (maxIdx int, err error) {
	model := collection.CollectionRequest{}

	builder := sq.
		Select("MAX(idx)").
		From(model.TableName()).
		Where(conds)

	qry, args, err := builder.ToSql()
	if err != nil {
		return
	}

	var res *int
	err = r.DB().WithContext(ctx).Raw(qry, args...).Scan(&res).Error
	if err != nil {
		return 0, err
	} else if res == nil {
		return 0, nil
	}

	return *res, nil
}

func (r *collectionRequestRepository) UpdateIdxAndFolder(ctx context.Context, id uuid.UUID, idx int, folderID *uuid.UUID) error {
	model := collection.CollectionRequest{}

	builder := sq.
		Update(model.TableName()).
		Set("idx", idx).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"id": id})

	if folderID != nil {
		builder = builder.Set("folder_id", *folderID)
	} else {
		builder = builder.Set("folder_id", nil)
	}

	qry, args, err := builder.ToSql()
	if err != nil {
		return err
	}

	err = r.DB().WithContext(ctx).Exec(qry, args...).Error
	if err != nil {
		return err
	}

	return nil
}
