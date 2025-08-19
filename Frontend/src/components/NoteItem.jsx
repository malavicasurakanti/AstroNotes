import React, { useState }  from "react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";

function NoteItem({ 
  note, 
  isEditing, 
  isDragging, 
  onEdit, 
  onDelete, 
  onCheckboxToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const handleEdit = () => {
    onEdit(note);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  const handleDragStart = (e) => {
    if (onDragStart) onDragStart(e, note.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    if (onDragOver) onDragOver(e);
  };

  const handleDragLeave = (e) => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) onDrop(e, note.id);
  };

  const handleDragEnd = (e) => {
    setIsDragOver(false);
    if (onDragEnd) onDragEnd(e);
  };

  const handleCheckboxToggle = (noteId, lineIndex, content) => {
    onCheckboxToggle(noteId, lineIndex, content);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '8px',
        border: isDragOver ? '2px dashed #007AFF' : '1px solid #e5e5e7',
        cursor: isDragging ? 'grabbing' : 'default',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isDragOver ? '0 8px 16px rgba(0,123,255,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Action buttons */}
      {isHovering && !isDragging && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
          opacity: 1,
          transition: 'opacity 0.2s'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            style={{
              background: ' #FFFFFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: '500'
            }}
            title="Edit note"
          >
            ✏️ 
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this note?')) {
                onDelete(note.id);
              }
            }}
            style={{
              background: '#FFFFFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: '500'
            }}
            title="Delete note"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Note Title */}
      {note.title && (
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '18px',
          fontWeight: '600',
          color: '#1d1d1f',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          lineHeight: '1.3'
        }}>
          {note.title}
        </h3>
      )}
      
      {/* Note Content */}
      <div style={{ 
        marginBottom: '16px',
        maxHeight: '200px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <MarkdownRenderer 
          content={note.content}
          noteId={note.id}
          onCheckboxToggle={handleCheckboxToggle}
        />
        
        {/* Fade out effect for long content */}
        {note.content.length > 300 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(transparent, white)',
            pointerEvents: 'none'
          }} />
        )}
      </div>
      
      {/* Note Footer */}
      <div style={{ 
        fontSize: '12px', 
        color: '#86868b',
        borderTop: '1px solid #f2f2f7',
        paddingTop: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            📅 {new Date(note.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
          
          
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
         
          
          {note.content.includes('](') && (
            <span style={{ color: '#007AFF', fontSize: '14px' }} title="Has links">
              🔗
            </span>
          )}
          {note.content.includes('![') && (
            <span style={{ color: '#007AFF', fontSize: '14px' }} title="Has images">
              🖼️
            </span>
          )}
          
            
        </div>
      </div>
    </div>
  );
}

export default NoteItem;