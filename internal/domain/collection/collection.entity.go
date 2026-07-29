package collection

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
)

type Collection struct {
	database.BaseEntity[uuid.UUID]
	WorkspaceID uuid.UUID `json:"workspace_id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	IsFavorite  bool      `json:"is_favorite"`
	SortOrder   SortOrder `json:"sort_order"`
}

func (Collection) TableName() string {
	return "collections"
}
