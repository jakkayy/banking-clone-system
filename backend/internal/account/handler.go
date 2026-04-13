package account

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

func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	acc, err := h.service.Create(c.Request.Context(), getUserID(c), req)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, http.StatusCreated, "account created", acc)
}

func (h *Handler) GetAll(c *gin.Context) {
	accounts, err := h.service.GetUserAccounts(c.Request.Context(), getUserID(c))
	if err != nil {
		response.InternalError(c)
		return
	}

	response.OK(c, http.StatusOK, "", accounts)
}

func (h *Handler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid account id")
		return
	}

	acc, err := h.service.GetByID(c.Request.Context(), id, getUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, ErrAccountNotFound):
			response.Error(c, http.StatusNotFound, err.Error())
		case errors.Is(err, ErrAccountNotOwned):
			response.Error(c, http.StatusForbidden, err.Error())
		default:
			response.InternalError(c)
		}
		return
	}

	response.OK(c, http.StatusOK, "", acc)
}

func getUserID(c *gin.Context) uuid.UUID {
	raw, _ := c.Get("userID")
	id, _ := uuid.Parse(raw.(string))
	return id
}
