
# SIH Project Backend

Backend service for the Smart India Hackathon project. This API manages authentication, beneficiary profiles, government schemes, officer operations, eligibility checks, applications, notifications, and simulated payment processing.

The backend is built with Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, and BullMQ.

## Image Placeholders

### User Flow

<img width="1448" height="1086" alt="image" src="https://github.com/user-attachments/assets/ea424417-4022-4361-81f8-4a85aaa514e5" />


### Schema

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/667c25dd-48af-4181-8a89-ec610373ec73" />


### Architecture

<img width="1448" height="1086" alt="image" src="https://github.com/user-attachments/assets/53ff719e-8819-4783-aed5-3819ced4782d" />


## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- JWT authentication
- Bcrypt password hashing
- Zod-ready validation setup

## Main Features

- User registration and login
- JWT-based authentication
- Role-based access control for `BENEFICIARY` and `OFFICER`
- Beneficiary profile management
- Officer scheme creation
- Dynamic scheme eligibility criteria
- Background eligibility scans with Redis and BullMQ
- Scheme catalog APIs
- Application status tracking
- Simulated payment processing
- Notification queue for SMS-style messages

## Project Structure

```text
src/
  app.ts                         Express app setup and route registration
  server.ts                      Server startup
  config/                        Environment configuration
  db/                            Prisma client singleton
  middlewares/                   Auth and role middleware
  modules/
    auth/                        Register and login
    beneficiary/                 Beneficiary profile APIs
    officer/                     Officer scheme and payment APIs
    schemes/                     Public scheme catalog APIs
  queue/                         BullMQ queue setup
  utils/                         Eligibility engine
  workers/                       Background worker

prisma/
  schema.prisma                  Database schema
  seed.ts                        Seed data script
```

## Prerequisites

Install these before running the backend:

- Node.js 18 or newer
- npm
- PostgreSQL
- Redis

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/krrishrastogi05/SIH_Project.git
cd SIH_Project
```

### 2. Install dependencies

```bash
npm install
```

If dependency conflicts occur, use:

```bash
npm install --legacy-peer-deps
```

### 3. Create environment file

Create a `.env` file in the project root.

```env
PORT=8000
NODE_ENV=development

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sih_db?schema=public"
REDIS_URL="redis://127.0.0.1:6379"

JWT_SECRET="replace_with_a_secure_secret"
```

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Apply database schema

For local development:

```bash
npx prisma db push
```

Or, if using migrations:

```bash
npx prisma migrate dev
```

### 6. Seed the database

```bash
npm run seed
```

### 7. Start Redis

Redis must be running before using queue-based features.

Example local Redis URL:

```text
redis://127.0.0.1:6379
```

## Running The Project

### Start API server

```bash
npm run dev
```

Default API URL:

```text
http://localhost:8000
```

Health check:

```text
GET /health
```

### Start background workers

Run each in a separate terminal:

```bash
npx tsx src/workers/eligibilityWorker.ts
npx tsx src/workers/notificationWorker.ts
```

The eligibility worker scans users for new schemes. The notification worker sends SMS notifications.

## Build And Start Production

```bash
npm run build
npm start
```

## Useful Scripts

```bash
npm run dev          Start development server
npm run build        Compile TypeScript
npm start            Run compiled server
npm run lint         Type-check without emitting files
npm run seed         Seed database
npm test             Run tests
```

## API Overview

### Auth

```text
POST /api/auth/register
POST /api/auth/login
```

### Beneficiary

```text
GET /api/beneficiary/profile
PUT /api/beneficiary/profile
GET /api/beneficiary/dashboard
```

### Officer

```text
POST /api/officer/schemes
GET /api/officer/schemes/:schemeId/applications
POST /api/officer/payment/initiate
```

### Schemes

```text
GET /api/schemes
GET /api/schemes/:id
```

## Eligibility Flow

```text
Officer creates scheme
        |
        v
API saves scheme in PostgreSQL
        |
        v
API adds BullMQ job
        |
        v
Worker receives job
        |
        v
Worker checks beneficiaries with eligibility engine
        |
        v
Eligible users get application records and notifications
```

## Database Models

Main Prisma models:

- `User`
- `Scheme`
- `BeneficiaryScheme`
- `Notification`

Main relationship:

```text
User 1 ---- many BeneficiaryScheme many ---- 1 Scheme
User 1 ---- many Notification
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API server port. Defaults to app configuration. |
| `NODE_ENV` | No | Runtime environment. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `REDIS_URL` | Yes | Redis connection string for BullMQ. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. |
| `RAZORPAY_KEY_ID` | No | RazorpayX API key id. If not set, payments are simulated. |
| `RAZORPAY_KEY_SECRET` | No | RazorpayX API key secret. |
| `RAZORPAYX_ACCOUNT_NUMBER` | No | RazorpayX business account number that sends the payouts. |
| `RAZORPAY_WEBHOOK_SECRET` | No | Secret used to check webhook signatures at `/api/webhooks/razorpay`. |

## Development Notes

- Use `.js` extensions in local TypeScript imports because the project runs in ESM/NodeNext mode.
- Use the shared Prisma client from `src/db/prisma.ts`.
- Run the API server and worker separately during development.
- Keep Redis running when testing background jobs.
- Add validation schemas for new request bodies before adding new APIs.

## License

This project is for Smart India Hackathon development and demonstration.
