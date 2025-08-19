package model

import "time"

// Attachment represents a file attached to a note
type Attachment struct {
	ID           int       `json:"id"`
	NoteID       int       `json:"note_id"`
	Filename     string    `json:"filename"`
	OriginalName string    `json:"original_name"`
	MimeType     string    `json:"mime_type"`
	Size         int64     `json:"size"`
	CreatedAt    time.Time `json:"created_at"`
}
