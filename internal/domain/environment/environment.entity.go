package environment

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
)

type Environment struct {
	database.BaseEntity[uuid.UUID]
	WorkspaceID uuid.UUID `json:"workspace_id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Variables   []byte    `json:"variables"`
}

func (Environment) TableName() string {
	return "environments"
}
