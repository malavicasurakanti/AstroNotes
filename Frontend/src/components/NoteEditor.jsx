import React, { useState, useRef } from "react";

function NoteEditor({ 
  mode = 'create', // 'create' or 'edit'
  initialTitle = '',
  initialContent = '',
  onSave,
  onCancel,
  placeholder = {
    title: 'Title',
    content: 'Start writing...'
  }
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isContentFocused, setIsContentFocused] = useState(false);
  const contentRef = useRef(null);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    
    const noteData = {
      title: title.trim(), // Keep empty title as empty, don't default to "Untitled"
      content: content.trim()
    };
    
    onSave(noteData);
    
    // Clear form only for create mode
    if (mode === 'create') {
      setTitle('');
      setContent('');
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      contentRef.current?.focus();
    }
  };

  const handleContentKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    
    // Enhanced auto-creation on Enter
    if (e.key === 'Enter') {
      const textarea = e.target;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPosition);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Smart checklist behavior
      if (currentLine.match(/^- \[(x| )\]/)) {
        e.preventDefault();
        const checkboxContent = currentLine.replace(/^- \[(x| )\] /, '').trim();
        
        if (checkboxContent === '') {
          const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
          const newText = content.substring(0, lineStart) + '\n' + content.substring(cursorPosition);
          setContent(newText);
          setTimeout(() => textarea.setSelectionRange(lineStart + 1, lineStart + 1), 0);
        } else {
          const newText = content.substring(0, cursorPosition) + '\n- [ ] ' + content.substring(cursorPosition);
          setContent(newText);
          setTimeout(() => textarea.setSelectionRange(cursorPosition + 7, cursorPosition + 7), 0);
        }
      }
      else if (currentLine.match(/^- /) && !currentLine.includes('[')) {
        e.preventDefault();
        const bulletContent = currentLine.replace(/^- /, '').trim();
        
        if (bulletContent === '') {
          const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
          const newText = content.substring(0, lineStart) + '\n' + content.substring(cursorPosition);
          setContent(newText);
          setTimeout(() => textarea.setSelectionRange(lineStart + 1, lineStart + 1), 0);
        } else {
          const newText = content.substring(0, cursorPosition) + '\n- ' + content.substring(cursorPosition);
          setContent(newText);
          setTimeout(() => textarea.setSelectionRange(cursorPosition + 3, cursorPosition + 3), 0);
        }
      }
    }
  };

  const insertMarkdown = (syntax, wrapText = false) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText;
    let newCursorPosition;
    
    if (selectedText && (syntax.startsWith('#') || syntax.startsWith('##'))) {
      // For headers with selected text, wrap the selection
      newText = content.substring(0, start) + syntax + selectedText + content.substring(end);
      newCursorPosition = start + syntax.length + selectedText.length;
    } else if (wrapText && selectedText) {
      // For wrapping syntax like **bold**, wrap the selected text
      newText = content.substring(0, start) + syntax.replace('TEXT', selectedText) + content.substring(end);
      newCursorPosition = start + syntax.replace('TEXT', selectedText).length;
    } else {
      // For other cases, insert the syntax at cursor position
      newText = content.substring(0, start) + syntax + content.substring(end);
      newCursorPosition = start + syntax.length;
    }
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
  };

  const toolbarButtonStyle = {
    padding: '6px 10px',
    fontSize: '13px',
    border: '1px solid #e5e5e7',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#1d1d1f',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px'
  };

  const containerStyle = mode === 'edit' ? {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '8px',
    border: '2px solid #007AFF'
  } : {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #e5e5e7'
  };

  const titleStyle = mode === 'edit' ? {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '20px',
    fontWeight: '600',
    color: '#1d1d1f',
    backgroundColor: 'transparent',
    marginBottom: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    boxSizing: 'border-box'
  } : {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '32px',
    fontWeight: '600',
    color: '#1d1d1f',
    backgroundColor: 'transparent',
    marginBottom: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    boxSizing: 'border-box',
    textAlign: 'left'
  };

  const textareaStyle = mode === 'edit' ? {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1d1d1f',
    backgroundColor: 'transparent',
    resize: 'none',
    minHeight: '120px',
    maxHeight: '600px',
    height: `${Math.max(120, Math.min(600, (content.split('\n').length * 22) + 40))}px`,
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    lineHeight: '1.5',
    boxSizing: 'border-box',
    overflow: 'auto'
  } : {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    color: '#1d1d1f',
    backgroundColor: 'transparent',
    resize: 'none',
    minHeight: isContentFocused ? '200px' : '120px',
    maxHeight: '550px',
    height: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    lineHeight: '1.6',
    boxSizing: 'border-box',
    transition: 'min-height 0.3s ease',
    overflow: 'hidden'
  };

  const showToolbar = isContentFocused || mode === 'edit';

  return (
    <div style={containerStyle}>
      <input
        type="text"
        placeholder={placeholder.title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleTitleKeyDown}
        style={titleStyle}
      />

      {/* Toolbar */}
      {showToolbar && (
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid #e5e5e7',
          marginBottom: '12px',
          flexWrap: 'wrap',
          opacity: isContentFocused || mode === 'edit' ? 1 : 0.7,
          transform: isContentFocused || mode === 'edit' ? 'translateY(0)' : 'translateY(-5px)',
          transition: 'all 0.3s ease'
        }}>
          <button type="button" onClick={() => insertMarkdown('# ')} style={toolbarButtonStyle} title="Large Heading">H1</button>
          <button type="button" onClick={() => insertMarkdown('## ')} style={toolbarButtonStyle} title="Medium Heading">H2</button>
          <button type="button" onClick={() => insertMarkdown('### ')} style={toolbarButtonStyle} title="Small Heading">H3</button>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e5e7', margin: '0 4px' }}></div>
          <button type="button" onClick={() => insertMarkdown('**TEXT**', true)} style={{...toolbarButtonStyle, fontWeight: 'bold'}} title="Bold">B</button>
          <button type="button" onClick={() => insertMarkdown('*TEXT*', true)} style={{...toolbarButtonStyle, fontStyle: 'italic'}} title="Italic">I</button>
          <button type="button" onClick={() => insertMarkdown('__TEXT__', true)} style={{...toolbarButtonStyle, textDecoration: 'underline'}} title="Underline">U</button>
          <button type="button" onClick={() => insertMarkdown('~~TEXT~~', true)} style={{...toolbarButtonStyle, textDecoration: 'line-through'}} title="Strikethrough">S</button>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e5e7', margin: '0 4px' }}></div>
          <button type="button" onClick={() => insertMarkdown('- [ ] ')} style={toolbarButtonStyle} title="Checklist">☐</button>
          <button type="button" onClick={() => insertMarkdown('- ')} style={toolbarButtonStyle} title="Bullet List">•</button>
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e5e7', margin: '0 4px' }}></div>
          <button type="button" onClick={() => insertMarkdown('[TEXT](url)', true)} style={toolbarButtonStyle} title="Link">🔗</button>
        </div>
      )}

      <textarea
        ref={contentRef}
        placeholder={placeholder.content}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleContentKeyDown}
        onFocus={() => setIsContentFocused(true)}
        onBlur={() => {
          // Small delay to allow toolbar clicks to register
          setTimeout(() => setIsContentFocused(false), 200);
        }}
        onInput={(e) => {
          // Auto-resize based on content
          const textarea = e.target;
          const lineCount = content.split('\n').length;
          const maxLines = 25;
          const lineHeight = mode === 'edit' ? 22 : 25;
          const padding = 40;
          
          if (lineCount <= maxLines) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
          } else {
            textarea.style.height = (maxLines * lineHeight + padding) + 'px';
            textarea.style.overflow = 'auto';
          }
        }}
        style={textareaStyle}
      />
      
      {/* Action Buttons */}
      {mode === 'create' && (title || content || isContentFocused) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '12px'
        }}>
          <span style={{ 
            fontSize: '12px', 
            color: '#86868b',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            Press ⌘+Enter to save
          </span>
          <button 
            onClick={handleSave}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Save Note
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          marginTop: '12px'
        }}>
          <button 
            onClick={handleSave}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Save
          </button>
          <button 
            onClick={onCancel}
            style={{
              backgroundColor: '#f2f2f7',
              color: '#1d1d1f',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default NoteEditor;