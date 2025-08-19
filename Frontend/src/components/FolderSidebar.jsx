import React, { useState } from "react";

function FolderSidebar({ folders, selectedFolder, onFolderSelect, onAddFolder, onUpdateFolder, onDeleteFolder }) {
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [hoveredFolderId, setHoveredFolderId] = useState(null);
  const [draggedFolderId, setDraggedFolderId] = useState(null);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddFolder();
    } else if (e.key === 'Escape') {
      setIsAddingFolder(false);
      setNewFolderName("");
    }
  };

  const startEditFolder = (folder, e) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
  };

  const saveEditFolder = async () => {
    if (editFolderName.trim()) {
      await onUpdateFolder(editingFolderId, editFolderName.trim());
      setEditingFolderId(null);
      setEditFolderName("");
    }
  };

  const cancelEditFolder = () => {
    setEditingFolderId(null);
    setEditFolderName("");
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
      await onDeleteFolder(folderId);
    }
  };

  const handleDragStart = (e, folderId) => {
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', folderId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    if (draggedId !== targetFolderId) {
      // Implement folder reordering logic here
      console.log(`Reorder folder ${draggedId} to position of ${targetFolderId}`);
    }
    setDraggedFolderId(null);
  };

  return (
    <div style={{
      width: '300px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #e5e5e7',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e5e7'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1d1d1f',
          margin: '0 0 16px 0',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          textAlign: 'left'
        }}>
          AstroNotes
        </h2>
        
        {/* Add New Folder Input */}
        {isAddingFolder ? (
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={() => {
              if (!newFolderName.trim()) {
                setIsAddingFolder(false);
              }
            }}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e5e7',
              borderRadius: '8px',
              backgroundColor: 'white',
              fontSize: '14px',
              color: '#1d1d1f',
              outline: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              boxSizing: 'border-box'
            }}
          />
        ) : (
          <button
            onClick={() => setIsAddingFolder(true)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            + New Folder
          </button>
        )}
      </div>

      {/* Folders List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        {folders.map((folder) => (
          <div
            key={folder.id}
            draggable
            onDragStart={(e) => handleDragStart(e, folder.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, folder.id)}
            onClick={() => onFolderSelect(folder)}
            onMouseEnter={() => setHoveredFolderId(folder.id)}
            onMouseLeave={() => setHoveredFolderId(null)}
            style={{
              padding: '12px',
              margin: '4px 0',
              backgroundColor: selectedFolder?.id === folder.id ? '#007AFF' : 
                             hoveredFolderId === folder.id ? '#f0f0f0' : 'white',
              color: selectedFolder?.id === folder.id ? 'white' : '#1d1d1f',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #e5e5e7',
              opacity: draggedFolderId === folder.id ? 0.5 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📁</span>
              {editingFolderId === folder.id ? (
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditFolder();
                    if (e.key === 'Escape') cancelEditFolder();
                  }}
                  onBlur={saveEditFolder}
                  autoFocus
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    fontSize: 'inherit',
                    fontFamily: 'inherit'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span style={{ flex: 1 }}>{folder.name}</span>
              )}
            </div>
            
            {selectedFolder?.id !== folder.id && editingFolderId !== folder.id && (
              <div style={{ display: 'flex', gap: '4px', opacity: hoveredFolderId === folder.id ? 1 : 0, transition: 'opacity 0.2s' }}>
                <button
                  onClick={(e) => startEditFolder(folder, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  title="Rename folder"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => handleDeleteFolder(folder.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ff3b30'
                  }}
                  title="Delete folder"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}

        {folders.length === 0 && !isAddingFolder && (
          <div style={{
            textAlign: 'center',
            color: '#86868b',
            fontSize: '14px',
            marginTop: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            No folders yet. Create your first folder above.
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderSidebar;