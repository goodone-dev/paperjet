package usecase

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/goodone-dev/paperjet/internal/domain/environment"
	"github.com/goodone-dev/paperjet/internal/infrastructure/logger"
	httperror "github.com/goodone-dev/paperjet/internal/utils/http_response/error"
	"github.com/google/uuid"
)

type environmentUsecase struct {
	environmentRepo environment.EnvironmentRepository
}

func NewEnvironmentUsecase(environmentRepo environment.EnvironmentRepository) environment.EnvironmentUsecase {
	return &environmentUsecase{
		environmentRepo: environmentRepo,
	}
}

func toEnvironmentResponse(e environment.Environment) environment.EnvironmentResponse {
	var vars []environment.EnvironmentVariable
	if len(e.Variables) > 0 {
		_ = json.Unmarshal(e.Variables, &vars)
	}

	return environment.EnvironmentResponse{
		ID:          e.ID,
		WorkspaceID: e.WorkspaceID,
		Name:        e.Name,
		Slug:        e.Slug,
		Variables:   vars,
	}
}

func (u *environmentUsecase) Create(ctx context.Context, payload environment.CreateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))
	varsBytes, _ := json.Marshal(payload.Variables)

	entity := environment.Environment{
		WorkspaceID: payload.WorkspaceID,
		Name:        payload.Name,
		Slug:        slug,
		Variables:   varsBytes,
	}

	env, err := u.environmentRepo.Insert(ctx, entity, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create environment").Write()
		return nil, err
	}

	res := toEnvironmentResponse(env)
	return &res, nil
}

func (u *environmentUsecase) getEntity(ctx context.Context, ID uuid.UUID) (*environment.Environment, error) {
	env, err := u.environmentRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get environment").Write()
		return nil, err
	} else if env == nil {
		return nil, httperror.NewNotFoundError("environment not found")
	}

	return env, nil
}

func (u *environmentUsecase) Get(ctx context.Context, ID uuid.UUID) (*environment.EnvironmentResponse, error) {
	env, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	res := toEnvironmentResponse(*env)
	return &res, nil
}

func (u *environmentUsecase) Update(ctx context.Context, ID uuid.UUID, payload environment.UpdateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))
	varsBytes, _ := json.Marshal(payload.Variables)

	update := map[string]any{
		"name":      payload.Name,
		"slug":      slug,
		"variables": varsBytes,
	}

	env, err := u.environmentRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update environment").Write()
		return nil, err
	}

	res := toEnvironmentResponse(env)
	return &res, nil
}

func (u *environmentUsecase) Rename(ctx context.Context, ID uuid.UUID, payload environment.UpdateEnvironmentRequest) (*environment.EnvironmentResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	update := map[string]any{
		"name": payload.Name,
		"slug": slug,
	}

	env, err := u.environmentRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename environment").Write()
		return nil, err
	}

	res := toEnvironmentResponse(env)
	return &res, nil
}

func (u *environmentUsecase) Delete(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.environmentRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete environment").Write()
		return err
	}

	return nil
}

func (u *environmentUsecase) List(ctx context.Context, workspaceID uuid.UUID) ([]environment.EnvironmentResponse, error) {
	envs, err := u.environmentRepo.FindAll(ctx, map[string]any{
		"workspace_id": workspaceID,
	})

	if err != nil {
		logger.Error(ctx, err, "❌ Failed to list environments").Write()
		return nil, err
	}

	result := make([]environment.EnvironmentResponse, len(envs))
	for i, e := range envs {
		result[i] = toEnvironmentResponse(e)
	}

	return result, nil
}

func (u *environmentUsecase) Duplicate(ctx context.Context, ID uuid.UUID) (*environment.EnvironmentResponse, error) {
	original, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	newEnv := environment.Environment{
		WorkspaceID: original.WorkspaceID,
		Name:        original.Name + " (copy)",
		Slug:        original.Slug + "-copy",
		Variables:   original.Variables,
	}

	env, err := u.environmentRepo.Insert(ctx, newEnv, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate environment").Write()
		return nil, err
	}

	res := toEnvironmentResponse(env)
	return &res, nil
}
