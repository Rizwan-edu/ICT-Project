# Jobsy - Job Portal Application

A full-stack job portal application built with React and Node.js.

## Project Structure

```
Lastt/
├── backend/          # Node.js backend API
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Authentication middleware
│   └── services/     # Business logic
├── frontend/         # React frontend
│   ├── src/          # React components and logic
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
└── README.md
```

## Setup Instructions

### Backend Setup
1. Navigate to backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create `.env` file with MongoDB connection string
4. Start server: `npm start`

### Frontend Setup
1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Features

- **User Authentication**: Login/signup with JWT tokens
- **Job Management**: Admin can create, edit, delete jobs
- **Job Applications**: Users can apply for jobs
- **Application Tracking**: Status management (pending/accepted/rejected)
- **Search & Filters**: Advanced job search functionality
- **Responsive Design**: Works on desktop and mobile

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS