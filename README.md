# Task Management System

A comprehensive task management application built with React, Node.js, Express, and MongoDB. Features include task creation, project management, time tracking, real-time notifications, and team collaboration.

## Features

### Frontend (React + Vite)
- **Modern UI**: Built with TailwindCSS and DaisyUI components
- **Authentication**: Secure login/register with JWT tokens
- **Dashboard**: Overview of tasks, projects, and productivity metrics
- **Task Management**: Create, edit, delete, and organize tasks
- **Project Management**: Organize tasks into projects
- **Time Tracking**: Track time spent on tasks
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Works on desktop and mobile devices
- **PWA Support**: Installable as a Progressive Web App
- **Offline Support**: Basic offline functionality
- **Theme Support**: Light and dark mode

### Backend (Node.js + Express)
- **RESTful API**: Well-structured API endpoints
- **Authentication**: JWT-based authentication system
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Cloudinary integration for file storage
- **Real-time**: Socket.io for live updates
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Express-validator for input validation
- **Error Handling**: Comprehensive error handling
- **Logging**: Morgan for request logging

## Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS 4
- DaisyUI 5
- React Router DOM
- React Query (TanStack Query)
- React Hook Form
- Yup validation
- Lucide React icons
- React Hot Toast
- Socket.io Client
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Socket.io
- Cloudinary
- Multer
- Helmet
- CORS
- Morgan
- Express Rate Limit
- Express Validator

## Project Structure

```
task-manager/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   ├── project.controller.js
│   │   ├── user.controller.js
│   │   ├── upload.controller.js
│   │   ├── timeTracking.controller.js
│   │   ├── notification.controller.js
│   │   ├── analytics.controller.js
│   │   └── report.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Task.model.js
│   │   ├── Project.model.js
│   │   ├── TimeEntry.model.js
│   │   └── Notification.model.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── tasks.route.js
│   │   ├── projects.route.js
│   │   ├── users.route.js
│   │   ├── upload.route.js
│   │   ├── timeTracking.route.js
│   │   ├── notifications.route.js
│   │   ├── analytics.route.js
│   │   └── reports.route.js
│   ├── utils/
│   │   ├── geminiAI.js
│   │   ├── reportGenerator.js
│   │   └── socketServer.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Common/
│   │   │   ├── Layout/
│   │   │   ├── Analytics/
│   │   │   ├── Calendar/
│   │   │   ├── Kanban/
│   │   │   ├── Notifications/
│   │   │   ├── PWA/
│   │   │   └── TimeTracking/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks/
│   │   │   └── useOfflineAware.js
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Tasks/
│   │   │   ├── Project/
│   │   │   ├── Team/
│   │   │   ├── Reports/
│   │   │   ├── Calendar/
│   │   │   ├── TimeTracking/
│   │   │   ├── Profile/
│   │   │   └── NotFound/
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   ├── cn.js
│   │   │   ├── storage.js
│   │   │   └── offlineStorage.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for file uploads)
- Gemini AI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Gemini AI Configuration (Optional)
   GEMINI_API_KEY=your_gemini_api_key
   
   # CORS Configuration
   CLIENT_URL=http://localhost:5173
   ```
   
   Create a `frontend/.env` file:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:5000/api
   
   # App Configuration
   VITE_APP_NAME=Task Manager
   VITE_APP_VERSION=1.0.0
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   npm run dev
   ```
   The backend will run on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on http://localhost:5173

3. **Access the application**
   Open your browser and navigate to http://localhost:5173

### Demo Credentials

For testing purposes, you can use these demo credentials:
- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **Member**: member@example.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Tasks
- `GET /api/tasks` - Get all tasks (with filtering)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/comments` - Add comment to task
- `PATCH /api/tasks/:taskId/checklist/:itemId` - Toggle checklist item
- `PATCH /api/tasks/:id/archive` - Archive/unarchive task

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Features in Development

- [ ] Advanced project management
- [ ] Team collaboration features
- [ ] Advanced time tracking
- [ ] Detailed analytics and reporting
- [ ] Calendar integration
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Custom fields and workflows
- [ ] API documentation with Swagger
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@taskmanager.com or create an issue in the repository.