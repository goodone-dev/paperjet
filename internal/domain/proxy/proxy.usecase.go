package proxy

import (
	"context"
)

type ProxyUsecase interface {
	SendRequest(ctx context.Context, payload ProxyPayload) (*ProxyResponse, error)
}
