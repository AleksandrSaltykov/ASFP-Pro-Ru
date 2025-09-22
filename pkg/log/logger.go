package log

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	zlog "github.com/rs/zerolog/log"
)

// Init configures zerolog according to environment.
func Init(env string) zerolog.Logger {
	level := zerolog.InfoLevel
	switch strings.ToLower(env) {
	case "debug", "dev", "development":
		level = zerolog.DebugLevel
	case "test":
		level = zerolog.WarnLevel
	case "prod", "production":
		level = zerolog.InfoLevel
	}

	zerolog.TimeFieldFormat = time.RFC3339Nano
	logger := zlog.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	logger = logger.Level(level)
	return logger
}
