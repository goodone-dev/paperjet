package workspace

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
)

type Workspace struct {
	database.BaseEntity[uuid.UUID]
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (Workspace) TableName() string {
	return "workspaces"
}
