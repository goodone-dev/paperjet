package collection

import "github.com/google/uuid"

type CreateRequestRequest struct {
	CollectionID  uuid.UUID      `json:"collection_id" validate:"required"`
	FolderID      *uuid.UUID     `json:"folder_id,omitempty"`
	Name          string         `json:"name" validate:"required"`
	Method        string         `json:"method" validate:"required"`
	URL           string         `json:"url" validate:"required"`
	QueryParams   []KeyValueFull `json:"query_params"`
	PathVariables []KeyValueFull `json:"path_variables"`
	Auth          Auth           `json:"auth"`
	Headers       []KeyValueFull `json:"headers"`
	Body          Body           `json:"body"`
}

type RenameRequestRequest struct {
	Name string `json:"name" validate:"required"`
}

type UpdateRequestRequest struct {
	Name          string         `json:"name" validate:"required"`
	Method        string         `json:"method" validate:"required"`
	URL           string         `json:"url" validate:"required"`
	QueryParams   []KeyValueFull `json:"query_params"`
	PathVariables []KeyValueFull `json:"path_variables"`
	Auth          Auth           `json:"auth"`
	Headers       []KeyValueFull `json:"headers"`
	Body          Body           `json:"body"`
}

type RequestResponse struct {
	ID            uuid.UUID      `json:"id"`
	CollectionID  uuid.UUID      `json:"collection_id"`
	FolderID      *uuid.UUID     `json:"folder_id,omitempty"`
	Name          string         `json:"name"`
	Slug          string         `json:"slug"`
	Method        string         `json:"method"`
	URL           string         `json:"url"`
	QueryParams   []KeyValueFull `json:"query_params"`
	PathVariables []KeyValueFull `json:"path_variables"`
	Auth          Auth           `json:"auth"`
	Headers       []KeyValueFull `json:"headers"`
	Body          Body           `json:"body"`
}

type KeyValueFull struct {
	Key         string `json:"key" validate:"required"`
	Type        string `json:"type" validate:"required"`
	Value       string `json:"value"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
}

type KeyValue struct {
	Key   string `json:"key" validate:"required"`
	Value string `json:"value"`
}

type Body struct {
	Type       string          `json:"type" validate:"required"`
	Raw        *BodyRaw        `json:"raw,omitempty"`
	FormData   *[]KeyValueFull `json:"form_data,omitempty"`
	UrlEncoded *[]KeyValueFull `json:"url_encoded,omitempty"`
	Binary     *string         `json:"binary,omitempty"`
}

type BodyRaw struct {
	Type  string `json:"type" validate:"required"`
	Value string `json:"value"`
}

type Auth struct {
	Type   string      `json:"type" validate:"required"`
	Bearer *AuthBearer `json:"bearer,omitempty"`
	Basic  *AuthBasic  `json:"basic,omitempty"`
	APIKey *AuthAPIKey `json:"api_key,omitempty"`
}

type AuthBearer struct {
	Token string `json:"token"`
}

type AuthBasic struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthAPIKey struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}
