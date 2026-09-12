package collection

import "github.com/google/uuid"

type CreateCollectionRequest struct {
	WorkspaceID uuid.UUID `json:"workspace_id" validate:"required"`
	Name        string    `json:"name" validate:"required"`
}

type UpdateCollectionRequest struct {
	Name       string `json:"name" validate:"required"`
	IsFavorite *bool  `json:"is_favorite,omitempty"`
}

type MoveCollectionRequest struct {
	TargetWorkspaceID uuid.UUID `json:"target_workspace_id" validate:"required"`
}

type CollectionResponse struct {
	ID         uuid.UUID     `json:"id"`
	Name       string        `json:"name"`
	Slug       string        `json:"slug"`
	IsFavorite bool          `json:"is_favorite"`
	SortOrder  SortOrder     `json:"sort_order"`
	Folders    []FolderNode  `json:"folders"`
	Requests   []RequestNode `json:"requests"`
}

type FolderNode struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	SortOrder *SortOrder    `json:"sort_order,omitempty"`
	Folders   []FolderNode  `json:"folders"`
	Requests  []RequestNode `json:"requests"`
}

type RequestNode struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Method    string        `json:"method"`
	SortOrder *SortOrder    `json:"sort_order,omitempty"`
	Examples  []ExampleNode `json:"examples"`
}

type ExampleNode struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Method string `json:"method"`
	Status int    `json:"status"`
}

type CollectionTree struct {
	Type      TreeType         `json:"type"`
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Method    *string          `json:"method,omitempty"`
	SortOrder *SortOrder       `json:"sort_order,omitempty"`
	Items     []CollectionTree `json:"items,omitempty"`
}

type TreeType string

const (
	TreeTypeFolder  TreeType = "folder"
	TreeTypeRequest TreeType = "request"
	TreeTypeExample TreeType = "example"
)

type SortOrder string

const (
	SortOrderDefault SortOrder = "default"
	SortOrderAlpha   SortOrder = "alpha"
)

type ReorderItemsRequest struct {
	ParentFolderID  *string          `json:"parent_folder_id"`
	ParentRequestID *string          `json:"parent_request_id,omitempty"`
	Items           []CollectionTree `json:"items,omitempty"`
}
