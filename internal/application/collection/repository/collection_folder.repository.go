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

type collectionFolderRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder]
}

func NewCollectionFolderRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionFolder]) collection.CollectionFolderRepository {
	return &collectionFolderRepository{
		baseRepo,
	}
}

func (r *collectionFolderRepository) FindMaxIdx(ctx context.Context, conds map[string]any) (maxIdx int, err error) {
	model := collection.CollectionFolder{}

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

func (r *collectionFolderRepository) UpdateIdxAndParent(ctx context.Context, id uuid.UUID, idx int, parentID *uuid.UUID) error {
	model := collection.CollectionFolder{}

	builder := sq.
		Update(model.TableName()).
		Set("idx", idx).
		Set("updated_at", time.Now()).
		Where(sq.Eq{"id": id})

	if parentID != nil {
		builder = builder.Set("parent_id", *parentID)
	} else {
		builder = builder.Set("parent_id", nil)
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
