package model

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() {
	var err error

	// Create data directory if it doesn't exist
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		os.Mkdir("data", 0755)
	}

	DB, err = sql.Open("sqlite3", "./data/notes.db")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	// Create folders table if it doesn't exist
	createFoldersTable := `
    CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
	_, err = DB.Exec(createFoldersTable)
	if err != nil {
		log.Fatalf("Failed to create folders table: %v", err)
	}

	// Create notes table if it doesn't exist
	createNotesTable := `
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        folder_id INTEGER,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );`
	_, err = DB.Exec(createNotesTable)
	if err != nil {
		log.Fatalf("Failed to create notes table: %v", err)
	}

	// Migration: Add order_index column to existing notes table if it doesn't exist
	// This is safe to run multiple times - SQLite will ignore if column already exists
	_, err = DB.Exec("ALTER TABLE notes ADD COLUMN order_index INTEGER DEFAULT 0")
	if err != nil {
		// Ignore error if column already exists
		log.Printf("Note: order_index column may already exist: %v", err)
	}

	// Set initial order for existing notes that don't have order_index set
	_, err = DB.Exec("UPDATE notes SET order_index = id WHERE order_index = 0 OR order_index IS NULL")
	if err != nil {
		log.Printf("Note: failed to set initial order for existing notes: %v", err)
	}

	// Create attachments table if it doesn't exist
	createAttachmentsTable := `
    CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );`
	_, err = DB.Exec(createAttachmentsTable)
	if err != nil {
		log.Fatalf("Failed to create attachments table: %v", err)
	}

	// Create default folders if none exist
	createDefaultFolders()

	// Create attachments directory if it doesn't exist
	if _, err := os.Stat("data/attachments"); os.IsNotExist(err) {
		os.Mkdir("data/attachments", 0755)
	}

	log.Println("Database initialized successfully")
}

func createDefaultFolders() {
	// Check if any folders exist
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM folders").Scan(&count)
	if err != nil {
		log.Printf("Error checking folders count: %v", err)
		return
	}

	// If no folders exist, create default ones
	if count == 0 {
		defaultFolders := []string{"Notes", "Work", "Personal"}
		for _, folderName := range defaultFolders {
			_, err := DB.Exec("INSERT INTO folders (name) VALUES (?)", folderName)
			if err != nil {
				log.Printf("Error creating default folder %s: %v", folderName, err)
			}
		}
		log.Println("Created default folders")
	}
}
