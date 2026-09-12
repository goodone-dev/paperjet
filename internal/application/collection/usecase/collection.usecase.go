package usecase

import (
	"context"
	"encoding/json"
	"sort"
	"strings"

	"github.com/goodone-dev/paperjet/internal/domain/collection"
	"github.com/goodone-dev/paperjet/internal/infrastructure/logger"
	errors "github.com/goodone-dev/paperjet/internal/utils/error"
	"github.com/google/uuid"
)

type collectionUsecase struct {
	collectionRepo collection.CollectionRepository
	folderRepo     collection.CollectionFolderRepository
	requestRepo    collection.CollectionRequestRepository
	exampleRepo    collection.CollectionExampleRepository
}

func NewCollectionUsecase(collectionRepo collection.CollectionRepository, folderRepo collection.CollectionFolderRepository, requestRepo collection.CollectionRequestRepository, exampleRepo collection.CollectionExampleRepository) collection.CollectionUsecase {
	return &collectionUsecase{
		collectionRepo: collectionRepo,
		folderRepo:     folderRepo,
		requestRepo:    requestRepo,
		exampleRepo:    exampleRepo,
	}
}

func toCollectionResponse(c collection.Collection) collection.CollectionResponse {
	sortOrder := c.SortOrder
	if sortOrder == "" {
		sortOrder = collection.SortOrderDefault
	}

	return collection.CollectionResponse{
		ID:         c.ID,
		Name:       c.Name,
		Slug:       c.Slug,
		IsFavorite: c.IsFavorite,
		SortOrder:  sortOrder,
		Folders:    make([]collection.FolderNode, 0),
		Requests:   make([]collection.RequestNode, 0),
	}
}

func (u *collectionUsecase) buildTree(ctx context.Context, col *collection.Collection) ([]collection.FolderNode, []collection.RequestNode) {
	folders, _ := u.folderRepo.FindAll(ctx, map[string]any{"collection_id": col.ID})
	requests, _ := u.requestRepo.FindAll(ctx, map[string]any{"collection_id": col.ID})
	examples, _ := u.exampleRepo.FindAll(ctx, map[string]any{"collection_id": col.ID})
	sort.SliceStable(examples, func(i, j int) bool { return examples[i].Idx < examples[j].Idx })

	colSortOrder := col.SortOrder
	if colSortOrder == "" {
		colSortOrder = collection.SortOrderDefault
	}

	var recurse func(parentID *uuid.UUID, sortOrder collection.SortOrder) ([]collection.FolderNode, []collection.RequestNode)
	recurse = func(parentID *uuid.UUID, sortOrder collection.SortOrder) ([]collection.FolderNode, []collection.RequestNode) {
		// Collect matching folders
		var matchingFolders []collection.CollectionFolder
		for _, f := range folders {
			match := (f.ParentID == nil && parentID == nil) || (f.ParentID != nil && parentID != nil && *f.ParentID == *parentID)
			if match {
				matchingFolders = append(matchingFolders, f)
			}
		}

		// Collect matching requests
		var matchingRequests []collection.CollectionRequest
		for _, r := range requests {
			match := (r.FolderID == nil && parentID == nil) || (r.FolderID != nil && parentID != nil && *r.FolderID == *parentID)
			if match {
				matchingRequests = append(matchingRequests, r)
			}
		}

		// Sort based on sortOrder
		if sortOrder == collection.SortOrderAlpha {
			sort.Slice(matchingFolders, func(i, j int) bool {
				return strings.ToLower(matchingFolders[i].Name) < strings.ToLower(matchingFolders[j].Name)
			})
			sort.Slice(matchingRequests, func(i, j int) bool {
				return strings.ToLower(matchingRequests[i].Name) < strings.ToLower(matchingRequests[j].Name)
			})
		} else {
			sort.Slice(matchingFolders, func(i, j int) bool {
				return matchingFolders[i].Idx < matchingFolders[j].Idx
			})
			sort.Slice(matchingRequests, func(i, j int) bool {
				return matchingRequests[i].Idx < matchingRequests[j].Idx
			})
		}

		folderNodes := make([]collection.FolderNode, 0, len(matchingFolders))
		requestNodes := make([]collection.RequestNode, 0, len(matchingRequests))

		for _, f := range matchingFolders {
			folSortOrder := f.SortOrder
			if folSortOrder == "" {
				folSortOrder = collection.SortOrderDefault
			}

			subFolders, subRequests := recurse(&f.ID, folSortOrder)
			folderNode := collection.FolderNode{
				ID:        f.ID.String(),
				Name:      f.Name,
				SortOrder: &folSortOrder,
				Folders:   subFolders,
				Requests:  subRequests,
			}

			folderNodes = append(folderNodes, folderNode)
		}

		for _, r := range matchingRequests {
			rr := toRequestResponse(r)

			reqNode := collection.RequestNode{
				ID:       rr.ID.String(),
				Name:     rr.Name,
				Method:   rr.Method,
				Examples: make([]collection.ExampleNode, 0),
			}

			for _, ex := range examples {
				if ex.RequestID == r.ID {
					reqNode.Examples = append(reqNode.Examples, collection.ExampleNode{
						ID: ex.ID.String(), Name: ex.Name, Method: ex.Method, Status: ex.Status,
					})
				}
			}

			requestNodes = append(requestNodes, reqNode)
		}

		return folderNodes, requestNodes
	}

	return recurse(nil, colSortOrder)
}

func (u *collectionUsecase) List(ctx context.Context, workspaceID uuid.UUID) ([]collection.CollectionResponse, error) {
	collections, err := u.collectionRepo.FindAll(ctx, map[string]any{
		"workspace_id": workspaceID,
	})
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to list collections").Write()
		return nil, err
	}

	result := make([]collection.CollectionResponse, len(collections))
	for i, c := range collections {
		result[i] = toCollectionResponse(c) // items left empty; use Get to load the tree on-demand
	}

	return result, nil
}

func (u *collectionUsecase) Create(ctx context.Context, payload collection.CreateCollectionRequest) (*collection.CollectionResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	entity := collection.Collection{
		WorkspaceID: payload.WorkspaceID,
		Name:        payload.Name,
		Slug:        slug,
		IsFavorite:  false,
		SortOrder:   collection.SortOrderDefault,
	}

	col, err := u.collectionRepo.Insert(ctx, entity, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

// getEntity is an internal helper that returns the raw entity (not the DTO).
// Used by methods that need to read fields like WorkspaceID before transforming.
func (u *collectionUsecase) getEntity(ctx context.Context, ID uuid.UUID) (*collection.Collection, error) {
	col, err := u.collectionRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get collection").Write()
		return nil, err
	} else if col == nil {
		return nil, errors.NewNotFoundError("collection not found")
	}

	return col, nil
}

func (u *collectionUsecase) Get(ctx context.Context, ID uuid.UUID) (*collection.CollectionResponse, error) {
	col, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	res := toCollectionResponse(*col)
	res.Folders, res.Requests = u.buildTree(ctx, col)
	return &res, nil
}

func (u *collectionUsecase) Rename(ctx context.Context, ID uuid.UUID, name string) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	update := map[string]any{
		"name": name,
		"slug": slug,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) UpdateFavorite(ctx context.Context, ID uuid.UUID, isFavorite bool) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	update := map[string]any{
		"is_favorite": isFavorite,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update collection favorite").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) Delete(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.collectionRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete collection").Write()
		return err
	}

	return nil
}

func (u *collectionUsecase) Duplicate(ctx context.Context, ID uuid.UUID) (*collection.CollectionResponse, error) {
	original, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	newCol := collection.Collection{
		WorkspaceID: original.WorkspaceID,
		Name:        original.Name + " (copy)",
		Slug:        original.Slug + "-copy",
		IsFavorite:  false,
		SortOrder:   original.SortOrder,
	}

	col, err := u.collectionRepo.Insert(ctx, newCol, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate collection").Write()
		return nil, err
	}

	// Duplicate folders
	folders, _ := u.folderRepo.FindAll(ctx, map[string]any{"collection_id": ID})
	folderIDMap := make(map[uuid.UUID]uuid.UUID) // old ID -> new ID
	for _, folder := range folders {
		if folder.ParentID != nil {
			continue // handle root folders first
		}

		newFolder := collection.CollectionFolder{
			CollectionID: col.ID,
			ParentID:     nil,
			Name:         folder.Name,
			Slug:         folder.Slug,
			Idx:          folder.Idx,
			SortOrder:    folder.SortOrder,
		}

		inserted, err := u.folderRepo.Insert(ctx, newFolder, nil)
		if err == nil {
			folderIDMap[folder.ID] = inserted.ID
		}
	}

	// Handle child folders
	for _, folder := range folders {
		if folder.ParentID == nil {
			continue
		}

		newParentID, ok := folderIDMap[*folder.ParentID]
		if !ok {
			continue
		}

		newFolder := collection.CollectionFolder{
			CollectionID: col.ID,
			ParentID:     &newParentID,
			Name:         folder.Name,
			Slug:         folder.Slug,
			Idx:          folder.Idx,
			SortOrder:    folder.SortOrder,
		}

		inserted, err := u.folderRepo.Insert(ctx, newFolder, nil)
		if err == nil {
			folderIDMap[folder.ID] = inserted.ID
		}
	}

	// Duplicate requests
	requests, _ := u.requestRepo.FindAll(ctx, map[string]any{"collection_id": ID})
	requestIDMap := make(map[uuid.UUID]uuid.UUID)
	for _, req := range requests {
		var newFolderID *uuid.UUID
		if req.FolderID != nil {
			if mapped, ok := folderIDMap[*req.FolderID]; ok {
				newFolderID = &mapped
			}
		}

		newReq := collection.CollectionRequest{
			CollectionID:  col.ID,
			FolderID:      newFolderID,
			Name:          req.Name,
			Slug:          req.Slug,
			Method:        req.Method,
			URL:           req.URL,
			QueryParams:   req.QueryParams,
			PathVariables: req.PathVariables,
			Auth:          req.Auth,
			Headers:       req.Headers,
			Body:          req.Body,
			Idx:           req.Idx,
		}

		inserted, err := u.requestRepo.Insert(ctx, newReq, nil)
		if err == nil {
			requestIDMap[req.ID] = inserted.ID
		}
	}

	// Duplicate examples
	examples, _ := u.exampleRepo.FindAll(ctx, map[string]any{"collection_id": ID})
	for _, ex := range examples {
		newReqID, ok := requestIDMap[ex.RequestID]
		if !ok {
			continue
		}

		u.exampleRepo.Insert(ctx, collection.CollectionExample{ //nolint:errcheck
			CollectionID:    col.ID,
			RequestID:       newReqID,
			Name:            ex.Name,
			Slug:            ex.Slug,
			Method:          ex.Method,
			URL:             ex.URL,
			QueryParams:     ex.QueryParams,
			PathVariables:   ex.PathVariables,
			Auth:            ex.Auth,
			Headers:         ex.Headers,
			Body:            ex.Body,
			ResponseBody:    ex.ResponseBody,
			ResponseHeaders: ex.ResponseHeaders,
			ResponseCookies: ex.ResponseCookies,
			Status:          ex.Status,
			StatusText:      ex.StatusText,
			Idx:             ex.Idx,
		}, nil)
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) Move(ctx context.Context, ID uuid.UUID, payload collection.MoveCollectionRequest) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	update := map[string]any{
		"workspace_id": payload.TargetWorkspaceID,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to move collection").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) UpdateSortOrder(ctx context.Context, ID uuid.UUID, sortOrder string) (*collection.CollectionResponse, error) {
	_, err := u.getEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	update := map[string]any{
		"sort_order": sortOrder,
	}

	col, err := u.collectionRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update collection sort order").Write()
		return nil, err
	}

	res := toCollectionResponse(col)
	return &res, nil
}

func (u *collectionUsecase) ReorderItems(ctx context.Context, collectionID uuid.UUID, payload collection.ReorderItemsRequest) error {
	var parentFolderID *uuid.UUID
	if payload.ParentFolderID != nil && *payload.ParentFolderID != "" {
		id, err := uuid.Parse(*payload.ParentFolderID)
		if err != nil {
			return err
		}
		parentFolderID = &id
	}

	// Example reorder: items are examples under a parent request
	if payload.ParentRequestID != nil {
		if parentFolderID != nil {
			return errors.NewBadRequestError("cannot specify both parent folder and parent request")
		}
		parentReqID, err := uuid.Parse(*payload.ParentRequestID)
		if err != nil || parentReqID == uuid.Nil {
			return errors.NewBadRequestError("invalid parent request ID")
		}
		trx, err := u.exampleRepo.Begin(ctx)
		if err != nil {
			return err
		}
		committed := false
		defer func() {
			if !committed {
				u.exampleRepo.Rollback(trx)
			}
		}()
		var parentReq collection.CollectionRequest
		if err := trx.WithContext(ctx).Where("id = ?", parentReqID).Take(&parentReq).Error; err != nil {
			return err
		}
		if parentReq.CollectionID != collectionID {
			return errors.NewBadRequestError("destination request must belong to collection")
		}

		ids := make([]uuid.UUID, len(payload.Items))
		for i, item := range payload.Items {
			if item.Type != collection.TreeTypeExample {
				return errors.NewBadRequestError("parent request reorder accepts examples only")
			}
			id, err := uuid.Parse(item.ID)
			if err != nil || id == uuid.Nil {
				return errors.NewBadRequestError("invalid example ID")
			}
			ids[i] = id
		}
		var examples []collection.CollectionExample
		if err := trx.WithContext(ctx).Where("id IN ?", ids).Find(&examples).Error; err != nil {
			return err
		}
		if len(examples) != len(ids) {
			return errors.NewBadRequestError("invalid example ID")
		}
		for _, ex := range examples {
			if ex.CollectionID != collectionID {
				return errors.NewBadRequestError("example must belong to collection")
			}
		}
		for i, id := range ids {
			if err := u.exampleRepo.UpdateIdxAndRequest(ctx, id, i, parentReqID, trx); err != nil {
				return err
			}
		}
		if result := u.exampleRepo.Commit(trx); result.Error != nil {
			return result.Error
		}
		committed = true
		return nil
	}

	for _, item := range payload.Items {
		if item.Type != collection.TreeTypeFolder && item.Type != collection.TreeTypeRequest {
			return errors.NewBadRequestError("folder reorder accepts folders and requests only")
		}
		if id, err := uuid.Parse(item.ID); err != nil || id == uuid.Nil {
			return errors.NewBadRequestError("invalid item ID")
		}
	}

	for i, item := range payload.Items {
		id, err := uuid.Parse(item.ID)
		if err != nil {
			continue
		}

		switch item.Type {
		case collection.TreeTypeFolder:
			if err := u.folderRepo.UpdateIdxAndParent(ctx, id, i, parentFolderID); err != nil {
				logger.Error(ctx, err, "Failed to reorder folder").Write()
			}
		case collection.TreeTypeRequest:
			if err := u.requestRepo.UpdateIdxAndFolder(ctx, id, i, parentFolderID); err != nil {
				logger.Error(ctx, err, "Failed to reorder request").Write()
			}
		}
	}

	if parentFolderID != nil {
		_, err := u.UpdateFolderSortOrder(ctx, *parentFolderID, string(collection.SortOrderDefault))
		if err != nil {
			logger.Error(ctx, err, "Failed to update folder sort order to default").Write()
		}
	} else {
		_, err := u.UpdateSortOrder(ctx, collectionID, string(collection.SortOrderDefault))
		if err != nil {
			logger.Error(ctx, err, "Failed to update collection sort order to default").Write()
		}
	}

	return nil
}

// ── Folder Operations ─────────────────────────────────────────────────────────

func toFolderResponse(f collection.CollectionFolder) collection.FolderResponse {
	sortOrder := f.SortOrder
	if sortOrder == "" {
		sortOrder = collection.SortOrderDefault
	}

	return collection.FolderResponse{
		ID:           f.ID,
		CollectionID: f.CollectionID,
		ParentID:     f.ParentID,
		Name:         f.Name,
		Slug:         f.Slug,
		SortOrder:    sortOrder,
		Idx:          f.Idx,
	}
}

func (u *collectionUsecase) CreateFolder(ctx context.Context, payload collection.CreateFolderRequest) (*collection.FolderResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	conds := map[string]any{"collection_id": payload.CollectionID}
	if payload.ParentID != nil {
		conds["parent_id"] = *payload.ParentID
	} else {
		conds["parent_id"] = nil
	}

	maxIdx, err := u.folderRepo.FindMaxIdx(ctx, conds)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to find max idx").Write()
		return nil, err
	}

	count := maxIdx + 1

	folder := collection.CollectionFolder{
		CollectionID: payload.CollectionID,
		ParentID:     payload.ParentID,
		Name:         payload.Name,
		Slug:         slug,
		SortOrder:    collection.SortOrderDefault,
		Idx:          int(count),
	}

	inserted, err := u.folderRepo.Insert(ctx, folder, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create folder").Write()
		return nil, err
	}

	res := toFolderResponse(inserted)
	return &res, nil
}

func (u *collectionUsecase) getFolderEntity(ctx context.Context, ID uuid.UUID) (*collection.CollectionFolder, error) {
	folder, err := u.folderRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get folder").Write()
		return nil, err
	} else if folder == nil {
		return nil, errors.NewNotFoundError("folder not found")
	}

	return folder, nil
}

func (u *collectionUsecase) RenameFolder(ctx context.Context, ID uuid.UUID, payload collection.RenameFolderRequest) (*collection.FolderResponse, error) {
	_, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))
	update := map[string]any{
		"name": payload.Name,
		"slug": slug,
	}

	folder, err := u.folderRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename folder").Write()
		return nil, err
	}

	res := toFolderResponse(folder)
	return &res, nil
}

func (u *collectionUsecase) DeleteFolder(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.folderRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete folder").Write()
		return err
	}

	return nil
}

func (u *collectionUsecase) DuplicateFolder(ctx context.Context, ID uuid.UUID) (*collection.FolderResponse, error) {
	folder, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	// Insert the root duplicate
	newFolder := collection.CollectionFolder{
		CollectionID: folder.CollectionID,
		ParentID:     folder.ParentID,
		Name:         folder.Name + " (copy)",
		Slug:         folder.Slug + "-copy",
		SortOrder:    folder.SortOrder,
		Idx:          folder.Idx + 1,
	}

	inserted, err := u.folderRepo.Insert(ctx, newFolder, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate folder").Write()
		return nil, err
	}

	// folderIDMap seeds with the root; the multi-pass loop below propagates it
	// to every descendant, so no separate subtree-collection step is needed.
	folderIDMap := map[uuid.UUID]uuid.UUID{folder.ID: inserted.ID}

	// Exclude the root (already handled) and keep only direct/indirect children.
	allFolders, _ := u.folderRepo.FindAll(ctx, map[string]any{"collection_id": folder.CollectionID})
	remaining := make([]collection.CollectionFolder, 0, len(allFolders))

	for _, f := range allFolders {
		if f.ID != folder.ID && f.ParentID != nil {
			remaining = append(remaining, f)
		}
	}

	// Insert children level by level; stop when nothing progresses.
	cloneFolder := func(f collection.CollectionFolder, newParentID uuid.UUID) collection.CollectionFolder {
		return collection.CollectionFolder{
			CollectionID: inserted.CollectionID,
			ParentID:     &newParentID,
			Name:         f.Name,
			Slug:         f.Slug,
			SortOrder:    f.SortOrder,
			Idx:          f.Idx,
		}
	}

	for len(remaining) > 0 {
		progressed := false
		var deferred []collection.CollectionFolder

		for _, f := range remaining {
			newParentID, ok := folderIDMap[*f.ParentID]
			if !ok {
				deferred = append(deferred, f)
				continue
			}

			if child, err := u.folderRepo.Insert(ctx, cloneFolder(f, newParentID), nil); err == nil {
				folderIDMap[f.ID] = child.ID
				progressed = true
			} else {
				deferred = append(deferred, f)
			}
		}

		remaining = deferred
		if !progressed {
			break // avoid infinite loop on persistent errors
		}
	}

	// Duplicate requests that belong to any folder in the copied subtree.
	requests, _ := u.requestRepo.FindAll(ctx, map[string]any{"collection_id": folder.CollectionID})
	requestIDMap := make(map[uuid.UUID]uuid.UUID)
	for _, req := range requests {
		if req.FolderID == nil {
			continue
		}

		newFolderID, ok := folderIDMap[*req.FolderID]
		if !ok {
			continue
		}

		insertedReq, err := u.requestRepo.Insert(ctx, collection.CollectionRequest{
			CollectionID:  req.CollectionID,
			FolderID:      &newFolderID,
			Name:          req.Name,
			Slug:          req.Slug,
			Method:        req.Method,
			URL:           req.URL,
			QueryParams:   req.QueryParams,
			PathVariables: req.PathVariables,
			Auth:          req.Auth,
			Headers:       req.Headers,
			Body:          req.Body,
			Idx:           req.Idx,
		}, nil)
		if err == nil {
			requestIDMap[req.ID] = insertedReq.ID
		}
	}

	// Duplicate examples that belong to any copied request
	examples, _ := u.exampleRepo.FindAll(ctx, map[string]any{"collection_id": folder.CollectionID})
	for _, ex := range examples {
		newReqID, ok := requestIDMap[ex.RequestID]
		if !ok {
			continue
		}

		u.exampleRepo.Insert(ctx, collection.CollectionExample{ //nolint:errcheck
			CollectionID:    ex.CollectionID,
			RequestID:       newReqID,
			Name:            ex.Name,
			Slug:            ex.Slug,
			Method:          ex.Method,
			URL:             ex.URL,
			QueryParams:     ex.QueryParams,
			PathVariables:   ex.PathVariables,
			Auth:            ex.Auth,
			Headers:         ex.Headers,
			Body:            ex.Body,
			ResponseBody:    ex.ResponseBody,
			ResponseHeaders: ex.ResponseHeaders,
			ResponseCookies: ex.ResponseCookies,
			Status:          ex.Status,
			StatusText:      ex.StatusText,
			Idx:             ex.Idx,
		}, nil)
	}

	res := toFolderResponse(inserted)
	return &res, nil
}

func (u *collectionUsecase) UpdateFolderSortOrder(ctx context.Context, ID uuid.UUID, sortOrder string) (*collection.FolderResponse, error) {
	_, err := u.getFolderEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	update := map[string]any{
		"sort_order": sortOrder,
	}

	folder, err := u.folderRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update folder sort order").Write()
		return nil, err
	}

	res := toFolderResponse(folder)
	return &res, nil
}

// ── Request Operations ─────────────────────────────────────────────────────────

func toRequestResponse(r collection.CollectionRequest) collection.RequestResponse {
	res := collection.RequestResponse{
		ID:           r.ID,
		CollectionID: r.CollectionID,
		FolderID:     r.FolderID,
		Name:         r.Name,
		Slug:         r.Slug,
		Method:       r.Method,
		URL:          r.URL,
	}

	json.Unmarshal(r.QueryParams, &res.QueryParams)
	json.Unmarshal(r.PathVariables, &res.PathVariables)
	json.Unmarshal(r.Auth, &res.Auth)
	json.Unmarshal(r.Headers, &res.Headers)
	json.Unmarshal(r.Body, &res.Body)

	if res.QueryParams == nil {
		res.QueryParams = make([]collection.KeyValueFull, 0)
	}
	if res.PathVariables == nil {
		res.PathVariables = make([]collection.KeyValueFull, 0)
	}
	if res.Headers == nil {
		res.Headers = make([]collection.KeyValueFull, 0)
	}
	if res.Auth.Type == "" {
		res.Auth.Type = "none"
	}
	if res.Body.Type == "" {
		res.Body.Type = "none"
	}

	return res
}

func (u *collectionUsecase) CreateRequest(ctx context.Context, payload collection.CreateRequestRequest) (*collection.RequestResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	conds := map[string]any{"collection_id": payload.CollectionID}
	if payload.FolderID != nil {
		conds["folder_id"] = *payload.FolderID
	} else {
		conds["folder_id"] = nil
	}

	maxIdx, err := u.requestRepo.FindMaxIdx(ctx, conds)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to find max idx").Write()
		return nil, err
	}

	bQryParams, _ := json.Marshal(payload.QueryParams)
	bPathVars, _ := json.Marshal(payload.PathVariables)
	bAuth, _ := json.Marshal(payload.Auth)
	bHeaders, _ := json.Marshal(payload.Headers)
	bBody, _ := json.Marshal(payload.Body)

	req := collection.CollectionRequest{
		CollectionID:  payload.CollectionID,
		FolderID:      payload.FolderID,
		Name:          payload.Name,
		Slug:          slug,
		Method:        payload.Method,
		URL:           payload.URL,
		QueryParams:   bQryParams,
		PathVariables: bPathVars,
		Auth:          bAuth,
		Headers:       bHeaders,
		Body:          bBody,
		Idx:           maxIdx + 1,
	}

	inserted, err := u.requestRepo.Insert(ctx, req, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create request").Write()
		return nil, err
	}

	res := toRequestResponse(inserted)
	return &res, nil
}

func (u *collectionUsecase) getRequestEntity(ctx context.Context, ID uuid.UUID) (*collection.CollectionRequest, error) {
	req, err := u.requestRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get request").Write()
		return nil, err
	} else if req == nil {
		return nil, errors.NewNotFoundError("request not found")
	}

	return req, nil
}

func (u *collectionUsecase) GetRequest(ctx context.Context, ID uuid.UUID) (*collection.RequestResponse, error) {
	req, err := u.getRequestEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	res := toRequestResponse(*req)
	return &res, nil
}

func (u *collectionUsecase) RenameRequest(ctx context.Context, ID uuid.UUID, payload collection.RenameRequestRequest) (*collection.RequestResponse, error) {
	_, err := u.getRequestEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))
	update := map[string]any{
		"name": payload.Name,
		"slug": slug,
	}

	req, err := u.requestRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename request").Write()
		return nil, err
	}

	res := toRequestResponse(req)
	return &res, nil
}

func (u *collectionUsecase) UpdateRequest(ctx context.Context, ID uuid.UUID, payload collection.UpdateRequestRequest) (*collection.RequestResponse, error) {
	_, err := u.getRequestEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	bQryParams, _ := json.Marshal(payload.QueryParams)
	bPathVars, _ := json.Marshal(payload.PathVariables)
	bAuth, _ := json.Marshal(payload.Auth)
	bHeaders, _ := json.Marshal(payload.Headers)
	bBody, _ := json.Marshal(payload.Body)

	update := map[string]any{
		"name":           payload.Name,
		"slug":           strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-")),
		"method":         payload.Method,
		"url":            payload.URL,
		"query_params":   bQryParams,
		"path_variables": bPathVars,
		"auth":           bAuth,
		"headers":        bHeaders,
		"body":           bBody,
	}

	req, err := u.requestRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update request").Write()
		return nil, err
	}

	res := toRequestResponse(req)
	return &res, nil
}

func (u *collectionUsecase) DeleteRequest(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getRequestEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.requestRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete request").Write()
		return err
	}

	return nil
}

func (u *collectionUsecase) DuplicateRequest(ctx context.Context, ID uuid.UUID) (*collection.RequestResponse, error) {
	req, err := u.getRequestEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	newReq := collection.CollectionRequest{
		CollectionID:  req.CollectionID,
		FolderID:      req.FolderID,
		Name:          req.Name + " (copy)",
		Slug:          req.Slug + "-copy",
		Method:        req.Method,
		URL:           req.URL,
		QueryParams:   req.QueryParams,
		PathVariables: req.PathVariables,
		Auth:          req.Auth,
		Headers:       req.Headers,
		Body:          req.Body,
		Idx:           req.Idx + 1,
	}

	inserted, err := u.requestRepo.Insert(ctx, newReq, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate request").Write()
		return nil, err
	}

	// Duplicate examples for this request
	examples, _ := u.exampleRepo.FindAll(ctx, map[string]any{"request_id": ID})
	for _, ex := range examples {
		u.exampleRepo.Insert(ctx, collection.CollectionExample{ //nolint:errcheck
			CollectionID:    inserted.CollectionID,
			RequestID:       inserted.ID,
			Name:            ex.Name,
			Slug:            ex.Slug,
			Method:          ex.Method,
			URL:             ex.URL,
			QueryParams:     ex.QueryParams,
			PathVariables:   ex.PathVariables,
			Auth:            ex.Auth,
			Headers:         ex.Headers,
			Body:            ex.Body,
			ResponseBody:    ex.ResponseBody,
			ResponseHeaders: ex.ResponseHeaders,
			ResponseCookies: ex.ResponseCookies,
			Status:          ex.Status,
			StatusText:      ex.StatusText,
			Idx:             ex.Idx,
		}, nil)
	}

	res := toRequestResponse(inserted)
	return &res, nil
}

func toExampleResponse(e collection.CollectionExample) collection.ExampleResponse {
	res := collection.ExampleResponse{
		ID:           e.ID,
		CollectionID: e.CollectionID,
		RequestID:    e.RequestID,
		Name:         e.Name,
		Slug:         e.Slug,
		Method:       e.Method,
		URL:          e.URL,
		ResponseBody: e.ResponseBody,
		Status:       e.Status,
		StatusText:   e.StatusText,
		Idx:          e.Idx,
	}

	json.Unmarshal(e.QueryParams, &res.QueryParams)
	json.Unmarshal(e.PathVariables, &res.PathVariables)
	json.Unmarshal(e.Auth, &res.Auth)
	json.Unmarshal(e.Headers, &res.Headers)
	json.Unmarshal(e.Body, &res.Body)
	json.Unmarshal(e.ResponseHeaders, &res.ResponseHeaders)
	json.Unmarshal(e.ResponseCookies, &res.ResponseCookies)

	if res.QueryParams == nil {
		res.QueryParams = make([]collection.KeyValueFull, 0)
	}
	if res.PathVariables == nil {
		res.PathVariables = make([]collection.KeyValueFull, 0)
	}
	if res.Headers == nil {
		res.Headers = make([]collection.KeyValueFull, 0)
	}
	if res.ResponseHeaders == nil {
		res.ResponseHeaders = make([]collection.KeyValue, 0)
	}
	if res.ResponseCookies == nil {
		res.ResponseCookies = make([]collection.KeyValue, 0)
	}
	if res.Auth.Type == "" {
		res.Auth.Type = "none"
	}
	if res.Body.Type == "" {
		res.Body.Type = "none"
	}

	return res
}

func (u *collectionUsecase) getExampleEntity(ctx context.Context, ID uuid.UUID) (*collection.CollectionExample, error) {
	ex, err := u.exampleRepo.FindById(ctx, ID)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to get example").Write()
		return nil, err
	} else if ex == nil {
		return nil, errors.NewNotFoundError("example not found")
	}

	return ex, nil
}

func (u *collectionUsecase) CreateExample(ctx context.Context, payload collection.CreateExampleRequest) (*collection.ExampleResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))

	conds := map[string]any{"request_id": payload.RequestID}
	maxIdx, err := u.exampleRepo.FindMaxIdx(ctx, conds)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to find max idx").Write()
		return nil, err
	}

	bQryParams, _ := json.Marshal(payload.QueryParams)
	bPathVars, _ := json.Marshal(payload.PathVariables)
	bAuth, _ := json.Marshal(payload.Auth)
	bHeaders, _ := json.Marshal(payload.Headers)
	bBody, _ := json.Marshal(payload.Body)
	bRespHeaders, _ := json.Marshal(payload.ResponseHeaders)
	bRespCookies, _ := json.Marshal(payload.ResponseCookies)

	entity := collection.CollectionExample{
		CollectionID:    payload.CollectionID,
		RequestID:       payload.RequestID,
		Name:            payload.Name,
		Slug:            slug,
		Method:          payload.Method,
		URL:             payload.URL,
		QueryParams:     bQryParams,
		PathVariables:   bPathVars,
		Auth:            bAuth,
		Headers:         bHeaders,
		Body:            bBody,
		ResponseBody:    payload.ResponseBody,
		ResponseHeaders: bRespHeaders,
		ResponseCookies: bRespCookies,
		Status:          payload.Status,
		StatusText:      payload.StatusText,
		Idx:             maxIdx + 1,
	}

	inserted, err := u.exampleRepo.Insert(ctx, entity, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to create example").Write()
		return nil, err
	}

	res := toExampleResponse(inserted)
	return &res, nil
}

func (u *collectionUsecase) GetExample(ctx context.Context, ID uuid.UUID) (*collection.ExampleResponse, error) {
	ex, err := u.getExampleEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	res := toExampleResponse(*ex)
	return &res, nil
}

func (u *collectionUsecase) RenameExample(ctx context.Context, ID uuid.UUID, payload collection.RenameExampleRequest) (*collection.ExampleResponse, error) {
	_, err := u.getExampleEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-"))
	update := map[string]any{
		"name": payload.Name,
		"slug": slug,
	}

	ex, err := u.exampleRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to rename example").Write()
		return nil, err
	}

	res := toExampleResponse(ex)
	return &res, nil
}

func (u *collectionUsecase) UpdateExample(ctx context.Context, ID uuid.UUID, payload collection.UpdateExampleRequest) (*collection.ExampleResponse, error) {
	_, err := u.getExampleEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	bQryParams, _ := json.Marshal(payload.QueryParams)
	bPathVars, _ := json.Marshal(payload.PathVariables)
	bAuth, _ := json.Marshal(payload.Auth)
	bHeaders, _ := json.Marshal(payload.Headers)
	bBody, _ := json.Marshal(payload.Body)
	bRespHeaders, _ := json.Marshal(payload.ResponseHeaders)
	bRespCookies, _ := json.Marshal(payload.ResponseCookies)

	update := map[string]any{
		"name":             payload.Name,
		"slug":             strings.ToLower(strings.ReplaceAll(payload.Name, " ", "-")),
		"method":           payload.Method,
		"url":              payload.URL,
		"query_params":     bQryParams,
		"path_variables":   bPathVars,
		"auth":             bAuth,
		"headers":          bHeaders,
		"body":             bBody,
		"response_body":    payload.ResponseBody,
		"response_headers": bRespHeaders,
		"response_cookies": bRespCookies,
		"status":           payload.Status,
		"status_text":      payload.StatusText,
	}

	ex, err := u.exampleRepo.UpdateById(ctx, ID, update, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to update example").Write()
		return nil, err
	}

	res := toExampleResponse(ex)
	return &res, nil
}

func (u *collectionUsecase) DeleteExample(ctx context.Context, ID uuid.UUID) error {
	_, err := u.getExampleEntity(ctx, ID)
	if err != nil {
		return err
	}

	if err := u.exampleRepo.DeleteById(ctx, ID, nil); err != nil {
		logger.Error(ctx, err, "❌ Failed to delete example").Write()
		return err
	}

	return nil
}

func (u *collectionUsecase) DuplicateExample(ctx context.Context, ID uuid.UUID) (*collection.ExampleResponse, error) {
	ex, err := u.getExampleEntity(ctx, ID)
	if err != nil {
		return nil, err
	}

	newEx := collection.CollectionExample{
		CollectionID:    ex.CollectionID,
		RequestID:       ex.RequestID,
		Name:            ex.Name + " (copy)",
		Slug:            ex.Slug + "-copy",
		Method:          ex.Method,
		URL:             ex.URL,
		QueryParams:     ex.QueryParams,
		PathVariables:   ex.PathVariables,
		Auth:            ex.Auth,
		Headers:         ex.Headers,
		Body:            ex.Body,
		ResponseBody:    ex.ResponseBody,
		ResponseHeaders: ex.ResponseHeaders,
		ResponseCookies: ex.ResponseCookies,
		Status:          ex.Status,
		StatusText:      ex.StatusText,
		Idx:             ex.Idx + 1,
	}

	inserted, err := u.exampleRepo.Insert(ctx, newEx, nil)
	if err != nil {
		logger.Error(ctx, err, "❌ Failed to duplicate example").Write()
		return nil, err
	}

	res := toExampleResponse(inserted)
	return &res, nil
}
