package transaction

import (
	"time"

	"github.com/google/uuid"
)

type Type string
type Status string

const (
	TypeTransfer   Type = "transfer"
	TypeDeposit    Type = "deposit"
	TypeWithdrawal Type = "withdrawal"
)

const (
	StatusPending   Status = "pending"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
)

type Transaction struct {
	ID              uuid.UUID  `json:"id"`
	ReferenceNumber string     `json:"reference_number"`
	FromAccountID   *uuid.UUID `json:"from_account_id,omitempty"`
	ToAccountID     *uuid.UUID `json:"to_account_id,omitempty"`
	Amount          float64    `json:"amount"`
	Type            Type       `json:"type"`
	Status          Status     `json:"status"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"created_at"`
}

type TransferRequest struct {
	FromAccountID   string  `json:"from_account_id" binding:"required"`
	ToAccountNumber string  `json:"to_account_number" binding:"required"`
	Amount          float64 `json:"amount" binding:"required,gt=0"`
	Description     string  `json:"description"`
}

type DepositRequest struct {
	AccountID   string  `json:"account_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
}

type WithdrawRequest struct {
	AccountID   string  `json:"account_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
}

type HistoryQuery struct {
	AccountID string `form:"account_id" binding:"required"`
	Page      int    `form:"page"`
	Limit     int    `form:"limit"`
}
