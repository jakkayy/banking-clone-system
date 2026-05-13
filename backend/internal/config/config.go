package config

import (
	"errors"
	"os"
	"time"

	"github.com/joho/godotenv"
)

const defaultJWTSecret = "change-this-secret"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	RedisURL   string
	JWTSecret  string
	JWTExpiry  time.Duration
	ServerPort string
	CORSOrigin string
}

func Load() (*Config, error) {
	godotenv.Load()

	jwtExpiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		jwtExpiry = 24 * time.Hour
	}

	secret := getEnv("JWT_SECRET", defaultJWTSecret)
	if secret == defaultJWTSecret || len(secret) < 32 {
		return nil, errors.New("JWT_SECRET must be set to a random string of at least 32 characters")
	}

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "banking_user"),
		DBPassword: getEnv("DB_PASSWORD", "banking_password"),
		DBName:     getEnv("DB_NAME", "banking_db"),
		RedisURL:   getEnv("REDIS_URL", "localhost:6379"),
		JWTSecret:  secret,
		JWTExpiry:  jwtExpiry,
		ServerPort: getEnv("SERVER_PORT", "8080"),
		CORSOrigin: getEnv("CORS_ORIGIN", "*"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
