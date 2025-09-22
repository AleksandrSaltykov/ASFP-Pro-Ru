package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// AppConfig describes shared service settings.
type AppConfig struct {
	AppName         string
	Env             string
	HTTPPort        string
	DatabaseURL     string
	RedisURL        string
	ClickHouseDSN   string
	TarantoolAddr   string
	TarantoolQueue  string
	S3Endpoint      string
	S3Region        string
	S3AccessKey     string
	S3SecretKey     string
	S3Bucket        string
	S3UseSSL        bool
	RequestTimeout  time.Duration
	ShutdownTimeout time.Duration
	MetricsEnable   bool
	EnablePprof     bool
}

// Load reads configuration values using the provided prefix. Unknown values fall back to safe defaults.
func Load(prefix string) (AppConfig, error) {
	p := func(key string) string {
		if prefix == "" {
			return key
		}
		return fmt.Sprintf("%s_%s", prefix, key)
	}

	cfg := AppConfig{
		Env:             getEnv(p("ENV"), "dev"),
		HTTPPort:        getEnv(p("HTTP_PORT"), "8080"),
		DatabaseURL:     os.Getenv(p("DATABASE_URL")),
		RedisURL:        getEnv(p("REDIS_URL"), "redis://redis:6379/0"),
		ClickHouseDSN:   getEnv(p("CLICKHOUSE_DSN"), "clickhouse://default:password@clickhouse:9000/analytics"),
		TarantoolAddr:   getEnv(p("TARANTOOL_ADDR"), "tarantool:3301"),
		TarantoolQueue:  getEnv(p("TARANTOOL_QUEUE"), "events_queue"),
		S3Endpoint:      getEnv(p("S3_ENDPOINT"), "http://ceph:7480"),
		S3Region:        getEnv(p("S3_REGION"), "ru-central"),
		S3AccessKey:     getEnv(p("S3_ACCESS_KEY"), "minio"),
		S3SecretKey:     getEnv(p("S3_SECRET_KEY"), "minio123"),
		S3Bucket:        getEnv(p("S3_BUCKET"), "asfp-files"),
		RequestTimeout:  getDuration(p("REQUEST_TIMEOUT"), 15*time.Second),
		ShutdownTimeout: getDuration(p("SHUTDOWN_TIMEOUT"), 10*time.Second),
		MetricsEnable:   getBool(p("METRICS"), true),
		EnablePprof:     getBool(p("PPROF"), false),
	}

	useSSL, err := parseBool(os.Getenv(p("S3_USE_SSL")), false)
	if err != nil {
		return AppConfig{}, fmt.Errorf("parse %s: %w", p("S3_USE_SSL"), err)
	}
	cfg.S3UseSSL = useSSL

	if cfg.DatabaseURL == "" {
		return AppConfig{}, fmt.Errorf("%s is required", p("DATABASE_URL"))
	}

	if cfg.AppName == "" {
		cfg.AppName = getEnv(p("APP_NAME"), prefix)
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseBool(value string, fallback bool) (bool, error) {
	if value == "" {
		return fallback, nil
	}
	b, err := strconv.ParseBool(value)
	if err != nil {
		return false, err
	}
	return b, nil
}

func getBool(key string, fallback bool) bool {
	v, err := parseBool(os.Getenv(key), fallback)
	if err != nil {
		return fallback
	}
	return v
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		d, err := time.ParseDuration(value)
		if err == nil {
			return d
		}
	}
	return fallback
}
