package account

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"

	"github.com/google/uuid"
)

var (
	ErrAccountNotFound = errors.New("account not found")
	ErrAccountNotOwned = errors.New("account does not belong to you")
	ErrAccountInactive = errors.New("account is inactive")
)

type Service interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateRequest) (*Account, error)
	GetByID(ctx context.Context, id, userID uuid.UUID) (*Account, error)
	GetByAccountNumber(ctx context.Context, number string) (*Account, error)
	GetUserAccounts(ctx context.Context, userID uuid.UUID) ([]*Account, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, userID uuid.UUID, req CreateRequest) (*Account, error) {
	number, err := s.generateUniqueAccountNumber(ctx)
	if err != nil {
		return nil, err
	}

	acc := &Account{
		ID:            uuid.New(),
		UserID:        userID,
		AccountNumber: number,
		Type:          req.Type,
		Balance:       0,
		Currency:      "THB",
		IsActive:      true,
	}

	if err := s.repo.Create(ctx, acc); err != nil {
		return nil, err
	}

	return acc, nil
}

func (s *service) GetByID(ctx context.Context, id, userID uuid.UUID) (*Account, error) {
	acc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, ErrAccountNotFound
	}
	if acc.UserID != userID {
		return nil, ErrAccountNotOwned
	}
	return acc, nil
}

func (s *service) GetByAccountNumber(ctx context.Context, number string) (*Account, error) {
	acc, err := s.repo.GetByAccountNumber(ctx, number)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, ErrAccountNotFound
	}
	return acc, nil
}

func (s *service) GetUserAccounts(ctx context.Context, userID uuid.UUID) ([]*Account, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *service) generateUniqueAccountNumber(ctx context.Context) (string, error) {
	for range 10 {
		n, err := rand.Int(rand.Reader, big.NewInt(9_000_000_000))
		if err != nil {
			return "", err
		}
		number := fmt.Sprintf("%010d", n.Int64()+1_000_000_000)
		existing, err := s.repo.GetByAccountNumber(ctx, number)
		if err != nil {
			return "", err
		}
		if existing == nil {
			return number, nil
		}
	}
	return "", errors.New("failed to generate unique account number")
}
