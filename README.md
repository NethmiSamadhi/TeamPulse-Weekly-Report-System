# TeamPulse Weekly Report System

TeamPulse is a full-stack weekly reporting and team-performance management system. Team members can create structured weekly reports, save drafts, submit reports for review, respond to correction requests, and retain version history. Managers can monitor compliance, manage projects, review submissions, and approve reports.

## Features

### Authentication and authorization

- Secure registration and login
- JWT authentication using HTTP-only cookies
- Password hashing with bcrypt
- Protected frontend and backend routes
- Role-based access for Team Members, Managers, and Administrators

### Weekly reports

- Create and edit weekly reports
- Save reports as drafts
- Submit drafts for manager review
- Record tasks, priorities, progress, time, and deliverables
- Add next-week plans, blockers, achievements, and optional notes
- Edit and resubmit reports returned for correction

### Review workflow

Draft -> Submitted -> Needs Correction -> Resubmitted -> Approved

Managers can leave correction comments, request changes, approve reports, and inspect previous versions. Corrected submissions create new versions without overwriting earlier content.

### Dashboard and management

- Weekly compliance and submission metrics
- Report-status and task-hour charts
- Team reporting-status overview
- Report search and filtering
- Project creation, editing, and archiving
- Team-member search and status filtering

## Technology Stack

### Frontend

React, TypeScript, Vite, React Router, Recharts, Lucide React, and CSS.

### Backend

Node.js, Express, TypeScript, Prisma ORM, Zod, JSON Web Tokens, bcrypt, Cookie Parser, and Helmet.

### Database

MySQL

## Architecture

The React frontend communicates with the Express REST API. The backend validates requests, applies authentication and role permissions, executes report workflow logic, and uses Prisma ORM to access MySQL.

## Project Structure

- backend/prisma - schema, migrations, and seed data
- backend/src/controllers - request handlers and business logic
- backend/src/middleware - authentication and authorization
- backend/src/routes - REST API routes
- backend/src/validators - Zod validation schemas
- frontend/src/components - shared components and protected layout
- frontend/src/context - authentication state
- frontend/src/pages - application screens
- frontend/src/styles - page styling

## Prerequisites

- Node.js
- npm
- MySQL
- Git

## Installation

### 1. Clone the repository

    git clone https://github.com/NethmiSamadhi/TeamPulse-Weekly-Report-System.git
    cd TeamPulse-Weekly-Report-System

### 2. Create the database

Create a MySQL database named teampulse.

### 3. Configure and start the backend

    cd backend
    npm install

Create backend/.env with values matching your environment:

    DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3307/teampulse"
    JWT_SECRET="replace-this-with-a-long-secure-secret"
    PORT=5000
    FRONTEND_URL="http://localhost:5173"
    NODE_ENV="development"

Prepare and run the backend:

    npx prisma migrate deploy
    npx prisma generate
    npx prisma db seed
    npm run dev

The API runs at http://localhost:5000.

### 4. Configure and start the frontend

Open another terminal:

    cd frontend
    npm install

Create frontend/.env:

    VITE_API_URL="http://localhost:5000/api"

Start the frontend:

    npm run dev

Open http://localhost:5173.

## Demo Manager Account

- Email: manager@teampulse.dev
- Password: TeamPulse@123

Additional seeded users are available in backend/prisma/seed.ts.

## Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register a user |
| POST | /api/auth/login | Log in |
| POST | /api/auth/logout | Log out |
| GET | /api/auth/me | Get the authenticated user |
| GET | /api/dashboard | Get weekly dashboard data |
| GET | /api/projects | Get projects |
| POST | /api/projects | Create a project |
| PATCH | /api/projects/:projectId | Update a project |
| DELETE | /api/projects/:projectId | Archive a project |
| GET | /api/reports | Get filtered reports |
| GET | /api/reports/:reportId | Get a report and its versions |
| POST | /api/reports | Create a draft |
| PUT | /api/reports/:reportId | Update a draft or returned report |
| POST | /api/reports/:reportId/submit | Submit or resubmit a report |
| POST | /api/reports/:reportId/review | Approve or request changes |

## Validation and Security

- Zod validates request bodies, query parameters, dates, percentages, and item limits.
- Correction requests require a manager comment.
- Only one key blocker and one key achievement are allowed per report.
- Passwords are hashed with bcrypt.
- JWTs are stored in HTTP-only cookies.
- Backend middleware checks authentication, roles, and report ownership.
- Helmet supplies common security headers.
- Sensitive environment files are excluded from Git.

## Production Build

Backend:

    cd backend
    npm run build

Frontend:

    cd frontend
    npm run build

The Vite chunk-size message is an optimization warning and does not mean the build failed.

## Demonstration Workflow

1. Log in as a team member.
2. Create and save a draft report.
3. Edit and submit the report.
4. Log in as the manager.
5. Request changes with a correction comment.
6. Log back in as the team member.
7. Correct and resubmit the report.
8. Confirm that a new version was created.
9. Log back in as the manager and approve the latest version.
10. Confirm the updated dashboard statistics.

## Future Improvements

- Email and reminder notifications
- Password reset
- Complete administrator user-management interface
- PDF and Excel exports
- Advanced cross-week analytics
- Report attachments
- Automated tests and continuous integration
- Route-level code splitting
- Cloud deployment

## Author

**Nethmi Samadhi**

- GitHub: https://github.com/NethmiSamadhi
- LinkedIn: https://www.linkedin.com/in/nethmi-samadhi-271642383/

## Repository

https://github.com/NethmiSamadhi/TeamPulse-Weekly-Report-System
