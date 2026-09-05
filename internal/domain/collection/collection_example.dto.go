package collection

import "github.com/google/uuid"

type CreateExampleRequest struct {
	CollectionID    uuid.UUID      `json:"collection_id" validate:"required"`
	RequestID       uuid.UUID      `json:"request_id" validate:"required"`
	Name            string         `json:"name" validate:"required"`
	Method          string         `json:"method" validate:"required"`
	URL             string         `json:"url" validate:"required"`
	QueryParams     []KeyValueFull `json:"query_params"`
	PathVariables   []KeyValueFull `json:"path_variables"`
	Auth            Auth           `json:"auth"`
	Headers         []KeyValueFull `json:"headers"`
	Body            Body           `json:"body"`
	ResponseBody    string         `json:"response_body"`
	ResponseHeaders []KeyValue     `json:"response_headers"`
	ResponseCookies []KeyValue     `json:"response_cookies"`
	Status          int            `json:"status"`
	StatusText      string         `json:"status_text"`
}

type UpdateExampleRequest struct {
	Name            string         `json:"name" validate:"required"`
	Method          string         `json:"method" validate:"required"`
	URL             string         `json:"url" validate:"required"`
	QueryParams     []KeyValueFull `json:"query_params"`
	PathVariables   []KeyValueFull `json:"path_variables"`
	Auth            Auth           `json:"auth"`
	Headers         []KeyValueFull `json:"headers"`
	Body            Body           `json:"body"`
	ResponseBody    string         `json:"response_body"`
	ResponseHeaders []KeyValue     `json:"response_headers"`
	ResponseCookies []KeyValue     `json:"response_cookies"`
	Status          int            `json:"status"`
	StatusText      string         `json:"status_text"`
}

type RenameExampleRequest struct {
	Name string `json:"name" validate:"required"`
}

type ExampleResponse struct {
	ID              uuid.UUID      `json:"id"`
	CollectionID    uuid.UUID      `json:"collection_id"`
	RequestID       uuid.UUID      `json:"request_id"`
	Name            string         `json:"name"`
	Slug            string         `json:"slug"`
	Method          string         `json:"method"`
	URL             string         `json:"url"`
	QueryParams     []KeyValueFull `json:"query_params"`
	PathVariables   []KeyValueFull `json:"path_variables"`
	Auth            Auth           `json:"auth"`
	Headers         []KeyValueFull `json:"headers"`
	Body            Body           `json:"body"`
	ResponseBody    string         `json:"response_body"`
	ResponseHeaders []KeyValue     `json:"response_headers"`
	ResponseCookies []KeyValue     `json:"response_cookies"`
	Status          int            `json:"status"`
	StatusText      string         `json:"status_text"`
	Idx             int            `json:"idx"`
}
