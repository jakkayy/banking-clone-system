package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Body struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Body{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, Body{
		Success: false,
		Message: message,
	})
}

func InternalError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "internal server error")
}
