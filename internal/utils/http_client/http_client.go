package httpclient

import (
	"context"
	"time"

	"github.com/go-resty/resty/v2"
)

type HttpClient struct {
	httpClient *resty.Client
}

func NewHttpClient() *HttpClient {
	return &HttpClient{
		httpClient: resty.New().SetDebug(false),
	}
}

type HttpRequest struct {
	Method   string
	URL      string
	Headers  map[string]string
	Body     any
	FormData map[string]string
	Files    map[string]string
}

type HttpResponse struct {
	Status     int
	StatusText string
	Body       []byte
	Headers    map[string]string
	Cookies    map[string]string
	Size       int64
	Timing     Timing
}

type Timing struct {
	DNSLookup    time.Duration
	TCPConnTime  time.Duration
	TLSHandshake time.Duration
	ConnTime     time.Duration
	ConnIdleTime time.Duration
	ServerTime   time.Duration
	ResponseTime time.Duration
	TotalTime    time.Duration
}

func (h *HttpClient) Execute(ctx context.Context, payload HttpRequest) (*HttpResponse, error) {
	req := h.httpClient.NewRequest().SetContext(ctx).EnableTrace()
	if payload.Body != nil {
		req.SetBody(payload.Body)
	}
	if len(payload.FormData) > 0 {
		req.SetFormData(payload.FormData)
	}
	if len(payload.Headers) > 0 {
		req.SetHeaders(payload.Headers)
	}
	if len(payload.Files) > 0 {
		req.SetFiles(payload.Files)
	}

	res, err := req.Execute(payload.Method, payload.URL)
	if err != nil {
		return nil, err
	}

	headers := make(map[string]string)
	for k, v := range res.Header() {
		if len(v) > 0 {
			headers[k] = v[0]
		}
	}

	cookies := make(map[string]string)
	for _, cookie := range res.Cookies() {
		if len(cookie.Value) > 0 {
			cookies[cookie.Name] = cookie.Value
		}
	}

	ti := res.Request.TraceInfo()

	return &HttpResponse{
		Status:     res.StatusCode(),
		StatusText: res.Status(),
		Body:       res.Body(),
		Headers:    headers,
		Cookies:    cookies,
		Size:       res.Size(),
		Timing: Timing{
			DNSLookup:    ti.DNSLookup,
			TCPConnTime:  ti.TCPConnTime,
			TLSHandshake: ti.TLSHandshake,
			ConnTime:     ti.ConnTime,
			ConnIdleTime: ti.ConnIdleTime,
			ServerTime:   ti.ServerTime,
			ResponseTime: ti.ResponseTime,
			TotalTime:    ti.TotalTime,
		},
	}, nil
}
