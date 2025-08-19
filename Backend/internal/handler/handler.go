package handler

import (
	"backend/internal/model"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// NOTE HANDLERS
// ============================================================================

// HandleGet processes GET requests and returns all notes
func HandleGet(c *gin.Context) {
	rows, err := model.DB.Query("SELECT id, title, content, folder_id, order_index, created_at, updated_at FROM notes ORDER BY order_index ASC, created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch notes",
			"details": err.Error(),
		})
		return
	}
	defer rows.Close()

	var notes []model.Note
	for rows.Next() {
		var note model.Note
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &note.FolderID, &note.OrderIndex, &note.CreatedAt, &note.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to parse notes",
				"details": err.Error(),
			})
			return
		}
		notes = append(notes, note)
	}

	c.JSON(http.StatusOK, gin.H{
		"notes": notes,
		"count": len(notes),
	})
}

// HandlePost processes POST requests
func HandlePost(c *gin.Context) {
	var note model.Note

	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Get max order for proper ordering
	var maxOrder int
	err := model.DB.QueryRow("SELECT COALESCE(MAX(order_index), 0) FROM notes WHERE folder_id = ? OR (folder_id IS NULL AND ? IS NULL)", note.FolderID, note.FolderID).Scan(&maxOrder)
	if err != nil {
		maxOrder = 0
	}

	note.OrderIndex = maxOrder + 1
	note.CreatedAt = time.Now()
	note.UpdatedAt = time.Now()

	res, err := model.DB.Exec(
		"INSERT INTO notes (title, content, folder_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		note.Title, note.Content, note.FolderID, note.OrderIndex, note.CreatedAt, note.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create note",
			"details": err.Error(),
		})
		return
	}

	id, _ := res.LastInsertId()
	note.ID = int(id)

	c.JSON(http.StatusCreated, gin.H{
		"note":    note,
		"message": "Note created successfully",
	})
}

// HandleUpdate processes PUT requests to update a note
func HandleUpdate(c *gin.Context) {
	var note model.Note

	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	if note.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Note ID is required for update",
		})
		return
	}

	note.UpdatedAt = time.Now()

	result, err := model.DB.Exec(
		"UPDATE notes SET title = ?, content = ?, folder_id = ?, updated_at = ? WHERE id = ?",
		note.Title, note.Content, note.FolderID, note.UpdatedAt, note.ID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update note",
			"details": err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Note not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"note":    note,
		"message": "Note updated successfully",
	})
}

// HandleDelete processes DELETE requests to remove a note by ID
func HandleDelete(c *gin.Context) {
	var noteID int
	var err error

	if idParam := c.Param("id"); idParam != "" {
		noteID, err = strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid note ID in URL",
			})
			return
		}
	} else {
		type DeleteRequest struct {
			ID int `json:"id" binding:"required"`
		}
		var req DeleteRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid request body",
				"details": err.Error(),
			})
			return
		}
		noteID = req.ID
	}

	result, err := model.DB.Exec("DELETE FROM notes WHERE id = ?", noteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete note",
			"details": err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Note not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Note deleted successfully",
	})
}

// ============================================================================
// FOLDER HANDLERS
// ============================================================================

// HandleGetFolders returns all folders
func HandleGetFolders(c *gin.Context) {
	rows, err := model.DB.Query("SELECT id, name, created_at FROM folders ORDER BY created_at ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch folders",
			"details": err.Error(),
		})
		return
	}
	defer rows.Close()

	var folders []model.Folder
	for rows.Next() {
		var folder model.Folder
		err := rows.Scan(&folder.ID, &folder.Name, &folder.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to parse folders",
				"details": err.Error(),
			})
			return
		}
		folders = append(folders, folder)
	}

	c.JSON(http.StatusOK, gin.H{
		"folders": folders,
		"count":   len(folders),
	})
}

// HandleCreateFolder creates a new folder
func HandleCreateFolder(c *gin.Context) {
	var folder model.Folder

	if err := c.ShouldBindJSON(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	if folder.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Folder name is required",
		})
		return
	}

	folder.CreatedAt = time.Now()

	res, err := model.DB.Exec(
		"INSERT INTO folders (name, created_at) VALUES (?, ?)",
		folder.Name, folder.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create folder",
			"details": err.Error(),
		})
		return
	}

	id, _ := res.LastInsertId()
	folder.ID = int(id)

	c.JSON(http.StatusCreated, gin.H{
		"folder":  folder,
		"message": "Folder created successfully",
	})
}

// HandleUpdateFolder updates a folder name
func HandleUpdateFolder(c *gin.Context) {
	folderIDStr := c.Param("id")
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	var folder model.Folder
	if err := c.ShouldBindJSON(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	if folder.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Folder name is required",
		})
		return
	}

	result, err := model.DB.Exec(
		"UPDATE folders SET name = ? WHERE id = ?",
		folder.Name, folderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update folder",
			"details": err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	folder.ID = folderID
	c.JSON(http.StatusOK, gin.H{
		"folder":  folder,
		"message": "Folder updated successfully",
	})
}

// HandleDeleteFolder deletes a folder
func HandleDeleteFolder(c *gin.Context) {
	folderIDStr := c.Param("id")
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	// Check if folder has notes
	var noteCount int
	err = model.DB.QueryRow("SELECT COUNT(*) FROM notes WHERE folder_id = ?", folderID).Scan(&noteCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check folder notes",
		})
		return
	}

	if noteCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Cannot delete folder with notes",
			"message": fmt.Sprintf("Folder contains %d notes. Move or delete notes first.", noteCount),
		})
		return
	}

	result, err := model.DB.Exec("DELETE FROM folders WHERE id = ?", folderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete folder",
			"details": err.Error(),
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Folder deleted successfully",
	})
}

// HandleGetFolderNotes returns all notes in a specific folder
func HandleGetFolderNotes(c *gin.Context) {
	folderIDStr := c.Param("id")
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	// Check if folder exists
	var exists bool
	err = model.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM folders WHERE id = ?)", folderID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	rows, err := model.DB.Query(
		"SELECT id, title, content, folder_id, order_index, created_at, updated_at FROM notes WHERE folder_id = ? ORDER BY order_index DESC, created_at ASC",
		folderID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch notes",
			"details": err.Error(),
		})
		return
	}
	defer rows.Close()

	var notes []model.Note
	for rows.Next() {
		var note model.Note
		// FIXED: Added order_index to the scan
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &note.FolderID, &note.OrderIndex, &note.CreatedAt, &note.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to parse notes",
				"details": err.Error(),
			})
			return
		}
		notes = append(notes, note)
	}

	c.JSON(http.StatusOK, gin.H{
		"notes": notes,
		"count": len(notes),
	})
}

// HandleCreateFolderNote creates a new note in a specific folder
func HandleCreateFolderNote(c *gin.Context) {
	folderIDStr := c.Param("id")
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	// Check if folder exists
	var exists bool
	err = model.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM folders WHERE id = ?)", folderID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	var note model.Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Get max order for this folder to set proper order_index
	var maxOrder int
	err = model.DB.QueryRow("SELECT COALESCE(MAX(order_index), 0) FROM notes WHERE folder_id = ?", folderID).Scan(&maxOrder)
	if err != nil {
		maxOrder = 0
	}

	note.FolderID = &folderID
	note.OrderIndex = maxOrder + 1
	note.CreatedAt = time.Now()
	note.UpdatedAt = time.Now()

	res, err := model.DB.Exec(
		"INSERT INTO notes (title, content, folder_id, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		note.Title, note.Content, note.FolderID, note.OrderIndex, note.CreatedAt, note.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create note",
			"details": err.Error(),
		})
		return
	}

	id, _ := res.LastInsertId()
	note.ID = int(id)

	c.JSON(http.StatusCreated, gin.H{
		"note":    note,
		"message": "Note created successfully",
	})
}

// HandleReorderNotes handles reordering notes within a folder
func HandleReorderNotes(c *gin.Context) {
	folderIDStr := c.Param("id")
	folderID, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	// Check if folder exists
	var exists bool
	err = model.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM folders WHERE id = ?)", folderID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	var orderData struct {
		NoteOrder []struct {
			ID    int `json:"id"`
			Order int `json:"order"`
		} `json:"noteOrder"`
	}

	if err := c.ShouldBindJSON(&orderData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Start a transaction to ensure all updates happen together
	tx, err := model.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start transaction",
		})
		return
	}
	defer tx.Rollback()

	// Update each note's order
	for _, note := range orderData.NoteOrder {
		_, err := tx.Exec(`
			UPDATE notes 
			SET order_index = ? 
			WHERE id = ? AND folder_id = ?
		`, note.Order, note.ID, folderID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to update note order",
				"details": err.Error(),
			})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to commit transaction",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notes reordered successfully",
	})
}

// ============================================================================
// FILE ATTACHMENT HANDLERS
// ============================================================================

// HandleFileUpload handles file uploads for notes
func HandleFileUpload(c *gin.Context) {
	// Get note ID from URL
	noteIDStr := c.Param("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid note ID",
		})
		return
	}

	// Check if note exists
	var exists bool
	err = model.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM notes WHERE id = ?)", noteID).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Note not found",
		})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file uploaded",
		})
		return
	}
	defer file.Close()

	// Check file size (max 10MB)
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "File too large. Maximum size is 10MB",
		})
		return
	}

	// Generate secure filename
	filename := generateSecureFilename(header.Filename)
	filePath := fmt.Sprintf("./data/attachments/%s", filename)

	// Save file
	if err := saveFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save file",
		})
		return
	}

	// Store in database
	result, err := model.DB.Exec(
		"INSERT INTO attachments (note_id, filename, original_name, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		noteID, filename, header.Filename, header.Header.Get("Content-Type"), header.Size, time.Now(),
	)
	if err != nil {
		// Clean up file if database fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to store file info",
		})
		return
	}

	attachmentID, _ := result.LastInsertId()

	c.JSON(http.StatusCreated, gin.H{
		"attachment": gin.H{
			"id":            attachmentID,
			"note_id":       noteID,
			"filename":      filename,
			"original_name": header.Filename,
			"size":          header.Size,
		},
		"message": "File uploaded successfully",
	})
}

// HandleGetAttachments returns all attachments for a specific note
func HandleGetAttachments(c *gin.Context) {
	noteIDStr := c.Param("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid note ID",
		})
		return
	}

	// Get all attachments for this note
	rows, err := model.DB.Query(
		"SELECT id, filename, original_name, mime_type, size, created_at FROM attachments WHERE note_id = ? ORDER BY created_at DESC",
		noteID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch attachments",
		})
		return
	}
	defer rows.Close()

	var attachments []gin.H
	for rows.Next() {
		var id int
		var filename, originalName, mimeType string
		var size int64
		var createdAt time.Time

		err := rows.Scan(&id, &filename, &originalName, &mimeType, &size, &createdAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to parse attachments",
			})
			return
		}

		attachments = append(attachments, gin.H{
			"id":            id,
			"filename":      filename,
			"original_name": originalName,
			"mime_type":     mimeType,
			"size":          size,
			"created_at":    createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"attachments": attachments,
		"count":       len(attachments),
	})
}

// HandleServeFile serves the actual file to the browser
func HandleServeFile(c *gin.Context) {
	attachmentIDStr := c.Param("id")
	attachmentID, err := strconv.Atoi(attachmentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid attachment ID",
		})
		return
	}

	// Get file info from database
	var filename, originalName, mimeType string
	err = model.DB.QueryRow(
		"SELECT filename, original_name, mime_type FROM attachments WHERE id = ?",
		attachmentID,
	).Scan(&filename, &originalName, &mimeType)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Attachment not found",
		})
		return
	}

	// Check if file exists on disk
	filePath := fmt.Sprintf("./data/attachments/%s", filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "File not found on disk",
		})
		return
	}

	// Set headers and serve file
	c.Header("Content-Type", mimeType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", originalName))
	c.File(filePath)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// generateSecureFilename creates a unique filename
func generateSecureFilename(originalName string) string {
	ext := filepath.Ext(originalName)
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	randomString := hex.EncodeToString(randomBytes)
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%d_%s%s", timestamp, randomString, ext)
}

// saveFile saves uploaded file to disk
func saveFile(file multipart.File, filePath string) error {
	dst, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	return err
}

// ============================================================================
// WIREGUARD SYNC HANDLERS
// Add these to the end of your existing handler.go file
// ============================================================================

// SyncRequest represents a sync request from a device
type SyncRequest struct {
	DeviceID     string         `json:"device_id"`
	LastSync     time.Time      `json:"last_sync"`
	LocalNotes   []model.Note   `json:"local_notes"`
	LocalFolders []model.Folder `json:"local_folders"`
}

// SyncResponse represents the response to a sync request
type SyncResponse struct {
	Notes       []model.Note       `json:"notes"`
	Folders     []model.Folder     `json:"folders"`
	Attachments []model.Attachment `json:"attachments"`
	ServerTime  time.Time          `json:"server_time"`
	Success     bool               `json:"success"`
	Message     string             `json:"message"`
}

// HandleSyncHealth checks if sync endpoint is reachable
func HandleSyncHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now(),
		"message":   "WireGuard sync endpoint is ready",
		"server_ip": "10.100.0.1",
		"version":   "1.0",
	})
}

// HandleSync processes sync requests from devices
func HandleSync(c *gin.Context) {
	var syncReq SyncRequest

	if err := c.ShouldBindJSON(&syncReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid sync request",
			"details": err.Error(),
		})
		return
	}

	// Log sync attempt
	log.Printf("📱 Sync request from device: %s, last sync: %v", syncReq.DeviceID, syncReq.LastSync)

	// Start transaction for atomic sync
	tx, err := model.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start sync transaction",
		})
		return
	}
	defer tx.Rollback()

	// 1. SYNC FOLDERS FIRST (dependencies)
	if err := syncFolders(tx, syncReq.LocalFolders, syncReq.LastSync); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync folders",
			"details": err.Error(),
		})
		return
	}

	// 2. SYNC NOTES
	if err := syncNotes(tx, syncReq.LocalNotes, syncReq.LastSync); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync notes",
			"details": err.Error(),
		})
		return
	}

	// 3. GET UPDATED DATA FOR RESPONSE
	folders, err := getFoldersModifiedSince(tx, syncReq.LastSync)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get updated folders",
		})
		return
	}

	notes, err := getNotesModifiedSince(tx, syncReq.LastSync)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get updated notes",
		})
		return
	}

	attachments, err := getAttachmentsModifiedSince(tx, syncReq.LastSync)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get updated attachments",
		})
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to commit sync",
		})
		return
	}

	response := SyncResponse{
		Notes:       notes,
		Folders:     folders,
		Attachments: attachments,
		ServerTime:  time.Now(),
		Success:     true,
		Message:     fmt.Sprintf("Synced %d notes, %d folders, %d attachments", len(notes), len(folders), len(attachments)),
	}

	log.Printf("✅ Sync completed for device: %s - %s", syncReq.DeviceID, response.Message)
	c.JSON(http.StatusOK, response)
}

// HandleSyncAttachment serves attachment files for sync
func HandleSyncAttachment(c *gin.Context) {
	attachmentIDStr := c.Param("id")
	attachmentID, err := strconv.Atoi(attachmentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid attachment ID",
		})
		return
	}

	// Get file info from database
	var filename, originalName, mimeType string
	var size int64
	err = model.DB.QueryRow(
		"SELECT filename, original_name, mime_type, size FROM attachments WHERE id = ?",
		attachmentID,
	).Scan(&filename, &originalName, &mimeType, &size)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Attachment not found",
		})
		return
	}

	// Check if file exists
	filePath := fmt.Sprintf("./data/attachments/%s", filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "File not found on disk",
		})
		return
	}

	// Set headers for download
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", originalName))
	c.Header("Content-Length", fmt.Sprintf("%d", size))

	c.File(filePath)
}

// ============================================================================
// SYNC HELPER FUNCTIONS
// ============================================================================

// syncFolders handles folder synchronization
func syncFolders(tx *sql.Tx, localFolders []model.Folder, lastSync time.Time) error {
	for _, folder := range localFolders {
		// Check if folder exists on server
		var existingCreatedAt time.Time
		err := tx.QueryRow("SELECT created_at FROM folders WHERE id = ?", folder.ID).Scan(&existingCreatedAt)

		if err == sql.ErrNoRows {
			// Folder doesn't exist on server, insert it
			_, err = tx.Exec(
				"INSERT INTO folders (id, name, created_at) VALUES (?, ?, ?)",
				folder.ID, folder.Name, folder.CreatedAt,
			)
			if err != nil {
				return fmt.Errorf("failed to insert folder: %v", err)
			}
			log.Printf("📁 Inserted new folder: %s", folder.Name)
		} else if err != nil {
			return fmt.Errorf("failed to check folder existence: %v", err)
		}
		// For folders, we typically don't update name often
		// If needed, add update logic here based on created_at comparison
	}
	return nil
}

// syncNotes handles note synchronization with conflict resolution
func syncNotes(tx *sql.Tx, localNotes []model.Note, lastSync time.Time) error {
	for _, note := range localNotes {
		// Check if note exists on server
		var existingUpdatedAt time.Time
		err := tx.QueryRow("SELECT updated_at FROM notes WHERE id = ?", note.ID).Scan(&existingUpdatedAt)

		if err == sql.ErrNoRows {
			// Note doesn't exist on server, insert it
			_, err = tx.Exec(`
				INSERT INTO notes (id, title, content, folder_id, order_index, created_at, updated_at) 
				VALUES (?, ?, ?, ?, ?, ?, ?)`,
				note.ID, note.Title, note.Content, note.FolderID, note.OrderIndex, note.CreatedAt, note.UpdatedAt,
			)
			if err != nil {
				return fmt.Errorf("failed to insert note: %v", err)
			}
			log.Printf("📝 Inserted new note: %s", note.Title)
		} else if err != nil {
			return fmt.Errorf("failed to check note existence: %v", err)
		} else {
			// Note exists, check for conflicts (last-write-wins)
			if note.UpdatedAt.After(existingUpdatedAt) {
				_, err = tx.Exec(`
					UPDATE notes 
					SET title = ?, content = ?, folder_id = ?, order_index = ?, updated_at = ? 
					WHERE id = ?`,
					note.Title, note.Content, note.FolderID, note.OrderIndex, note.UpdatedAt, note.ID,
				)
				if err != nil {
					return fmt.Errorf("failed to update note: %v", err)
				}
				log.Printf("📝 Updated note: %s", note.Title)
			}
		}
	}
	return nil
}

// getFoldersModifiedSince returns folders modified since the given time
func getFoldersModifiedSince(tx *sql.Tx, since time.Time) ([]model.Folder, error) {
	rows, err := tx.Query("SELECT id, name, created_at FROM folders WHERE created_at > ? ORDER BY created_at", since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var folders []model.Folder
	for rows.Next() {
		var folder model.Folder
		err := rows.Scan(&folder.ID, &folder.Name, &folder.CreatedAt)
		if err != nil {
			return nil, err
		}
		folders = append(folders, folder)
	}
	return folders, nil
}

// getNotesModifiedSince returns notes modified since the given time
func getNotesModifiedSince(tx *sql.Tx, since time.Time) ([]model.Note, error) {
	rows, err := tx.Query(`
		SELECT id, title, content, folder_id, order_index, created_at, updated_at 
		FROM notes 
		WHERE updated_at > ? 
		ORDER BY updated_at`, since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []model.Note
	for rows.Next() {
		var note model.Note
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &note.FolderID, &note.OrderIndex, &note.CreatedAt, &note.UpdatedAt)
		if err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}
	return notes, nil
}

// getAttachmentsModifiedSince returns attachments modified since the given time
func getAttachmentsModifiedSince(tx *sql.Tx, since time.Time) ([]model.Attachment, error) {
	rows, err := tx.Query(`
		SELECT id, note_id, filename, original_name, mime_type, size, created_at 
		FROM attachments 
		WHERE created_at > ? 
		ORDER BY created_at`, since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attachments []model.Attachment
	for rows.Next() {
		var attachment model.Attachment
		err := rows.Scan(&attachment.ID, &attachment.NoteID, &attachment.Filename,
			&attachment.OriginalName, &attachment.MimeType, &attachment.Size, &attachment.CreatedAt)
		if err != nil {
			return nil, err
		}
		attachments = append(attachments, attachment)
	}
	return attachments, nil
}
