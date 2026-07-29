package config

import (
	"os"
	"path/filepath"
	"time"

	"github.com/spf13/viper"
)

var ContextTimeout time.Duration
var Application ApplicationConfig
var DB DBConfig
var HttpServer HttpServerConfig
var Logger LoggerConfig
var CircuitBreaker CircuitBreakerConfig
var HttpClient HttpClientConfig

type Environment string

const (
	EnvLocal Environment = "local"
	EnvDev   Environment = "development"
	EnvStag  Environment = "staging"
	EnvProd  Environment = "production"
)

type ApplicationConfig struct {
	Name string      `mapstructure:"APP_NAME"`
	Env  Environment `mapstructure:"APP_ENV"`
	Port int         `mapstructure:"APP_PORT"`
}

type DBConfig struct {
	Name               string        `mapstructure:"DB_NAME"`
	AutoMigrate        bool          `mapstructure:"DB_AUTO_MIGRATE"`
	MaxOpenConnections int           `mapstructure:"DB_MAX_OPEN_CONNECTIONS"`
	MaxIdleConnections int           `mapstructure:"DB_MAX_IDLE_CONNECTIONS"`
	ConnMaxLifetime    time.Duration `mapstructure:"DB_CONN_MAX_LIFETIME"`
	InsertBatchSize    int           `mapstructure:"DB_INSERT_BATCH_SIZE"`
}

type HttpServerConfig struct {
	ReadTimeout       time.Duration `mapstructure:"HTTP_SERVER_READ_TIMEOUT"`
	ReadHeaderTimeout time.Duration `mapstructure:"HTTP_SERVER_READ_HEADER_TIMEOUT"`
	WriteTimeout      time.Duration `mapstructure:"HTTP_SERVER_WRITE_TIMEOUT"`
	IdleTimeout       time.Duration `mapstructure:"HTTP_SERVER_IDLE_TIMEOUT"`
}

type LoggerConfig struct {
	Level int `mapstructure:"LOGGER_LEVEL"`
}

type CircuitBreakerConfig struct {
	MinRequests  int           `mapstructure:"CIRCUIT_BREAKER_MIN_REQUESTS"`
	FailureRatio float64       `mapstructure:"CIRCUIT_BREAKER_FAILURE_RATIO"`
	Timeout      time.Duration `mapstructure:"CIRCUIT_BREAKER_TIMEOUT"`
	MaxRequests  int           `mapstructure:"CIRCUIT_BREAKER_MAX_REQUESTS"`
}

type HttpClientConfig struct {
	RetryCount    int           `mapstructure:"HTTP_CLIENT_RETRY_COUNT"`
	RetryWaitTime time.Duration `mapstructure:"HTTP_CLIENT_RETRY_WAIT_TIME"`
}

var (
	HomeDir, _ = os.UserHomeDir()
	ConfigDir  = filepath.Join(HomeDir, ".paperjet")
	ConfigPath = filepath.Join(ConfigDir, "config")
)

func Load() (err error) {
	viper.SetConfigName("config")
	viper.AddConfigPath(ConfigDir)
	viper.AddConfigPath(".")

	setDefaultConfig()

	if err = viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return
		}
		if err = os.MkdirAll(ConfigDir, 0755); err == nil {
			viper.SafeWriteConfigAs(ConfigPath)
		}
	}

	// Unmarshal each section explicitly
	if err = viper.Unmarshal(&Application); err != nil {
		return
	}
	if err = viper.Unmarshal(&DB); err != nil {
		return
	}
	if err = viper.Unmarshal(&HttpServer); err != nil {
		return
	}
	if err = viper.Unmarshal(&Logger); err != nil {
		return
	}
	if err = viper.Unmarshal(&CircuitBreaker); err != nil {
		return
	}
	if err = viper.Unmarshal(&HttpClient); err != nil {
		return
	}

	ContextTimeout = viper.GetDuration("CONTEXT_TIMEOUT")

	return
}

func setDefaultConfig() {
	viper.SetDefault("CONTEXT_TIMEOUT", "5s")

	// Application defaults
	viper.SetDefault("APP_NAME", "paperjet")
	viper.SetDefault("APP_PORT", 8080)
	viper.SetDefault("APP_ENV", "local")

	// DB defaults
	viper.SetDefault("DB_NAME", filepath.Join(ConfigDir, "paperjet.db"))
	viper.SetDefault("DB_AUTO_MIGRATE", true)
	viper.SetDefault("DB_MAX_OPEN_CONNECTIONS", 10)
	viper.SetDefault("DB_MAX_IDLE_CONNECTIONS", 10)
	viper.SetDefault("DB_CONN_MAX_LIFETIME", "300s")
	viper.SetDefault("DB_INSERT_BATCH_SIZE", 100)

	// HTTP Server defaults (in seconds)
	viper.SetDefault("HTTP_SERVER_READ_TIMEOUT", "5s")
	viper.SetDefault("HTTP_SERVER_READ_HEADER_TIMEOUT", "2s")
	viper.SetDefault("HTTP_SERVER_WRITE_TIMEOUT", "10s")
	viper.SetDefault("HTTP_SERVER_IDLE_TIMEOUT", "120s")

	// Logger defaults
	viper.SetDefault("LOGGER_LEVEL", "0")

	// Circuit Breaker defaults
	viper.SetDefault("CIRCUIT_BREAKER_MIN_REQUESTS", 3)
	viper.SetDefault("CIRCUIT_BREAKER_FAILURE_RATIO", 0.5)
	viper.SetDefault("CIRCUIT_BREAKER_TIMEOUT", "60s")
	viper.SetDefault("CIRCUIT_BREAKER_MAX_REQUESTS", 1)

	// HTTP Client defaults
	viper.SetDefault("HTTP_CLIENT_RETRY_COUNT", 1)
	viper.SetDefault("HTTP_CLIENT_RETRY_WAIT_TIME", "1s")
}
