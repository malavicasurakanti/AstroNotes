# AstroNotes Documentation

**A privacy-first, local-first notes application inspired by Apple Notes**

Built with React and Go

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [API Documentation](#api-documentation)
7. [Configuration](#configuration)
8. [Development Guide](#development-guide)
9. [Deployment](#deployment)
10. [Contributing](#contributing)
11. [License](#license)

---

## Overview

AstroNotes is a modern note-taking application that prioritizes user privacy and data ownership. Unlike traditional cloud-based solutions, AstroNotes keeps your data local while providing the familiar interface and functionality you expect from a professional notes application.

### Key Principles

- **Privacy First**: Your notes never leave your device unless you explicitly choose to sync them
- **Local First**: Works completely offline with optional backend synchronization
- **Open Source**: Fully transparent and auditable codebase
- **Self-Hosted**: Deploy on your own infrastructure for complete control

---

## Features

### Core Functionality
- Clean, intuitive note-taking interface inspired by Apple Notes
- Hierarchical folder organization for better note management
- Real-time markdown rendering and editing
- Responsive design that works on desktop, tablet, and mobile devices
- Offline-first architecture with automatic local persistence

### Privacy & Security
- No user accounts or registration required
- All data stored locally by default
- No tracking, analytics, or telemetry
- Optional self-hosted backend for advanced features
- Complete data ownership and control

### Technical Features
- Fast and lightweight React frontend
- High-performance Go backend
- SQLite database for reliable data storage
- Docker support for easy deployment
- RESTful API for extensibility

---

## Technology Stack

### Frontend Technologies
- **React 18**: Modern JavaScript framework for building user interfaces
- **Vite**: Fast build tool and development server
- **CSS3**: Clean, responsive styling without external frameworks
- **localStorage**: Browser-based data persistence

### Backend Technologies
- **Go 1.23**: High-performance backend programming language
- **SQLite**: Lightweight, file-based database
- **Gorilla Mux**: HTTP request router and dispatcher
- **CORS**: Cross-Origin Resource Sharing support

### DevOps & Deployment
- **Docker**: Containerization for consistent deployments
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Production web server (in Docker container)

---

## Quick Start

### Option 1: Docker Deployment (Recommended)

**Prerequisites:**
- Docker Desktop installed and running
- Git for cloning the repository

**Steps:**
```bash
# Clone the repository
git clone https://github.com/yourusername/astronotes.git

# Navigate to project directory
cd astronotes

# Start the application
docker-compose up --build -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
```

### Option 2: Manual Development Setup

**Prerequisites:**
- Node.js 18 or higher
- Go 1.23 or higher
- Git

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

**Backend Setup:**
```bash
cd go-backend-app
go mod download
go run cmd/main.go
```

---

## Project Structure

```
astronotes/
├── frontend/                          # React Frontend Application
│   ├── src/
│   │   ├── components/               # Reusable React Components
│   │   │   ├── FolderSidebar.jsx    # Folder navigation component
│   │   │   ├── NotesPanel.jsx       # Notes listing and management
│   │   │   ├── NoteEditor.jsx       # Note editing interface
│   │   │   ├── NoteItem.jsx         # Individual note display
│   │   │   └── MarkdownRenderer.jsx # Markdown rendering component
│   │   ├── App.jsx                  # Main application component
│   │   ├── main.jsx                 # Application entry point
│   │   ├── App.css                  # Global styles
│   │   └── index.css                # Base CSS styles
│   ├── public/                      # Static assets
│   ├── Dockerfile                   # Frontend container configuration
│   ├── nginx.conf                   # Nginx configuration for production
│   ├── package.json                 # Node.js dependencies and scripts
│   └── vite.config.js              # Vite build configuration
│
├── go-backend-app/                   # Go Backend Application
│   ├── cmd/
│   │   └── main.go                  # Server entry point and configuration
│   ├── internal/                    # Internal application packages
│   │   ├── handler/                 # HTTP request handlers
│   │   │   └── handler.go          # API endpoint implementations
│   │   ├── service/                 # Business logic layer
│   │   │   └── service.go          # Data processing and validation
│   │   └── model/                   # Data structures and models
│   │       └── model.go            # Database entity definitions
│   ├── data/                        # Database storage directory
│   │   └── notes.db                # SQLite database file
│   ├── Dockerfile                   # Backend container configuration
│   ├── go.mod                       # Go module definition
│   └── go.sum                       # Dependency checksums
│
├── docker-compose.yml               # Container orchestration configuration
├── README.md                        # Project documentation
└── LICENSE                          # Software license
```

---

## API Documentation

The backend provides a RESTful API for managing folders and notes.

### Base URL
```
http://localhost:8080
```

### Endpoints

#### Folder Management

**GET /folders**
- Description: Retrieve all folders
- Response: Array of folder objects
- Example Response:
```json
[
  {
    "id": 1,
    "name": "Personal Notes",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**POST /folders**
- Description: Create a new folder
- Request Body:
```json
{
  "name": "New Folder Name"
}
```

**PUT /folders/{id}**
- Description: Update an existing folder
- Parameters: `id` (folder ID)
- Request Body:
```json
{
  "name": "Updated Folder Name"
}
```

**DELETE /folders/{id}**
- Description: Delete a folder and all its notes
- Parameters: `id` (folder ID)

#### Note Management

**GET /folders/{id}/notes**
- Description: Get all notes in a specific folder
- Parameters: `id` (folder ID)
- Response: Array of note objects

**POST /folders/{id}/notes**
- Description: Create a new note in a folder
- Parameters: `id` (folder ID)
- Request Body:
```json
{
  "title": "Note Title",
  "content": "Note content in markdown"
}
```

**PUT /notes/{id}**
- Description: Update an existing note
- Parameters: `id` (note ID)
- Request Body:
```json
{
  "title": "Updated Title",
  "content": "Updated content"
}
```

**DELETE /notes/{id}**
- Description: Delete a specific note
- Parameters: `id` (note ID)

---

## Configuration

### Environment Variables

#### Frontend Configuration
```bash
# Development
VITE_API_URL=http://localhost:8080

# Production
VITE_API_URL=https://your-domain.com/api
```

#### Backend Configuration
```bash
# Server Configuration
PORT=8080
GO_ENV=production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DB_PATH=./data/notes.db
```

### Docker Configuration

The `docker-compose.yml` file orchestrates both frontend and backend services:

```yaml
version: "3.8"

services:
  backend:
    build: ./go-backend-app
    ports:
      - "8080:8080"
    volumes:
      - ./go-backend-app/data:/app/data
    environment:
      - CORS_ORIGIN=http://localhost:5173
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## Development Guide

### Frontend Development

#### Available Scripts
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

#### Component Architecture
The frontend follows a component-based architecture:

- **App.jsx**: Main application container managing global state
- **FolderSidebar.jsx**: Left sidebar for folder navigation
- **NotesPanel.jsx**: Main content area displaying notes
- **NoteEditor.jsx**: Rich text editor for note content
- **NoteItem.jsx**: Individual note preview component

#### State Management
The application uses React's built-in state management with:
- `useState` for component-level state
- `useEffect` for side effects and data fetching
- `localStorage` for client-side persistence

### Backend Development

#### Project Organization
The backend follows Go's standard project layout:

- **cmd/**: Application entry points
- **internal/**: Private application code
- **internal/handler/**: HTTP request handlers
- **internal/service/**: Business logic
- **internal/model/**: Data structures

#### Database Schema
```sql
-- Folders table
CREATE TABLE folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    folder_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);
```

#### Running Tests
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with verbose output
go test -v ./...
```

---

## Deployment

### Production Deployment with Docker

#### Prerequisites
- Docker and Docker Compose installed on target server
- Domain name (optional, for HTTPS)
- SSL certificates (for production HTTPS)

#### Deployment Steps
```bash
# Clone repository on server
git clone https://github.com/yourusername/astronotes.git
cd astronotes

# Build and start services
docker-compose up --build -d

# Verify deployment
docker-compose ps
docker-compose logs -f
```

#### Production Considerations
- Use environment variables for configuration
- Set up reverse proxy (nginx) for HTTPS
- Configure backup strategy for database
- Monitor logs and system resources
- Implement security headers and firewall rules

### Manual Deployment

#### Frontend Deployment
```bash
# Build optimized production bundle
cd frontend
npm run build

# Deploy dist/ folder to web server
# Files can be served by any static file server
```

#### Backend Deployment
```bash
# Build Go binary
cd go-backend-app
go build -o bin/server cmd/main.go

# Run binary on server
./bin/server
```

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature
4. Make your changes and test thoroughly
5. Submit a pull request

### Development Workflow
```bash
# Fork and clone
git clone https://github.com/yourusername/astronotes.git
cd astronotes

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Contribution Guidelines
- Follow existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting
- Keep pull requests focused and atomic

### Code Style
- **Frontend**: Follow React best practices and ESLint rules
- **Backend**: Follow Go conventions and use `gofmt`
- **Documentation**: Update README and inline comments

---

## License

This project is licensed under the MIT License. This means you can:

- Use the software for any purpose
- Modify the source code
- Distribute copies of the software
- Include the software in proprietary applications

### MIT License Text
```
Copyright (c) 2024 AstroNotes Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Support and Contact

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Email**: Contact the maintainer at your.email@example.com

### Reporting Issues
When reporting issues, please include:
- Operating system and version
- Browser type and version (for frontend issues)
- Go version (for backend issues)
- Steps to reproduce the issue
- Expected vs actual behavior
- Any error messages or logs

---

**AstroNotes - Simple, Private, Powerful**

*Built with ❤️ for developers who value privacy and simplicity*
