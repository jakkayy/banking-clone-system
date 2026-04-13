package account

import (
	"time"

	"github.com/google/uuid"
)

type Type string

const (
	TypeSavings  Type = "savings"
	TypeChecking Type = "checking"
)

type Account struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	AccountNumber string    `json:"account_number"`
	Type          Type      `json:"type"`
	Balance       float64   `json:"balance"`
	Currency      string    `json:"currency"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Type Type `json:"type" binding:"required,oneof=savings checking"`
}
