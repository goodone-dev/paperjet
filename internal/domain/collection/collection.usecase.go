package collection

import (
	"context"

	"github.com/google/uuid"
)

type CollectionUsecase interface {
	List(ctx context.Context, workspaceID uuid.UUID) ([]CollectionResponse, error)
	Create(ctx context.Context, payload CreateCollectionRequest) (*CollectionResponse, error)
	Get(ctx context.Context, ID uuid.UUID) (*CollectionResponse, error)
	Rename(ctx context.Context, ID uuid.UUID, name string) (*CollectionResponse, error)
	UpdateFavorite(ctx context.Context, ID uuid.UUID, isFavorite bool) (*CollectionResponse, error)
	Delete(ctx context.Context, ID uuid.UUID) error
	Duplicate(ctx context.Context, ID uuid.UUID) (*CollectionResponse, error)
	Move(ctx context.Context, ID uuid.UUID, payload MoveCollectionRequest) (*CollectionResponse, error)
	UpdateSortOrder(ctx context.Context, ID uuid.UUID, sortOrder string) (*CollectionResponse, error)
	ReorderItems(ctx context.Context, collectionID uuid.UUID, payload ReorderItemsRequest) error

	// Folder Operations
	CreateFolder(ctx context.Context, payload CreateFolderRequest) (*FolderResponse, error)
	RenameFolder(ctx context.Context, ID uuid.UUID, payload RenameFolderRequest) (*FolderResponse, error)
	DeleteFolder(ctx context.Context, ID uuid.UUID) error
	DuplicateFolder(ctx context.Context, ID uuid.UUID) (*FolderResponse, error)
	UpdateFolderSortOrder(ctx context.Context, ID uuid.UUID, sortOrder string) (*FolderResponse, error)

	// Request Operations
	CreateRequest(ctx context.Context, payload CreateRequestRequest) (*RequestResponse, error)
	GetRequest(ctx context.Context, ID uuid.UUID) (*RequestResponse, error)
	RenameRequest(ctx context.Context, ID uuid.UUID, payload RenameRequestRequest) (*RequestResponse, error)
	UpdateRequest(ctx context.Context, ID uuid.UUID, payload UpdateRequestRequest) (*RequestResponse, error)
	DeleteRequest(ctx context.Context, ID uuid.UUID) error
	DuplicateRequest(ctx context.Context, ID uuid.UUID) (*RequestResponse, error)

	// Example Operations
	CreateExample(ctx context.Context, payload CreateExampleRequest) (*ExampleResponse, error)
	GetExample(ctx context.Context, ID uuid.UUID) (*ExampleResponse, error)
	RenameExample(ctx context.Context, ID uuid.UUID, payload RenameExampleRequest) (*ExampleResponse, error)
	UpdateExample(ctx context.Context, ID uuid.UUID, payload UpdateExampleRequest) (*ExampleResponse, error)
	DeleteExample(ctx context.Context, ID uuid.UUID) error
	DuplicateExample(ctx context.Context, ID uuid.UUID) (*ExampleResponse, error)
}
