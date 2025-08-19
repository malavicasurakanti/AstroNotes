package main

import (
	"log"
	"strings"
	"time"

	"backend/internal/handler"
	"backend/internal/model"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("🚀 Starting Notes App...")

	// Initialize database
	model.InitDB()
	log.Println("✅ Database initialized")

	// Setup HTTP routes
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1") {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			c.Header("Access-Control-Allow-Origin", "*")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// IMPORTANT: Add health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "Notes App Backend",
			"timestamp": time.Now(),
		})
	})

	// Note operations
	router.GET("/folders", handler.HandleGetFolders)
	router.POST("/folders", handler.HandleCreateFolder)
	router.PUT("/folders/:id", handler.HandleUpdateFolder)
	router.DELETE("/folders/:id", handler.HandleDeleteFolder)
	router.GET("/folders/:id/notes", handler.HandleGetFolderNotes)
	router.POST("/folders/:id/notes", handler.HandleCreateFolderNote)
	router.PUT("/update", handler.HandleUpdate)
	router.DELETE("/delete", handler.HandleDelete)

	// File operations
	router.POST("/files/:noteId", handler.HandleFileUpload)
	router.GET("/files/:id", handler.HandleServeFile)
	router.GET("/notes/:noteId/attachments", handler.HandleGetAttachments)

	// Sync endpoints
	router.GET("/sync/health", handler.HandleSyncHealth)
	router.POST("/sync", handler.HandleSync)
	router.GET("/sync/attachment/:id", handler.HandleSyncAttachment)

	log.Println("🌐 Starting HTTP server on :8080...")
	log.Println("✅ Notes app is running!")
	log.Println("🔗 Test: http://192.168.0.32:8080/health")

	// Start HTTP server on all interfaces
	if err := router.Run("0.0.0.0:8080"); err != nil {
		log.Fatal("❌ Failed to start HTTP server:", err)
	}
}
