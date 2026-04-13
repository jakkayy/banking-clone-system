package auth

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

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrEmailExists) {
			response.Error(c, http.StatusConflict, err.Error())
			return
		}
		response.InternalError(c)
		return
	}

	response.OK(c, http.StatusCreated, "registration successful", result)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials):
			response.Error(c, http.StatusUnauthorized, err.Error())
		case errors.Is(err, ErrAccountLocked):
			response.Error(c, http.StatusTooManyRequests, err.Error())
		default:
			response.InternalError(c)
		}
		return
	}

	response.OK(c, http.StatusOK, "login successful", result)
}

func (h *Handler) Me(c *gin.Context) {
	rawID, _ := c.Get("userID")
	id, err := uuid.Parse(rawID.(string))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}
		response.InternalError(c)
		return
	}

	response.OK(c, http.StatusOK, "", user)
}
