package collection

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
)

type CollectionFolder struct {
	database.BaseEntity[uuid.UUID]
	CollectionID uuid.UUID  `json:"collection_id"`
	ParentID     *uuid.UUID `json:"parent_id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	SortOrder    SortOrder  `json:"sort_order"`
	Idx          int        `json:"idx"`
}

func (CollectionFolder) TableName() string {
	return "collection_folders"
}
