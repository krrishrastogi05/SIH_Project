# Backend Interview Prep Guide

Use this guide to study and explain the backend in a 1-day preparation window. The goal is to be able to open the codebase during an interview and confidently walk through the architecture, request flows, database model, background jobs, and known improvement areas.

## 1. Two-Minute Project Pitch

This project is a TypeScript backend for a Smart India Hackathon government scheme platform. It exposes a modular REST API using Express, stores users, schemes, applications, and notifications in PostgreSQL through Prisma, and protects routes using JWT authentication and role-based access control.

The main users are beneficiaries and officers. Beneficiaries register, log in, and complete their profiles. Officers create schemes with dynamic eligibility criteria. When a scheme is created, the API does not scan every user inside the HTTP request. Instead, it pushes a BullMQ job to Redis, and a worker checks eligibility in the background. Eligible users get a `BeneficiaryScheme` record and a notification.

Short version:

> Express handles HTTP, Prisma handles PostgreSQL, JWT and RBAC protect routes, and BullMQ/Redis decouple heavy eligibility and notification work from the API request cycle.

## 2. Codebase Walkthrough Order

Use this exact order if the interviewer asks you to open the codebase.

1. `README.md`
   - Start with the project purpose, stack, and feature list.
   - Mention that the backend is organized by modules: auth, beneficiary, officer, and schemes.

2. `src/app.ts`
   - Explain Express initialization.
   - Point out CORS, JSON parsing, `/health`, and route mounting.
   - Route prefixes:
     - `/api/auth`
     - `/api/beneficiary`
     - `/api/officer`
     - `/api/schemes`

3. `src/server.ts`
   - Explain that this file starts the server and connects Prisma to PostgreSQL.
   - Be honest: the current file calls `app.listen` twice. In production, this should be fixed so the app connects to the database first and listens only once.

4. `prisma/schema.prisma`
   - Explain the database entities and relationships before diving into controllers.
   - Main relationship: `User -> BeneficiaryScheme <- Scheme`.
   - Notifications belong to users.

5. `src/modules/auth`
   - Explain registration, password hashing, login, JWT creation, and the token payload.

6. `src/middlewares/auth.ts` and `src/middlewares/role.ts`
   - Explain protected routes and officer-only routes.

7. `src/modules/officer/officer.controller.ts`
   - Explain scheme creation and why it queues background eligibility work.

8. `src/queue/queue.ts`, `src/workers/unifiedWorker.ts`, and `src/utils/eligibilityEngine.ts`
   - Explain the async processing flow from scheme creation to eligibility matches.

## 3. Architecture Notes

The backend follows a feature-based module structure. Each feature owns its route and controller files instead of putting all controllers into one global folder. That makes the backend easier to explain and extend.

Important components:

- `src/app.ts`: Express app setup and route registration.
- `src/server.ts`: server startup and database connection.
- `src/db/prisma.ts`: shared Prisma client.
- `src/modules/auth`: user registration and login.
- `src/modules/beneficiary`: beneficiary profile and dashboard placeholder.
- `src/modules/officer`: officer scheme and payment actions.
- `src/modules/schemes`: scheme catalog APIs.
- `src/queue/queue.ts`: BullMQ queue producer.
- `src/workers/unifiedWorker.ts`: background worker.
- `src/utils/eligibilityEngine.ts`: rule-based eligibility logic.

## 4. Core Flow: Auth

Files:

- `src/modules/auth/auth.routes.ts`
- `src/modules/auth/auth.controller.ts`
- `src/middlewares/auth.ts`
- `src/middlewares/role.ts`

Registration flow:

1. Client sends `name`, `phone`, `password`, and optional `role`.
2. Controller checks whether the phone number already exists.
3. Password is hashed using `bcrypt.hash(password, 10)`.
4. User is created through Prisma.
5. Response returns safe user fields, not the password.

Login flow:

1. Client sends `phone` and `password`.
2. Controller finds user by phone.
3. Password is checked with `bcrypt.compare`.
4. JWT is created with payload `{ id, role }`.
5. Client receives token and user summary.

Protected route flow:

1. Client sends `Authorization: Bearer <token>`.
2. `authMiddleware` extracts and verifies the token.
3. Decoded user data is attached to `req.user`.
4. `roleCheck(["OFFICER"])` checks whether the authenticated user has officer access.

Interview answer:

> Authentication proves who the user is through JWT. Authorization checks what that user is allowed to do through the role stored in the token.

## 5. Core Flow: Beneficiary

Files:

- `src/modules/beneficiary/beneficiary.routes.ts`
- `src/modules/beneficiary/beneficiary.controller.ts`

Routes:

- `GET /api/beneficiary/profile`
- `PUT /api/beneficiary/profile`
- `GET /api/beneficiary/dashboard`

The beneficiary profile stores fields used by the eligibility engine:

- `age`
- `gender`
- `income`
- `occupation`
- `education`
- `state`
- `district`
- `pincode`
- `bankAccount`
- `ifsc`

Interview answer:

> The beneficiary profile is not just account information. It is the input data used later to match users with government schemes.

## 6. Core Flow: Officer

Files:

- `src/modules/officer/officer.routes.ts`
- `src/modules/officer/officer.controller.ts`

Routes:

- `POST /api/officer/schemes`
- `GET /api/officer/schemes/:schemeId/applications`
- `POST /api/officer/payment/initiate`

Scheme creation flow:

1. Officer sends scheme details and `baseCriteria`.
2. API creates a `Scheme` row in PostgreSQL.
3. API adds a BullMQ job named `check-eligibility-for-scheme`.
4. API returns quickly with the scheme ID.
5. Worker scans matching users in the background.

Payment flow:

1. Officer sends `applicationId`.
2. Backend simulates payment success or failure.
3. On success, application status becomes `PAID`.
4. A transaction ID and payment date are stored.
5. A notification SMS job is queued.

Interview answer:

> Officer actions are protected with both authentication and role authorization. A beneficiary can have a valid token but still cannot access officer routes.

## 7. Core Flow: Schemes

Files:

- `src/modules/schemes/schemes.routes.ts`
- `src/modules/schemes/schemes.controller.ts`

Routes:

- `GET /api/schemes`
- `GET /api/schemes/:id`

The scheme list supports filters like:

- `state`
- `type`

The list endpoint excludes `baseCriteria` to keep responses lightweight. The detail endpoint returns the full scheme.

Interview answer:

> The catalog endpoint is read-focused and lightweight. The detailed endpoint returns complete scheme information only when needed.

## 8. Database Model

File:

- `prisma/schema.prisma`

Main models:

- `User`
- `Scheme`
- `BeneficiaryScheme`
- `Notification`

Relationship diagram:

```text
User 1 ---- many BeneficiaryScheme many ---- 1 Scheme
User 1 ---- many Notification
```

Important design points:

- `User.phone` is unique.
- `User.role` defaults to `BENEFICIARY`.
- `Scheme.baseCriteria` is JSON, so schemes can define flexible eligibility rules.
- `BeneficiaryScheme` tracks a user's relationship with a scheme.
- `@@unique([userId, schemeId])` prevents duplicate applications for the same user and scheme.

Application statuses:

- `ELIGIBLE`: system found the user eligible.
- `APPLIED`: user applied.
- `APPROVED`: officer approved application.
- `PAID`: payment completed.
- `PAYMENT_FAILED`: payment attempt failed.
- `REJECTED`: application rejected.

Interview answer:

> `BeneficiaryScheme` is the join table between users and schemes, but it also stores workflow state like eligibility, approval, and payment status.

## 9. Queue And Worker Flow

Files:

- `src/queue/queue.ts`
- `src/workers/unifiedWorker.ts`
- `src/utils/eligibilityEngine.ts`

The queue uses BullMQ with Redis. The API is the producer, and the worker is the consumer.

Eligibility scan flow:

```text
Officer creates scheme
        |
        v
API saves Scheme in PostgreSQL
        |
        v
API adds BullMQ job: check-eligibility-for-scheme
        |
        v
Worker fetches scheme and beneficiaries
        |
        v
Eligibility engine checks each user
        |
        v
Eligible users get BeneficiaryScheme + Notification
```

Why async?

- Scanning all users can be slow.
- HTTP requests should respond quickly.
- Redis/BullMQ lets the backend retry, monitor, and scale background jobs separately from API servers.

Interview answer:

> I used a queue because eligibility scanning is workload-heavy and can grow with the number of beneficiaries. The API should create the scheme quickly, while the worker performs the expensive scan asynchronously.

## 10. Eligibility Engine

File:

- `src/utils/eligibilityEngine.ts`

Checks performed:

- State and district matching.
- Income limit.
- Minimum and maximum age.
- Gender criteria.
- Minimum education using rank mapping.
- Occupation matching.

Example `baseCriteria`:

```json
{
  "incomeLimit": 50000,
  "minAge": 18,
  "maxAge": 60,
  "gender": "Female",
  "minEducation": "HIGHER_SECONDARY",
  "occupation": "Farmer"
}
```

Interview answer:

> The eligibility engine uses a JSON criteria object so new schemes can define different rules without requiring a database schema change for every new criterion.

## 11. Known Issues And Improvement Answers

Use these as honest, confident answers if asked what you would improve.

1. `src/server.ts` listens twice.
   - Current issue: `app.listen` is called directly and again inside `startServer`.
   - Better answer: connect to the database first, then call `app.listen` once.

2. Missing or unresolved grievance module import.
   - `src/app.ts` imports `./modules/grievance/grievanceController.js`, but the scanned project does not contain that module.
   - Better answer: either add the module properly or remove the unused import.

3. `req.user` needs proper TypeScript typing.
   - Current code attaches `decoded` JWT data to `req.user`.
   - Better answer: add Express request type augmentation so strict TypeScript understands `req.user`.

4. JWT secret fallback should be removed.
   - Current code falls back to `"supersecretkey"`.
   - Better answer: fail startup if `JWT_SECRET` is missing in production.

5. Input validation can be stronger.
   - Zod is installed and mentioned in guidelines, but the current controllers mostly use manual validation.
   - Better answer: define request schemas for auth, profile update, scheme creation, and payment initiation.

6. Worker could be made more production-ready.
   - Add job retries, dead-letter handling, structured logging, and monitoring.
   - For very large user counts, process users in pages instead of loading all matching users at once.

7. Payment and SMS are simulated.
   - Current payment uses random success/failure.
   - SMS is logged instead of sent through Twilio.
   - Better answer: these are placeholders that show integration points.

## 12. Mock Interview Q&A

### Q1. Open the codebase and explain the request flow from login to a protected route.

Answer:

Login starts in `auth.routes.ts`, which maps `POST /login` to the login controller. The controller finds the user by phone, verifies the bcrypt password, and signs a JWT containing the user's ID and role. For protected routes, the client sends that token in the Authorization header. `authMiddleware` verifies it and attaches the decoded payload to `req.user`. Then route handlers can use `req.user.id`, and officer routes additionally use `roleCheck(["OFFICER"])`.

### Q2. How does role-based access work?

Answer:

Authentication is handled first by `authMiddleware`. After that, `roleCheck` checks `req.user.role` against allowed roles. In `officer.routes.ts`, all officer routes use both middleware functions, so only authenticated users with role `OFFICER` can create schemes, view applications, or initiate payments.

### Q3. Why Prisma?

Answer:

Prisma gives type-safe database access, a clear schema file, migrations, and generated client methods. It also makes the data model easy to explain because models like `User`, `Scheme`, and `BeneficiaryScheme` are defined in one place.

### Q4. What happens when an officer creates a scheme?

Answer:

The officer sends scheme data and eligibility criteria to `POST /api/officer/schemes`. The controller creates a `Scheme` record in the database and then adds a BullMQ job called `check-eligibility-for-scheme`. The worker later consumes that job, scans beneficiaries, checks eligibility rules, and creates eligible application records and notifications.

### Q5. Why use Redis and BullMQ?

Answer:

Eligibility scans can become expensive as the number of beneficiaries grows. Doing that work inside the HTTP request would make the API slow or timeout. BullMQ and Redis let the API return quickly and move the heavy work to a background worker.

### Q6. How does the eligibility engine handle dynamic criteria?

Answer:

Each scheme stores `baseCriteria` as JSON. The eligibility engine reads that object and checks fields like income, age, gender, education, and occupation. This makes the scheme rules flexible without needing a new database column for every possible rule.

### Q7. What would you improve before production?

Answer:

I would fix the duplicate `app.listen`, remove the unresolved grievance import, add proper TypeScript typing for `req.user`, require secrets through environment validation, add Zod schemas for request validation, and improve worker reliability with retries and monitoring.

### Q8. How would you scale eligibility scans for lakhs of beneficiaries?

Answer:

I would page through beneficiaries instead of loading all users at once, filter as much as possible in the database, split jobs by state or district, add concurrency controls, and monitor queue length and failure rates. I would also consider indexing fields like role, state, district, income, and age depending on query patterns.

### Q9. How would you test this backend?

Answer:

I would test the eligibility engine with unit tests because it is pure business logic. Then I would add integration tests for auth, protected routes, scheme creation, and worker job behavior using a test database and Redis instance. For controllers, I would test both success and failure cases like missing token, wrong role, duplicate phone, invalid profile fields, and nonexistent scheme IDs.

### Q10. What are the security concerns?

Answer:

Passwords are hashed, which is good. The main concerns are allowing role selection during registration, falling back to a default JWT secret, missing strong request validation, and needing stricter CORS for production. Officer creation should usually be restricted, and production secrets should be mandatory.

## 13. One-Day Study Schedule

### Hour 1: Big Picture

- Read `README.md`.
- Open `src/app.ts` and `src/server.ts`.
- Practice the two-minute project pitch twice.

### Hour 2: Auth And RBAC

- Study auth routes, controller, and middleware.
- Practice explaining login to protected route flow.
- Write down one security improvement.

### Hour 3: Prisma Data Model

- Study `prisma/schema.prisma`.
- Draw the model relationships on paper.
- Explain `BeneficiaryScheme` as both join table and workflow table.

### Hour 4: Main API Modules

- Study beneficiary, officer, and schemes controllers.
- Practice explaining one endpoint from each module.
- Focus on what each route receives, does, and returns.

### Hour 5: Queue And Eligibility

- Study queue producer, worker, and eligibility engine.
- Practice explaining why the scan is async.
- Walk through one example user and one example scheme.

### Hour 6: Known Issues And Improvements

- Review the known issues section.
- Practice saying improvements calmly and constructively.
- Avoid sounding like the project is broken; frame them as production-hardening steps.

### Hour 7: Mock Interview

- Answer all 10 mock questions aloud.
- Open the related file while answering.
- Keep answers under 90 seconds unless asked for more detail.

### Final 30 Minutes: Rapid Review

- Repeat the two-minute pitch.
- Redraw the database relationship diagram.
- Explain the async queue flow from memory.
- Review the production improvements list.

## 14. Final Checklist

Before the interview, you should be able to do these without notes:

- Explain the backend in 2 minutes.
- Walk through `app.ts`, `server.ts`, auth middleware, one controller, Prisma schema, queue worker, and eligibility engine.
- Explain the difference between authentication and authorization.
- Explain why `BeneficiaryScheme` exists.
- Explain why BullMQ/Redis is used.
- Name at least five production improvements.
- Answer how the system would scale to many beneficiaries.
