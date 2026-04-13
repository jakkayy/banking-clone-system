package transaction

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/jakkayy/banking/internal/account"
)

var (
	ErrAccountNotFound      = errors.New("account not found")
	ErrAccountNotOwned      = errors.New("account does not belong to you")
	ErrAccountInactive      = errors.New("account is inactive")
	ErrInsufficientFunds    = errors.New("insufficient funds")
	ErrSameAccount          = errors.New("cannot transfer to the same account")
	ErrTransactionNotFound  = errors.New("transaction not found")
)

type Service interface {
	Transfer(ctx context.Context, userID uuid.UUID, req TransferRequest) (*Transaction, error)
	Deposit(ctx context.Context, userID uuid.UUID, req DepositRequest) (*Transaction, error)
	Withdraw(ctx context.Context, userID uuid.UUID, req WithdrawRequest) (*Transaction, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Transaction, error)
	GetHistory(ctx context.Context, userID uuid.UUID, query HistoryQuery) ([]*Transaction, int, error)
}

type service struct {
	txRepo      Repository
	accountRepo account.Repository
}

func NewService(txRepo Repository, accountRepo account.Repository) Service {
	return &service{txRepo: txRepo, accountRepo: accountRepo}
}

func (s *service) Transfer(ctx context.Context, userID uuid.UUID, req TransferRequest) (*Transaction, error) {
	fromID, err := uuid.Parse(req.FromAccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	fromAcc, err := s.accountRepo.GetByID(ctx, fromID)
	if err != nil {
		return nil, err
	}
	if fromAcc == nil {
		return nil, ErrAccountNotFound
	}
	if fromAcc.UserID != userID {
		return nil, ErrAccountNotOwned
	}
	if !fromAcc.IsActive {
		return nil, ErrAccountInactive
	}

	toAcc, err := s.accountRepo.GetByAccountNumber(ctx, req.ToAccountNumber)
	if err != nil {
		return nil, err
	}
	if toAcc == nil {
		return nil, ErrAccountNotFound
	}
	if !toAcc.IsActive {
		return nil, ErrAccountInactive
	}
	if fromAcc.ID == toAcc.ID {
		return nil, ErrSameAccount
	}

	dbTx, err := s.txRepo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer dbTx.Rollback()

	// Lock rows in consistent order to prevent deadlock
	first, second := fromAcc.ID, toAcc.ID
	if fromAcc.ID.String() > toAcc.ID.String() {
		first, second = toAcc.ID, fromAcc.ID
	}
	lockedFirst, err := s.accountRepo.GetByIDWithLock(ctx, dbTx, first)
	if err != nil {
		return nil, err
	}
	_, err = s.accountRepo.GetByIDWithLock(ctx, dbTx, second)
	if err != nil {
		return nil, err
	}

	// Re-check balance on the locked row
	lockedFrom := lockedFirst
	if first == toAcc.ID {
		lockedFrom, _ = s.accountRepo.GetByIDWithLock(ctx, dbTx, fromAcc.ID)
	}
	if lockedFrom.Balance < req.Amount {
		return nil, ErrInsufficientFunds
	}

	if err := s.accountRepo.UpdateBalance(ctx, dbTx, fromAcc.ID, -req.Amount); err != nil {
		return nil, err
	}
	if err := s.accountRepo.UpdateBalance(ctx, dbTx, toAcc.ID, req.Amount); err != nil {
		return nil, err
	}

	fromID2 := fromAcc.ID
	toID := toAcc.ID
	t := &Transaction{
		ID:              uuid.New(),
		ReferenceNumber: generateRefNumber(),
		FromAccountID:   &fromID2,
		ToAccountID:     &toID,
		Amount:          req.Amount,
		Type:            TypeTransfer,
		Status:          StatusCompleted,
		Description:     req.Description,
	}
	if err := s.txRepo.Create(ctx, dbTx, t); err != nil {
		return nil, err
	}

	if err := dbTx.Commit(); err != nil {
		return nil, err
	}

	return t, nil
}

func (s *service) Deposit(ctx context.Context, userID uuid.UUID, req DepositRequest) (*Transaction, error) {
	accID, err := uuid.Parse(req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	acc, err := s.accountRepo.GetByID(ctx, accID)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, ErrAccountNotFound
	}
	if acc.UserID != userID {
		return nil, ErrAccountNotOwned
	}
	if !acc.IsActive {
		return nil, ErrAccountInactive
	}

	dbTx, err := s.txRepo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer dbTx.Rollback()

	if _, err := s.accountRepo.GetByIDWithLock(ctx, dbTx, accID); err != nil {
		return nil, err
	}

	if err := s.accountRepo.UpdateBalance(ctx, dbTx, accID, req.Amount); err != nil {
		return nil, err
	}

	toID := accID
	t := &Transaction{
		ID:              uuid.New(),
		ReferenceNumber: generateRefNumber(),
		ToAccountID:     &toID,
		Amount:          req.Amount,
		Type:            TypeDeposit,
		Status:          StatusCompleted,
		Description:     req.Description,
	}
	if err := s.txRepo.Create(ctx, dbTx, t); err != nil {
		return nil, err
	}

	if err := dbTx.Commit(); err != nil {
		return nil, err
	}

	return t, nil
}

func (s *service) Withdraw(ctx context.Context, userID uuid.UUID, req WithdrawRequest) (*Transaction, error) {
	accID, err := uuid.Parse(req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	acc, err := s.accountRepo.GetByID(ctx, accID)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, ErrAccountNotFound
	}
	if acc.UserID != userID {
		return nil, ErrAccountNotOwned
	}
	if !acc.IsActive {
		return nil, ErrAccountInactive
	}

	dbTx, err := s.txRepo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer dbTx.Rollback()

	locked, err := s.accountRepo.GetByIDWithLock(ctx, dbTx, accID)
	if err != nil {
		return nil, err
	}
	if locked.Balance < req.Amount {
		return nil, ErrInsufficientFunds
	}

	if err := s.accountRepo.UpdateBalance(ctx, dbTx, accID, -req.Amount); err != nil {
		return nil, err
	}

	fromID := accID
	t := &Transaction{
		ID:              uuid.New(),
		ReferenceNumber: generateRefNumber(),
		FromAccountID:   &fromID,
		Amount:          req.Amount,
		Type:            TypeWithdrawal,
		Status:          StatusCompleted,
		Description:     req.Description,
	}
	if err := s.txRepo.Create(ctx, dbTx, t); err != nil {
		return nil, err
	}

	if err := dbTx.Commit(); err != nil {
		return nil, err
	}

	return t, nil
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*Transaction, error) {
	t, err := s.txRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, ErrTransactionNotFound
	}
	return t, nil
}

func (s *service) GetHistory(ctx context.Context, userID uuid.UUID, query HistoryQuery) ([]*Transaction, int, error) {
	accID, err := uuid.Parse(query.AccountID)
	if err != nil {
		return nil, 0, ErrAccountNotFound
	}

	acc, err := s.accountRepo.GetByID(ctx, accID)
	if err != nil {
		return nil, 0, err
	}
	if acc == nil {
		return nil, 0, ErrAccountNotFound
	}
	if acc.UserID != userID {
		return nil, 0, ErrAccountNotOwned
	}

	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 || query.Limit > 100 {
		query.Limit = 20
	}

	return s.txRepo.GetByAccountID(ctx, accID, query.Page, query.Limit)
}

func generateRefNumber() string {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	return fmt.Sprintf("TXN%s%06d", time.Now().Format("20060102"), rng.Intn(999999))
}
