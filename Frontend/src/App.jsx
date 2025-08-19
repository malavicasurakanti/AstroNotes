// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import './App.css';
import FolderSidebar from './components/FolderSidebar.jsx';
import NotesPanel from "./components/NotesPanel.jsx";

function App() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [allNotes, setAllNotes] = useState({});

  // Load data from localStorage on app start
  useEffect(() => {
    const savedFolders = localStorage.getItem('notes-folders');
    const savedNotes = localStorage.getItem('notes-data');
    
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    }
    
    if (savedNotes) {
      try {
        setAllNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    }
  }, []);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notes-folders', JSON.stringify(folders));
  }, [folders]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notes-data', JSON.stringify(allNotes));
  }, [allNotes]);

  const folderNotes = selectedFolder ? (allNotes[selectedFolder.id] || []) : [];

  // Create folder
  const handleAddFolder = async (name) => {
    console.log(`📁 Creating folder: ${name}`);
    
    const newFolder = { 
      id: Date.now().toString(), 
      name,
      created_at: new Date().toISOString()
    };
    
    setFolders(prev => [...prev, newFolder]);
    console.log(`✅ Created folder: ${newFolder.name}`);
  };

  // Update folder
  const handleUpdateFolder = async (folderId, newName) => {
    console.log(`📁 Updating folder ${folderId} to: ${newName}`);
    
    const updatedFolders = folders.map(folder => 
      folder.id === folderId 
        ? { ...folder, name: newName }
        : folder
    );
    setFolders(updatedFolders);
    
    if (selectedFolder?.id === folderId) {
      setSelectedFolder({ ...selectedFolder, name: newName });
    }
    
    console.log(`✅ Updated folder: ${newName}`);
  };

  // Delete folder
  const handleDeleteFolder = async (folderId) => {
    console.log(`📁 Deleting folder: ${folderId}`);
    
    // Remove folder
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    
    // Remove all notes in this folder
    setAllNotes(prev => {
      const updated = { ...prev };
      delete updated[folderId];
      return updated;
    });
    
    // Clear selection if this folder was selected
    if (selectedFolder?.id === folderId) {
      setSelectedFolder(null);
    }
    
    console.log(`✅ Deleted folder: ${folderId}`);
  };

  // Create note
  const handleAddNote = async (note) => {
    if (!selectedFolder) return;
    
    console.log(`📝 Creating note: ${note.title}`);
    
    const newNote = { 
      id: Date.now().toString(), 
      title: note.title, 
      content: note.content,
      folder_id: selectedFolder.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setAllNotes(prev => ({
      ...prev,
      [selectedFolder.id]: [...(prev[selectedFolder.id] || []), newNote]
    }));
    
    console.log(`✅ Created note: ${newNote.title}`);
  };

  // Update note
  const handleUpdateNote = async (updatedNote) => {
    if (!selectedFolder) return;
    
    console.log('📝 Updating note:', updatedNote);
    
    const noteToUpdate = {
      ...updatedNote,
      folder_id: selectedFolder.id,
      updated_at: new Date().toISOString()
    };
    
    setAllNotes(prev => ({
      ...prev,
      [selectedFolder.id]: (prev[selectedFolder.id] || []).map(note =>
        note.id === updatedNote.id ? noteToUpdate : note
      )
    }));
    
    console.log(`✅ Updated note: ${updatedNote.title}`);
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (!selectedFolder) return;
    
    console.log(`📝 Deleting note: ${noteId}`);
    
    setAllNotes(prev => ({
      ...prev,
      [selectedFolder.id]: (prev[selectedFolder.id] || []).filter(note => note.id !== noteId)
    }));
    
    console.log(`✅ Deleted note: ${noteId}`);
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: '#f8f9fa',
      overflow: 'hidden'
    }}>
      <FolderSidebar 
        folders={folders}
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
        onAddFolder={handleAddFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
      />
      
      <NotesPanel 
        key={selectedFolder?.id || 'no-folder'}
        selectedFolder={selectedFolder}
        folderNotes={folderNotes}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  );
}

export default App;