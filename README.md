AstroNotes
A privacy-first, local-first notes application inspired by Apple Notes. Built with React and Go.

￼
Features
* 📝 Clean, intuitive note-taking interface
* 📁 Hierarchical folder organization
* 🔒 Privacy-first: your data stays local
* 💾 Offline-first with optional sync
* 📱 Responsive design for all devices
* 🚀 Fast and lightweight
* 🐳 Docker support for easy deployment
Tech Stack
Frontend:
* React 18 with Vite
* CSS3 for styling
* localStorage for persistence
Backend:
* Go 1.23
* SQLite database
* Gorilla Mux router
* CORS enabled
Quick Start
Using Docker (Recommended)
git clone https://github.com/yourusername/astronotes.git
cd astronotes
docker-compose up --build -d
Access the app at http://localhost:5173
Manual Setup
Prerequisites:
* Node.js 18+
* Go 1.23+
Frontend:
cd Frontend
npm install
npm run dev
Backend:
cd Backend
go mod download
go run cmd/main.go
Project Structure
astronotes/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── Dockerfile
│   └── package.json
├── backend/          # Go backend
│   ├── cmd/
│   │   └── main.go          # Server entry point
│   ├── internal/            # Internal packages
│   │   ├── handler/         # HTTP handlers
│   │   ├── service/         # Business logic
│   │   └── model/           # Data models
│   ├── data/                # Database storage
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── docker-compose.yml       # Container orchestration
└── README.md
API Endpoints
Method	Endpoint	Description
GET	/folders	List all folders
POST	/folders	Create new folder
PUT	/folders/{id}	Update folder
DELETE	/folders/{id}	Delete folder
GET	/folders/{id}/notes	Get notes in folder
POST	/folders/{id}/notes	Create note in folder
PUT	/notes/{id}	Update note
DELETE	/notes/{id}	Delete note
Configuration
Environment Variables
Frontend:
VITE_API_URL=http://localhost:8080  # Backend URL
Backend:
PORT=8080                           # Server port
CORS_ORIGIN=http://localhost:5173   # Frontend URL
DB_PATH=./data/notes.db             # Database file path
Docker Compose
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    volumes:
      - ./backend/data:/app/data
    restart: unless-stopped
    
  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: unless-stopped
Development
Frontend Development
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
Backend Development
cd backend

# Install dependencies
go mod download

# Run with hot reload (using air)
air

# Build binary
go build -o bin/server cmd/main.go

# Run tests
go test ./...
Database
The application uses SQLite for data storage. Database file is located at backend/data/notes.db.
Schema:
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
    FOREIGN KEY (folder_id) REFERENCES folders(id)
);
Deployment
Docker Production
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
Manual Production
Frontend:
cd Frontend
npm run build
# Deploy dist/ folder to your web server
Backend:
cd Backend
go build -o bin/server cmd/main.go
# Run ./bin/server on your server
Contributing
1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request
Development Guidelines
* Follow existing code style
* Write tests for new features
* Update documentation as needed
* Ensure Docker builds work
* Test both frontend-only and full-stack modes
License
This project is licensed under the MIT License - see the LICENSE file for details.
Support
* 🐛 Report Issues
* 💡 Feature Requests
* 📧 Contact: malavica.surakanti@gmail.com

Made with ❤️ for developers who value privacy
