# Jobsy Backend

Backend API for the Jobsy job portal application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/jobsy?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

3. Replace MongoDB Atlas credentials in `.env`

4. Start server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register user
- POST `/api/auth/login` - Login user

### Jobs
- GET `/api/jobs` - Get all jobs (with filters)
- POST `/api/jobs` - Create job (admin only)
- PUT `/api/jobs/:id` - Update job (admin only)
- DELETE `/api/jobs/:id` - Delete job (admin only)
- POST `/api/jobs/:id/apply` - Apply for job

### Applications
- GET `/api/applications/my` - Get user's applications
- GET `/api/applications` - Get all applications (admin only)
- PATCH `/api/applications/:id/status` - Update application status (admin only)

## MongoDB Atlas Setup

1. Create account at mongodb.com
2. Create new cluster
3. Create database user
4. Get connection string
5. Replace in `.env` file