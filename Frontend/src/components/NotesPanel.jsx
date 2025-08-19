import React, { useState } from "react";
import NoteEditor from "./NoteEditor.jsx";
import NoteItem from "./NoteItem.jsx";

function NotesPanel({ selectedFolder, folderNotes, onAddNote, onUpdateNote, onDeleteNote }) {
  const [editingId, setEditingId] = useState(null);
  const [draggedNoteId, setDraggedNoteId] = useState(null);

  const handleCreateNote = async (noteData) => {
    const note = {
      id: Date.now(),
      title: noteData.title,
      content: noteData.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await onAddNote(note);
  };

  const handleUpdateNote = async (noteData) => {
    const updatedNote = {
      id: editingId,
      title: noteData.title,
      content: noteData.content
    };
    
    console.log('Saving edited note:', updatedNote);
    
    try {
      await onUpdateNote(updatedNote);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleCheckbox = async (noteId, lineIndex, content) => {
    console.log('Toggle checkbox called:', { noteId, lineIndex, content });
    
    const lines = content.split('\n');
    const line = lines[lineIndex];
    
    console.log('Original line:', line);
    
    // Toggle the checkbox
    if (line.includes('- [x]')) {
      lines[lineIndex] = line.replace('- [x]', '- [ ]');
    } else if (line.includes('- [ ]')) {
      lines[lineIndex] = line.replace('- [ ]', '- [x]');
    }
    
    const newContent = lines.join('\n');
    console.log('New content:', newContent);
    
    const note = folderNotes.find(n => n.id === noteId);
    console.log('Found note:', note);
    
    if (note) {
      const updatedNote = {
        id: noteId,
        title: note.title,
        content: newContent
      };
      
      console.log('Updating note:', updatedNote);
      
      try {
        await onUpdateNote(updatedNote);
        console.log('Note updated successfully');
      } catch (error) {
        console.error('Error updating note:', error);
      }
    }
  };

  const handleNoteDragStart = (e, noteId) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', noteId.toString());
  };

  const handleNoteDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleNoteDrop = (e, targetNoteId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedId && targetNoteId && draggedId !== targetNoteId) {
      // Simple reordering logic
      const noteOrder = safeNotes.map((note, index) => {
        if (note.id === draggedId) {
          // Find where the target note is
          const targetIndex = safeNotes.findIndex(n => n.id === targetNoteId);
          return { id: note.id, order: targetIndex + 1 };
        } else if (note.id === targetNoteId) {
          // Find where the dragged note is
          const draggedIndex = safeNotes.findIndex(n => n.id === draggedId);
          return { id: note.id, order: draggedIndex + 1 };
        } else {
          return { id: note.id, order: index + 1 };
        }
      });
      
      // Update the backend
      updateNotesOrder(noteOrder);
    }
    
    setDraggedNoteId(null);
  };

  const handleNoteDragEnd = (e) => {
    setDraggedNoteId(null);
  };

  const updateNotesOrder = async (noteOrder) => {
    try {
      const response = await fetch(`http://localhost:8080/folders/${selectedFolder.id}/notes/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteOrder }),
      });

      if (response.ok) {
        console.log('Notes reordered successfully');
        // Trigger a refresh of notes without page reload
        // This will call the parent component to refetch notes
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 100);
      } else {
        console.error('Failed to reorder notes');
      }
    } catch (error) {
      console.error('Error reordering notes:', error);
    }
  };

  // Debug logging
  console.log('NotesPanel render:', { 
    selectedFolder: selectedFolder?.name, 
    notesCount: folderNotes?.length,
    editingId 
  });

  if (!selectedFolder) {
    console.log('No folder selected - showing empty state');
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#86868b',
          fontSize: '18px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>
            Select a folder to view notes
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
            Choose a folder from the sidebar to start organizing your notes
          </p>
        </div>
      </div>
    );
  }

  const safeNotes = Array.isArray(folderNotes) ? folderNotes : [];
  console.log('Safe notes:', safeNotes.length);

  return (
    <div style={{
      flex: 1,
      backgroundColor: 'white',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ 
        padding: '20px',
        height: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Folder Header */}
        <div style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e5e7'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1d1d1f',
            margin: '0',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            📁 {selectedFolder.name}
          </h1>
          <p style={{
            color: '#86868b',
            fontSize: '14px',
            margin: '4px 0 0 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {safeNotes.length} {safeNotes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>

        {/* Add New Note Form */}
        <NoteEditor 
          mode="create"
          onSave={handleCreateNote}
          placeholder={{
            title: 'Note title...',
            content: 'Start writing your note here...\n\nYou can use:\n- **Bold** and *italic* text\n- # Headers\n- [Links](https://example.com)\n- - [ ] Todo lists\n- - [x] Completed tasks'
          }}
        />

        {/* Notes List */}
        {safeNotes.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            color: '#86868b',
            fontSize: '16px',
            marginTop: '40px',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            backgroundColor: '#f8f9fa',
            padding: '40px',
            borderRadius: '12px',
            border: '2px dashed #e5e5e7'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1d1d1f'
            }}>
              No notes in this folder yet
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '14px', 
              color: '#86868b',
              lineHeight: '1.5'
            }}>
              Create your first note using the form above.<br />
              You can use Markdown formatting for rich text.
            </p>
          </div>
        ) : (
          <div style={{ 
            position: 'relative', 
            isolation: 'isolate',
            display: 'grid',
            gap: '12px'
          }}>
            {safeNotes.map((note) => {
              console.log('Rendering note:', note.id, note.title);
              
              return editingId === note.id ? (
                <NoteEditor
                  key={note.id}
                  mode="edit"
                  initialTitle={note.title}
                  initialContent={note.content}
                  onSave={handleUpdateNote}
                  onCancel={cancelEdit}
                />
              ) : (
                <NoteItem
                  key={note.id}
                  note={note}
                  isEditing={editingId === note.id}
                  isDragging={draggedNoteId === note.id}
                  onEdit={startEdit}
                  onDelete={onDeleteNote}
                  onCheckboxToggle={toggleCheckbox}
                  onDragStart={handleNoteDragStart}
                  onDragOver={handleNoteDragOver}
                  onDrop={handleNoteDrop}
                  onDragEnd={handleNoteDragEnd}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesPanel;