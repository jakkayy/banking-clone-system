package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jakkayy/banking/internal/account"
	"github.com/jakkayy/banking/internal/auth"
	"github.com/jakkayy/banking/internal/config"
	"github.com/jakkayy/banking/internal/database"
	"github.com/jakkayy/banking/internal/middleware"
	"github.com/jakkayy/banking/internal/transaction"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer db.Close()

	// Wire dependencies
	authRepo := auth.NewRepository(db)
	authSvc := auth.NewService(authRepo, cfg)
	authHandler := auth.NewHandler(authSvc)

	accountRepo := account.NewRepository(db)
	accountSvc := account.NewService(accountRepo)
	accountHandler := account.NewHandler(accountSvc)

	txRepo := transaction.NewRepository(db)
	txSvc := transaction.NewService(txRepo, accountRepo)
	txHandler := transaction.NewHandler(txSvc)

	// Router
	r := gin.Default()
	r.Use(corsMiddleware())

	v1 := r.Group("/api/v1")

	authRoutes := v1.Group("/auth")
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.GET("/me", middleware.Auth(cfg), authHandler.Me)
	}

	accountRoutes := v1.Group("/accounts", middleware.Auth(cfg))
	{
		accountRoutes.POST("", accountHandler.Create)
		accountRoutes.GET("", accountHandler.GetAll)
		accountRoutes.GET("/:id", accountHandler.GetByID)
	}

	txRoutes := v1.Group("/transactions", middleware.Auth(cfg))
	{
		txRoutes.POST("/transfer", txHandler.Transfer)
		txRoutes.POST("/deposit", txHandler.Deposit)
		txRoutes.POST("/withdraw", txHandler.Withdraw)
		txRoutes.GET("", txHandler.GetHistory)
		txRoutes.GET("/:id", txHandler.GetByID)
	}

	log.Printf("Server running on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("start server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
