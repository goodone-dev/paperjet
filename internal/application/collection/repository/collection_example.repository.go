package repository

import (
	"context"

	sq "github.com/Masterminds/squirrel"
	"github.com/goodone-dev/paperjet/internal/domain/collection"
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type collectionExampleRepository struct {
	database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionExample]
}

func NewCollectionExampleRepository(baseRepo database.BaseRepository[gorm.DB, uuid.UUID, collection.CollectionExample]) collection.CollectionExampleRepository {
	return &collectionExampleRepository{
		baseRepo,
	}
}

func (r *collectionExampleRepository) FindMaxIdx(ctx context.Context, conds map[string]any) (maxIdx int, err error) {
	model := collection.CollectionExample{}

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
