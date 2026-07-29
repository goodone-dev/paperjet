package usecase

import (
	"context"
	"strings"

	"github.com/goodone-dev/paperjet/internal/domain/workspace"
	"github.com/goodone-dev/paperjet/internal/infrastructure/logger"
	httperror "github.com/goodone-dev/paperjet/internal/utils/http_response/error"
	"github.com/google/uuid"
)

type workspaceUsecase struct {
	workspaceRepo workspace.WorkspaceRepository
}

func NewWorkspaceUsecase(workspaceRepo workspace.WorkspaceRepository) workspace.WorkspaceUsecase {
	return &workspaceUsecase{
		workspaceRepo: workspaceRepo,
	}
}

func toWorkspaceResponse(w workspace.Workspace) workspace.WorkspaceResponse {
	return workspace.WorkspaceResponse{
		ID:   w.ID,
		Name: w.Name,
		Slug: w.Slug,
	}
}

func (u *workspaceUsecase) Create(ctx context.Context, payload workspace.CreateWorkspaceRequest) (*workspace.WorkspaceResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	entity := workspace.Workspace{
		Name: payload.Name,
		Slug: slug,
	}

	ws, err := u.workspaceRepo.Insert(ctx, entity, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create workspace").Write()
		return nil, err
	}

	res := toWorkspaceResponse(ws)
	return &res, nil
}

func (u *workspaceUsecase) getEntity(ctx context.Context, ID uuid.UUID) (*workspace.Workspace, error) {
	ws, err := u.workspaceRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get workspace").Write()
		return nil, err
	} else if ws == nil {
		return nil, httperror.NewNotFoundError("workspace not found")
	}

	return ws, nil
}

func (u *workspaceUsecase) Get(ctx context.Context, ID uuid.UUID) (*workspace.WorkspaceResponse, error) {
	ws, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	res := toWorkspaceResponse(*ws)
	return &res, nil
}

func (u *workspaceUsecase) Rename(ctx context.Context, ID uuid.UUID, name string) (*workspace.WorkspaceResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))

	update := map[string]any{
		"name": name,
		"slug": slug,
	}

	ws, err := u.workspaceRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename workspace").Write()
		return nil, err
	}

	res := toWorkspaceResponse(ws)
	return &res, nil
}

func (u *workspaceUsecase) Delete(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return err
	}

	err = u.workspaceRepo.DeleteById(ctx, ID, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to delete workspace").Write()
		return err
	}

	return nil
}

func (u *workspaceUsecase) List(ctx context.Context) ([]workspace.WorkspaceResponse, error) {
	workspaces, err := u.workspaceRepo.FindAll(ctx, map[string]any{})
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to list workspaces").Write()
		return nil, err
	}

	if len(workspaces) > 0 {
		result := make([]workspace.WorkspaceResponse, len(workspaces))
		for i, ws := range workspaces {
			result[i] = toWorkspaceResponse(ws)
		}
		return result, nil
	}

	defaultWorkspace, err := u.Create(ctx, workspace.CreateWorkspaceRequest{
		Name: "My Workspace",
	})

	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create default workspace").Write()
		return nil, err
	}

	return []workspace.WorkspaceResponse{*defaultWorkspace}, nil
}
