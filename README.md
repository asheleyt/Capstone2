# Capstone2 - Restaurant Management System

A full-stack restaurant management system with POS, KDS, inventory management, and admin dashboard.

## Prerequisites

- Node.js (version 16 or higher)
- PostgreSQL database server
- Git

## Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd Capstone2
```

### 2. Database Setup
1. Install PostgreSQL on your system
2. Create a new database named `capstone2`
3. Create a `.env` file in the `backend` folder with the following content:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=capstone2
DB_PASSWORD=your_postgres_password
DB_PORT=5432
PORT=5000
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 4. Run the Application

#### Start the Backend Server
```bash
cd backend
npm start
```
The backend will run on `http://localhost:5000`

#### Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

- `backend/` - Express.js API server
- `frontend/` - Vue.js 3 frontend application
- `backend/src/` - Backend source code
- `frontend/src/` - Frontend source code

## Features

- Point of Sale (POS) system
- Kitchen Display System (KDS)
- Inventory management
- Sales tracking and reporting
- User management
- Real-time order updates

## Troubleshooting

- Make sure PostgreSQL is running and accessible
- Verify your database credentials in the `.env` file
- Ensure both backend and frontend are running simultaneously
- Check console logs for any error messages 