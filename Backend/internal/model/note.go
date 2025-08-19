package model

import "time"

// Folder represents a folder in the system
type Folder struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// Note represents a note in the system
type Note struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	FolderID   *int      `json:"folder_id"` // Pointer to int for nullable foreign key
	OrderIndex int       `json:"order_index" db:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// NoteWithFolder represents a note with its folder information
type NoteWithFolder struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	FolderID   *int      `json:"folder_id"`
	FolderName *string   `json:"folder_name"` // Name of the folder (nullable)
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
