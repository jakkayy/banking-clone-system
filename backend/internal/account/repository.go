package account

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, account *Account) error
	GetByID(ctx context.Context, id uuid.UUID) (*Account, error)
	GetByIDWithLock(ctx context.Context, tx *sql.Tx, id uuid.UUID) (*Account, error)
	GetByAccountNumber(ctx context.Context, number string) (*Account, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*Account, error)
	UpdateBalance(ctx context.Context, tx *sql.Tx, id uuid.UUID, delta float64) error
}

type postgresRepository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) Create(ctx context.Context, acc *Account) error {
	query := `
		INSERT INTO accounts (id, user_id, account_number, type, balance, currency)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at`

	return r.db.QueryRowContext(ctx, query,
		acc.ID, acc.UserID, acc.AccountNumber, acc.Type, acc.Balance, acc.Currency,
	).Scan(&acc.CreatedAt, &acc.UpdatedAt)
}

func (r *postgresRepository) GetByID(ctx context.Context, id uuid.UUID) (*Account, error) {
	query := `
		SELECT id, user_id, account_number, type, balance, currency, is_active, created_at, updated_at
		FROM accounts WHERE id = $1`

	acc := &Account{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&acc.ID, &acc.UserID, &acc.AccountNumber, &acc.Type,
		&acc.Balance, &acc.Currency, &acc.IsActive, &acc.CreatedAt, &acc.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return acc, err
}

func (r *postgresRepository) GetByIDWithLock(ctx context.Context, tx *sql.Tx, id uuid.UUID) (*Account, error) {
	query := `
		SELECT id, user_id, account_number, type, balance, currency, is_active, created_at, updated_at
		FROM accounts WHERE id = $1 FOR UPDATE`

	acc := &Account{}
	err := tx.QueryRowContext(ctx, query, id).Scan(
		&acc.ID, &acc.UserID, &acc.AccountNumber, &acc.Type,
		&acc.Balance, &acc.Currency, &acc.IsActive, &acc.CreatedAt, &acc.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return acc, err
}

func (r *postgresRepository) GetByAccountNumber(ctx context.Context, number string) (*Account, error) {
	query := `
		SELECT id, user_id, account_number, type, balance, currency, is_active, created_at, updated_at
		FROM accounts WHERE account_number = $1`

	acc := &Account{}
	err := r.db.QueryRowContext(ctx, query, number).Scan(
		&acc.ID, &acc.UserID, &acc.AccountNumber, &acc.Type,
		&acc.Balance, &acc.Currency, &acc.IsActive, &acc.CreatedAt, &acc.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return acc, err
}

func (r *postgresRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*Account, error) {
	query := `
		SELECT id, user_id, account_number, type, balance, currency, is_active, created_at, updated_at
		FROM accounts WHERE user_id = $1 ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []*Account
	for rows.Next() {
		acc := &Account{}
		if err := rows.Scan(
			&acc.ID, &acc.UserID, &acc.AccountNumber, &acc.Type,
			&acc.Balance, &acc.Currency, &acc.IsActive, &acc.CreatedAt, &acc.UpdatedAt,
		); err != nil {
			return nil, err
		}
		accounts = append(accounts, acc)
	}
	return accounts, rows.Err()
}

func (r *postgresRepository) UpdateBalance(ctx context.Context, tx *sql.Tx, id uuid.UUID, delta float64) error {
	query := `UPDATE accounts SET balance = balance + $2, updated_at = NOW() WHERE id = $1`
	if tx != nil {
		_, err := tx.ExecContext(ctx, query, id, delta)
		return err
	}
	_, err := r.db.ExecContext(ctx, query, id, delta)
	return err
}
