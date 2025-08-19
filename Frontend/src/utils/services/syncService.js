// frontend/src/utils/services/syncService.js
class SyncService {
  constructor() {
    this.localUrl = 'http://localhost:8080';
    this.activeUrl = this.localUrl;
    this.connectionMode = 'local';
    this.isOnline = navigator.onLine;
    
    this.deviceId = this.getOrCreateDeviceId();
  }

  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  async detectBestConnection() {
    if (!this.isOnline) {
      this.connectionMode = 'offline';
      this.activeUrl = null;
      return 'offline';
    }
    
    if (await this.testConnection(this.localUrl)) {
      this.connectionMode = 'local';
      this.activeUrl = this.localUrl;
      console.log('🖥️ Connected to localhost:8080');
      return 'local';
    }
    
    this.connectionMode = 'offline';
    this.activeUrl = null;
    console.log('📱 Connection failed, using offline mode');
    return 'offline';
  }

  async testConnection(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log(`❌ Connection failed to ${url}:`, error.message);
      return false;
    }
  }

  // Add minimal methods that might be referenced
  async getFolders() {
    try {
      const response = await fetch(`${this.activeUrl}/folders`);
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }

  async getFolderNotes(folderId) {
    try {
      const response = await fetch(`${this.activeUrl}/folders/${folderId}/notes`);
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async createFolder(folderData) {
    try {
      const response = await fetch(`${this.activeUrl}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteFolder(folderId) {
    try {
      const response = await fetch(`${this.activeUrl}/folders/${folderId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  async createNote(noteData, folderId) {
    try {
      const response = await fetch(`${this.activeUrl}/folders/${folderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async updateNote(noteData) {
    try {
      const response = await fetch(`${this.activeUrl}/notes/${noteData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  async deleteNote(noteId) {
    try {
      const response = await fetch(`${this.activeUrl}/notes/${noteId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
}

const syncService = new SyncService();
export default syncService;