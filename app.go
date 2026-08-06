package main

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/goodone-dev/paperjet/internal/domain/collection"
	"github.com/goodone-dev/paperjet/internal/domain/environment"
	"github.com/goodone-dev/paperjet/internal/domain/workspace"
	"github.com/goodone-dev/paperjet/internal/infrastructure/logger"
	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx                context.Context
	workspaceUsecase   workspace.WorkspaceUsecase
	collectionUsecase  collection.CollectionUsecase
	environmentUsecase environment.EnvironmentUsecase
}

// NewApp creates a new App application struct
func NewApp(app App) *App {
	return &app
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ── Workspace ────────────────────────────────────────────────────────────────

func (a *App) CreateWorkspace(payload workspace.CreateWorkspaceRequest) (*workspace.WorkspaceResponse, error) {
	ws, err := a.workspaceUsecase.Create(a.ctx, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Workspace '%s' created", ws.Name).Write()

	return ws, nil
}

func (a *App) GetWorkspace(id string) (*workspace.WorkspaceResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	ws, err := a.workspaceUsecase.Get(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Workspace '%s' details loaded", ws.Name).Write()

	return ws, nil
}

func (a *App) RenameWorkspace(id string, name string) (*workspace.WorkspaceResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	ws, err := a.workspaceUsecase.Rename(a.ctx, uid, name)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Workspace '%s' renamed", ws.Name).Write()

	return ws, nil
}

func (a *App) DeleteWorkspace(id string, name string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	err = a.workspaceUsecase.Delete(a.ctx, uid)
	if err != nil {
		return err
	}

	logger.Debugf(a.ctx, "Workspace '%s' deleted", name).Write()

	return nil
}

func (a *App) ListWorkspaces() ([]workspace.WorkspaceResponse, error) {
	ws, err := a.workspaceUsecase.List(a.ctx)
	if err != nil {
		return nil, err
	}

	logger.Debug(a.ctx, "Workspaces listed").Write()

	return ws, nil
}

// ── Collection ───────────────────────────────────────────────────────────────

func (a *App) ListCollections(workspaceID string) ([]collection.CollectionResponse, error) {
	uid, err := uuid.Parse(workspaceID)
	if err != nil {
		return nil, err
	}

	collections, err := a.collectionUsecase.List(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debug(a.ctx, "Collections listed").Write()

	return collections, nil
}

func (a *App) GetCollection(id string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	collection, err := a.collectionUsecase.Get(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Collection '%s' details loaded", collection.Name).Write()

	return collection, nil
}

func (a *App) CreateCollection(payload collection.CreateCollectionRequest) (*collection.CollectionResponse, error) {
	collection, err := a.collectionUsecase.Create(a.ctx, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Collection '%s' created", collection.Name).Write()

	return collection, nil
}

func (a *App) RenameCollection(id string, name string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	collection, err := a.collectionUsecase.Rename(a.ctx, uid, name)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Collection '%s' renamed", collection.Name).Write()

	return collection, nil
}

func (a *App) UpdateCollectionFavorite(id string, isFavorite bool) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	collection, err := a.collectionUsecase.UpdateFavorite(a.ctx, uid, isFavorite)
	if err != nil {
		return nil, err
	}

	if isFavorite {
		logger.Debugf(a.ctx, "Collection '%s' favorited", collection.Name).Write()
	} else {
		logger.Debugf(a.ctx, "Collection '%s' unfavorited", collection.Name).Write()
	}

	return collection, nil
}

func (a *App) DeleteCollection(id string, name string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	err = a.collectionUsecase.Delete(a.ctx, uid)
	if err != nil {
		return err
	}

	logger.Debugf(a.ctx, "Collection '%s' deleted", name).Write()

	return nil
}

func (a *App) DuplicateCollection(id string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	collection, err := a.collectionUsecase.Duplicate(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Collection '%s' duplicated", collection.Name).Write()

	return collection, nil
}

func (a *App) MoveCollection(id string, payload collection.MoveCollectionRequest) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	collection, err := a.collectionUsecase.Move(a.ctx, uid, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Collection '%s' moved", collection.Name).Write()

	return collection, nil
}

func (a *App) ReorderCollectionItems(collectionID string, collectionName string, payload collection.ReorderItemsRequest) error {
	uid, err := uuid.Parse(collectionID)
	if err != nil {
		return err
	}

	err = a.collectionUsecase.ReorderItems(a.ctx, uid, payload)
	if err != nil {
		return err
	}

	logger.Debugf(a.ctx, "Collection '%s' items reordered", collectionName).Write()

	return nil
}

func (a *App) UpdateCollectionSortOrder(id string, name string, sortOrder string) (*collection.CollectionResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	col, err := a.collectionUsecase.UpdateSortOrder(a.ctx, uid, sortOrder)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Collection '%s' sort order updated to '%s'", name, sortOrder).Write()

	return col, nil
}

// ── Folder ───────────────────────────────────────────────────────────────

func (a *App) CreateFolder(payload collection.CreateFolderRequest) (*collection.FolderResponse, error) {
	folder, err := a.collectionUsecase.CreateFolder(a.ctx, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Folder '%s' created", folder.Name).Write()

	return folder, nil
}

func (a *App) RenameFolder(id string, payload collection.RenameFolderRequest) (*collection.FolderResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	folder, err := a.collectionUsecase.RenameFolder(a.ctx, uid, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Folder '%s' renamed", folder.Name).Write()

	return folder, nil
}

func (a *App) DeleteFolder(id string, name string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	err = a.collectionUsecase.DeleteFolder(a.ctx, uid)
	if err != nil {
		return err
	}

	logger.Debugf(a.ctx, "Folder '%s' deleted", name).Write()

	return nil
}

func (a *App) DuplicateFolder(id string) (*collection.FolderResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	folder, err := a.collectionUsecase.DuplicateFolder(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Folder '%s' duplicated", folder.Name).Write()

	return folder, nil
}

func (a *App) UpdateFolderSortOrder(id string, name string, sortOrder string) (*collection.FolderResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	folder, err := a.collectionUsecase.UpdateFolderSortOrder(a.ctx, uid, sortOrder)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Folder '%s' sort order updated to '%s'", name, sortOrder).Write()

	return folder, nil
}

// ── Request ───────────────────────────────────────────────────────────────

type ProxyPayload struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
	Files   map[string]string `json:"files"`
}

type ProxyResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	Headers    map[string]string `json:"headers"`
	Cookies    map[string]string `json:"cookies"`
	Body       string            `json:"body"`
}

func (a *App) SendRequest(payload ProxyPayload) (*ProxyResponse, error) {
	client := resty.New()
	// client.Debug = true

	req := client.R()
	for k, v := range payload.Headers {
		req.SetHeader(k, v)
	}

	if payload.Body != "" {
		req.SetBody(payload.Body)
	}

	for k, v := range payload.Files {
		req.SetFile(k, v)
	}

	resp, err := req.Execute(payload.Method, payload.URL)
	if err != nil {
		return nil, err
	}

	headers := make(map[string]string)
	for k, v := range resp.Header() {
		if len(v) > 0 {
			headers[k] = v[0]
		}
	}

	cookies := make(map[string]string)
	for _, cookie := range resp.Cookies() {
		cookies[cookie.Name] = cookie.Value
	}

	logger.Debugf(a.ctx, "Request '%s %s' sent", payload.Method, payload.URL).Write()

	return &ProxyResponse{
		Status:     resp.StatusCode(),
		StatusText: resp.Status(),
		Headers:    headers,
		Cookies:    cookies,
		Body:       string(resp.Body()),
	}, nil
}

func (a *App) CreateRequest(payload collection.CreateRequestRequest) (*collection.RequestResponse, error) {
	request, err := a.collectionUsecase.CreateRequest(a.ctx, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Request '%s %s' created", request.Method, request.Name).Write()

	return request, nil
}

func (a *App) GetRequest(id string) (*collection.RequestResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	request, err := a.collectionUsecase.GetRequest(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Request '%s %s' details loaded", request.Method, request.Name).Write()

	return request, nil
}

func (a *App) RenameRequest(id string, payload collection.RenameRequestRequest) (*collection.RequestResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	request, err := a.collectionUsecase.RenameRequest(a.ctx, uid, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Request '%s %s' renamed", request.Method, request.Name).Write()

	return request, nil
}

func (a *App) UpdateRequest(id string, payload collection.UpdateRequestRequest) (*collection.RequestResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	request, err := a.collectionUsecase.UpdateRequest(a.ctx, uid, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Request '%s %s' updated", request.Method, request.Name).Write()

	return request, nil
}

func (a *App) DeleteRequest(id string, method string, name string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	err = a.collectionUsecase.DeleteRequest(a.ctx, uid)
	if err != nil {
		return err
	}

	logger.Debugf(a.ctx, "Request '%s %s' deleted", method, name).Write()

	return nil
}

func (a *App) DuplicateRequest(id string) (*collection.RequestResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	request, err := a.collectionUsecase.DuplicateRequest(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Request '%s %s' duplicated", request.Method, request.Name).Write()

	return request, nil
}

// ── Environment ───────────────────────────────────────────────────────────────

func (a *App) ListEnvironments(workspaceID string) ([]environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(workspaceID)
	if err != nil {
		return nil, err
	}

	env, err := a.environmentUsecase.List(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Environments listed").Write()

	return env, nil
}

func (a *App) CreateEnvironment(payload environment.CreateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	env, err := a.environmentUsecase.Create(a.ctx, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Environment '%s' created", env.Name).Write()

	return env, nil
}

func (a *App) UpdateEnvironment(id string, payload environment.UpdateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	env, err := a.environmentUsecase.Update(a.ctx, uid, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Environment '%s' updated", env.Name).Write()

	return env, nil
}

func (a *App) RenameEnvironment(id string, payload environment.UpdateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	env, err := a.environmentUsecase.Rename(a.ctx, uid, payload)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Environment '%s' renamed", env.Name).Write()

	return env, nil
}

func (a *App) DeleteEnvironment(id string, name string) error {
	uid, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	err = a.environmentUsecase.Delete(a.ctx, uid)
	if err != nil {
		return err
	}

	logger.Debugf(a.ctx, "Environment '%s' deleted", name).Write()

	return nil
}

func (a *App) DuplicateEnvironment(id string) (*environment.EnvironmentResponse, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	env, err := a.environmentUsecase.Duplicate(a.ctx, uid)
	if err != nil {
		return nil, err
	}

	logger.Debugf(a.ctx, "Environment '%s' duplicated", env.Name).Write()

	return env, nil
}
