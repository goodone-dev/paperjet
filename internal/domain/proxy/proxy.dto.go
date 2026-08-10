package proxy

import (
	"time"

	"github.com/goodone-dev/paperjet/internal/domain/collection"
	"github.com/goodone-dev/paperjet/internal/domain/environment"
)

type ProxyPayload struct {
	Name          string                            `json:"name"`
	Method        string                            `json:"method"`
	URL           string                            `json:"url"`
	QueryParams   []collection.KeyValue             `json:"query_params"`
	PathVariables []collection.KeyValue             `json:"path_variables"`
	Auth          collection.Auth                   `json:"auth"`
	Headers       []collection.KeyValue             `json:"headers"`
	Body          collection.Body                   `json:"body"`
	EnvVariables  []environment.EnvironmentVariable `json:"env_variables"`
}

type ProxyResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	Headers    map[string]string `json:"headers"`
	Cookies    map[string]string `json:"cookies"`
	Body       []byte            `json:"body"`
	Size       int64             `json:"size"`
	Timing     Timing            `json:"timing"`
}

type Timing struct {
	DNSLookup    time.Duration `json:"dns_lookup"`
	TCPConnTime  time.Duration `json:"tcp_conn_time"`
	TLSHandshake time.Duration `json:"tls_handshake"`
	ConnTime     time.Duration `json:"conn_time"`
	ConnIdleTime time.Duration `json:"conn_idle_time"`
	ServerTime   time.Duration `json:"server_time"`
	ResponseTime time.Duration `json:"response_time"`
	TotalTime    time.Duration `json:"total_time"`
}
