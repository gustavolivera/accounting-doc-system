# Accounting Document Management System

A robust, full-stack web application for managing financial and fiscal documents for an accounting firm.

## Features
- **Company Management**: Create, edit, list, and inactivate companies.
- **Monthly Controls**: Track document status (Pending, Delivered, No Documents) per company/month.
- **Authentication**: Secure Admin access via JWT.
- **Dashboard**: Quick overview of system stats.

## Tech Stack
- **Backend**: NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, Vite, TypeScript, React Query
- **Infrastructure**: Docker, Docker Compose

## Prerequisites
- Docker & Docker Compose
- Node.js (for local dev without Docker)

## Setup & Running

### Using Docker (Recommended)
1.  Clone the repository.
2.  Create a `.env` file in `backend/` (see `backend/.env.example` - to be created).
3.  Run:
    ```bash
    docker-compose up --build
    ```
4.  Access:
    - Frontend: `http://localhost:5173`
    - Backend API: `http://localhost:3000`
    - API Docs: `http://localhost:3000/api`

### Local Development
**Backend**:
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in the `backend` folder:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/accounting_db?schema=public"
JWT_SECRET="supersecret"
```
