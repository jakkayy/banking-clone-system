package transaction

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jakkayy/banking/internal/response"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Transfer(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	t, err := h.service.Transfer(c.Request.Context(), getUserID(c), req)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response.OK(c, http.StatusCreated, "transfer successful", t)
}

func (h *Handler) Deposit(c *gin.Context) {
	var req DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	t, err := h.service.Deposit(c.Request.Context(), getUserID(c), req)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response.OK(c, http.StatusCreated, "deposit successful", t)
}

func (h *Handler) Withdraw(c *gin.Context) {
	var req WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	t, err := h.service.Withdraw(c.Request.Context(), getUserID(c), req)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response.OK(c, http.StatusCreated, "withdrawal successful", t)
}

func (h *Handler) GetHistory(c *gin.Context) {
	var query HistoryQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	txns, total, err := h.service.GetHistory(c.Request.Context(), getUserID(c), query)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response.OK(c, http.StatusOK, "", gin.H{
		"transactions": txns,
		"total":        total,
		"page":         query.Page,
		"limit":        query.Limit,
	})
}

func (h *Handler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid transaction id")
		return
	}

	t, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrTransactionNotFound) {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}
		response.InternalError(c)
		return
	}

	response.OK(c, http.StatusOK, "", t)
}

func (h *Handler) handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrAccountNotFound):
		response.Error(c, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrAccountNotOwned):
		response.Error(c, http.StatusForbidden, err.Error())
	case errors.Is(err, ErrAccountInactive):
		response.Error(c, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, ErrInsufficientFunds):
		response.Error(c, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, ErrSameAccount):
		response.Error(c, http.StatusBadRequest, err.Error())
	default:
		response.InternalError(c)
	}
}

func getUserID(c *gin.Context) uuid.UUID {
	raw, _ := c.Get("userID")
	id, _ := uuid.Parse(raw.(string))
	return id
}
