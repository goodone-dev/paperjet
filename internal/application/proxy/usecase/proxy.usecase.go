package usecase

import (
	"context"
	"encoding/base64"
	"fmt"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/goodone-dev/paperjet/internal/domain/environment"
	"github.com/goodone-dev/paperjet/internal/domain/proxy"
	hc "github.com/goodone-dev/paperjet/internal/utils/http_client"
)

type proxyUsecase struct {
	httpClient *hc.HttpClient
}

func NewProxyUsecase() proxy.ProxyUsecase {
	return &proxyUsecase{
		httpClient: hc.NewHttpClient(),
	}
}

func (u *proxyUsecase) SendRequest(ctx context.Context, payload proxy.ProxyPayload) (*proxy.ProxyResponse, error) {
	var resolveEnv = func(text string) string {
		return u.resolveEnv(text, payload.EnvVariables)
	}

	var headers = make(map[string]string)
	for _, p := range payload.Headers {
		if p.Enabled && p.Key != "" {
			headers[resolveEnv(p.Key)] = resolveEnv(p.Value)
		}
	}

	switch payload.Auth.Type {
	case "bearer":
		if payload.Auth.Bearer == nil {
			break
		}

		headers["Authorization"] = fmt.Sprintf("Bearer %s", resolveEnv(payload.Auth.Bearer.Token))
	case "basic":
		if payload.Auth.Basic == nil {
			break
		}

		creds := fmt.Sprintf("%s:%s", resolveEnv(payload.Auth.Basic.Username), resolveEnv(payload.Auth.Basic.Password))
		headers["Authorization"] = fmt.Sprintf("Basic %s", base64.StdEncoding.EncodeToString([]byte(creds)))
	case "apikey":
		if payload.Auth.APIKey == nil {
			break
		}

		headers[resolveEnv(payload.Auth.APIKey.Key)] = resolveEnv(payload.Auth.APIKey.Value)
	}

	var body any
	var formData map[string]string
	var files = make(map[string]string)

	switch payload.Body.Type {
	case "form-data":
		if payload.Body.FormData == nil {
			break
		}

		headers["Content-Type"] = "multipart/form-data"

		var form = make(map[string]string)
		for _, p := range *payload.Body.FormData {
			if !p.Enabled || p.Key == "" {
				continue
			}

			if p.Type == "file" {
				files[resolveEnv(p.Key)] = resolveEnv(p.Value)
			} else {
				form[resolveEnv(p.Key)] = resolveEnv(p.Value)
			}
		}
		formData = form
	case "x-www-form-urlencoded":
		if payload.Body.UrlEncoded == nil {
			break
		}

		headers["Content-Type"] = "application/x-www-form-urlencoded"

		var form = make(map[string]string)
		for _, p := range *payload.Body.UrlEncoded {
			if p.Enabled && p.Key != "" {
				form[resolveEnv(p.Key)] = resolveEnv(p.Value)
			}
		}
		formData = form
	case "binary":
		if payload.Body.Binary == nil {
			break
		}

		filePath := resolveEnv(*payload.Body.Binary)

		mimeType := u.detectContentType(filePath)
		headers["Content-Type"] = mimeType

		file, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read binary file: %w", err)
		}
		body = file
	case "raw":
		if payload.Body.Raw == nil {
			break
		}

		switch payload.Body.Raw.Type {
		case "json":
			headers["Content-Type"] = "application/json"
		case "xml":
			headers["Content-Type"] = "application/xml"
		case "html":
			headers["Content-Type"] = "text/html"
		case "text":
			headers["Content-Type"] = "text/plain"
		}

		body = resolveEnv(payload.Body.Raw.Value)
	}

	finalUrl := resolveEnv(payload.URL)
	for _, p := range payload.PathVariables {
		if p.Enabled && p.Key != "" {
			re := regexp.MustCompile(fmt.Sprintf(`:%s\b`, regexp.QuoteMeta(p.Key)))
			encodedValue := url.QueryEscape(resolveEnv(p.Value))
			finalUrl = re.ReplaceAllString(finalUrl, encodedValue)
		}
	}

	request := hc.HttpRequest{
		Method:   payload.Method,
		URL:      finalUrl,
		Headers:  headers,
		Body:     body,
		FormData: formData,
		Files:    files,
	}

	res, err := u.httpClient.Execute(ctx, request)
	if err != nil {
		return nil, err
	}

	return &proxy.ProxyResponse{
		Status:     res.Status,
		StatusText: res.StatusText,
		Body:       res.Body,
		Cookies:    res.Cookies,
		Headers:    res.Headers,
		Size:       res.Size,
		Timing:     proxy.Timing(res.Timing),
	}, nil
}

func (u *proxyUsecase) resolveEnv(text string, envVariables []environment.EnvironmentVariable) string {
	if text == "" || len(envVariables) == 0 {
		return text
	}

	re := regexp.MustCompile(`\{\{([^{}]+)\}\}`)

	return re.ReplaceAllStringFunc(text, func(match string) string {
		submatch := re.FindStringSubmatch(match)
		if len(submatch) < 2 {
			return match
		}
		key := strings.TrimSpace(submatch[1])

		for _, p := range envVariables {
			if p.Enabled && p.Key == key {
				return p.Value
			}
		}

		return match
	})
}

func (u *proxyUsecase) detectContentType(filePath string) string {
	mimeType := mime.TypeByExtension(filepath.Ext(filePath))
	if mimeType == "" {
		buf := make([]byte, 512)
		f, err := os.Open(filePath)
		if err == nil {
			n, _ := f.Read(buf)
			mimeType = http.DetectContentType(buf[:n])
			f.Close()
		} else {
			mimeType = "application/octet-stream"
		}
	}

	return mimeType
}
