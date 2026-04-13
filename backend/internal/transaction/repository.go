package transaction

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, tx *sql.Tx, t *Transaction) error
	GetByID(ctx context.Context, id uuid.UUID) (*Transaction, error)
	GetByAccountID(ctx context.Context, accountID uuid.UUID, page, limit int) ([]*Transaction, int, error)
	BeginTx(ctx context.Context) (*sql.Tx, error)
}

type postgresRepository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, nil)
}

func (r *postgresRepository) Create(ctx context.Context, tx *sql.Tx, t *Transaction) error {
	query := `
		INSERT INTO transactions (id, reference_number, from_account_id, to_account_id, amount, type, status, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at`

	if tx != nil {
		return tx.QueryRowContext(ctx, query,
			t.ID, t.ReferenceNumber, t.FromAccountID, t.ToAccountID,
			t.Amount, t.Type, t.Status, t.Description,
		).Scan(&t.CreatedAt)
	}
	return r.db.QueryRowContext(ctx, query,
		t.ID, t.ReferenceNumber, t.FromAccountID, t.ToAccountID,
		t.Amount, t.Type, t.Status, t.Description,
	).Scan(&t.CreatedAt)
}

func (r *postgresRepository) GetByID(ctx context.Context, id uuid.UUID) (*Transaction, error) {
	query := `
		SELECT id, reference_number, from_account_id, to_account_id, amount, type, status, description, created_at
		FROM transactions WHERE id = $1`

	t := &Transaction{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&t.ID, &t.ReferenceNumber, &t.FromAccountID, &t.ToAccountID,
		&t.Amount, &t.Type, &t.Status, &t.Description, &t.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return t, err
}

func (r *postgresRepository) GetByAccountID(ctx context.Context, accountID uuid.UUID, page, limit int) ([]*Transaction, int, error) {
	countQuery := `SELECT COUNT(*) FROM transactions WHERE from_account_id = $1 OR to_account_id = $1`
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, accountID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := `
		SELECT id, reference_number, from_account_id, to_account_id, amount, type, status, description, created_at
		FROM transactions
		WHERE from_account_id = $1 OR to_account_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, accountID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var txns []*Transaction
	for rows.Next() {
		t := &Transaction{}
		if err := rows.Scan(
			&t.ID, &t.ReferenceNumber, &t.FromAccountID, &t.ToAccountID,
			&t.Amount, &t.Type, &t.Status, &t.Description, &t.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		txns = append(txns, t)
	}
	return txns, total, rows.Err()
}
