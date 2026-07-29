package collection

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
)

type CollectionRequest struct {
	database.BaseEntity[uuid.UUID]
	CollectionID  uuid.UUID  `json:"collection_id"`
	FolderID      *uuid.UUID `json:"folder_id"`
	Name          string     `json:"name"`
	Slug          string     `json:"slug"`
	Method        string     `json:"method"`
	URL           string     `json:"url"`
	Params        []byte     `json:"params"`
	PathVariables []byte     `json:"path_variables"`
	Auth          []byte     `json:"auth"`
	Headers       []byte     `json:"headers"`
	Body          []byte     `json:"body"`
	Idx           int        `json:"idx"`
}

func (CollectionRequest) TableName() string {
	return "collection_requests"
}
