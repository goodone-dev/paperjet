package collection

import (
	"github.com/goodone-dev/paperjet/internal/infrastructure/database"
	"github.com/google/uuid"
)

type CollectionExample struct {
	database.BaseEntity[uuid.UUID]
	CollectionID      uuid.UUID  `json:"collection_id"`
	RequestID         uuid.UUID  `json:"request_id"`
	Name              string     `json:"name"`
	Slug              string     `json:"slug"`
	Method            string     `json:"method"`
	URL               string     `json:"url"`
	QueryParams       []byte     `json:"query_params"`
	PathVariables     []byte     `json:"path_variables"`
	Auth              []byte     `json:"auth"`
	Headers           []byte     `json:"headers"`
	Body              []byte     `json:"body"`
	ResponseBody      string     `json:"response_body"`
	ResponseHeaders   []byte     `json:"response_headers"`
	ResponseCookies   []byte     `json:"response_cookies"`
	Status            *int       `json:"status"`
	StatusText        *string    `json:"status_text"`
	Idx               int        `json:"idx"`
}

func (CollectionExample) TableName() string {
	return "collection_examples"
}
