

-----

````markdown
# 📘 Backend Developer Guide & Architecture Standards

> **Status:** Active
> **Stack:** Node.js (ESM), TypeScript, Express, Prisma, Zod
> **Purpose:** This document is the strict "Source of Truth" for code generation and contribution.

---

## 1. Project Overview & Directory Structure
We use a **Modular Architecture**. Code is organized by "feature" rather than by "technical layer" (e.g., we do NOT have a giant `controllers/` folder).

### Directory Tree
```text
src/
├── app.ts                  # Application setup (Middleware, CORS)
├── server.ts               # Entry point (Port listening, DB connection)
├── db/
│   └── prisma.ts           # ⚠️ The ONLY place PrismaClient is instantiated
├── utils/                  # Shared helpers (JWT, Redis, Cloudinary)
└── modules/                # Feature Modules
    ├── auth/               # Example Module
    └── [feature_name]/
        ├── [feature].controller.ts  # HTTP Layer (Req/Res)
        ├── [feature].service.ts     # Business Logic Layer (Pure TS)
        ├── [feature].schema.ts      # Validation Layer (Zod)
        └── [feature].routes.ts      # Routing Layer
````

-----

## 2\. ⚠️ The Golden Rules (Strict Enforcement)

**Violation of these rules will cause runtime errors or architectural debt.**

### 🛑 Rule \#1: File Extensions in Imports

**Context:** We are running Node.js in strict **ES Modules** mode.

  * **THE RULE:** You **MUST** append `.js` to all local relative imports.
  * ✅ **Correct:** `import { prisma } from "../../db/prisma.js";`
  * ❌ **Incorrect:** `import { prisma } from "../../db/prisma";`
  * ❌ **Incorrect:** `import { prisma } from "../../db/prisma.ts";`

### 🛑 Rule \#2: Database Connection (Singleton Pattern)

**Context:** Prisma manages a pool of connections. Opening multiple pools exhausts the database.

  * **THE RULE:** **NEVER** use `new PrismaClient()` inside a controller or service.
  * **THE RULE:** **ALWAYS** import the shared instance.
    ```typescript
    import { prisma } from "../../db/prisma.js";
    ```

### 🛑 Rule \#3: Separation of Concerns

  * **Controllers:** handle `req` (Request) and `res` (Response). They parse cookies, read headers, and send JSON. They **NEVER** contain complex logic or direct DB calls.
  * **Services:** handle **Business Logic**. They accept pure arguments (strings, objects) and return data. They **NEVER** know what "Express" is (no `req`, no `res`).

### 🛑 Rule \#4: Environment Variables

  * **THE RULE:** Never hardcode secrets.
  * **Usage:** Use `process.env.VARIABLE_NAME`.
  * **Setup:** `dotenv.config()` is called **once** in `app.ts`. Do not call it in every file.

-----

## 3\. The "4-File" Module System

Every feature (e.g., `Products`, `Orders`) is composed of exactly 4 files. Copy these patterns strictly.

### 📄 File 1: Schema (`[name].schema.ts`)

  * **Purpose:** Validate input before it hits your logic.
  * **Tool:** `zod`

<!-- end list -->

```typescript
import { z } from "zod";

// Define the shape of expected data
export const createItemSchema = z.object({
  title: z.string().min(3),
  count: z.number().int().positive(),
  tags: z.array(z.string()).optional()
});

// Export the type for use in the Service
export type CreateItemInput = z.infer<typeof createItemSchema>;
```

### 📄 File 2: Service (`[name].service.ts`)

  * **Purpose:** The brain of the operation. Database interaction.
  * **Constraint:** Must be pure TypeScript classes/functions.

<!-- end list -->

```typescript
import { prisma } from "../../db/prisma.js"; // Note the .js!
import { CreateItemInput } from "./[name].schema.js";

export class ItemService {
  // Use static methods for simplicity
  static async create(data: CreateItemInput) {
    // Business logic happens here
    return await prisma.item.create({
      data: {
        title: data.title,
        count: data.count
        // Prisma handles the DB, not the Controller
      }
    });
  }
}
```

### 📄 File 3: Controller (`[name].controller.ts`)

  * **Purpose:** The traffic cop. Validates request -\> Calls Service -\> Sends Response.
  * **Constraint:** Must catch errors.

<!-- end list -->

```typescript
import { Request, Response } from "express";
import { ItemService } from "./[name].service.js";
import { createItemSchema } from "./[name].schema.js";

export class ItemController {
  static async create(req: Request, res: Response) {
    try {
      // 1. Validation
      const parse = createItemSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ errors: parse.error });
      }

      // 2. Logic Execution
      const result = await ItemService.create(parse.data);

      // 3. Response
      return res.status(201).json({ 
        message: "Item created successfully",
        data: result 
      });
      
    } catch (error: any) {
      // 4. Error Handling
      console.error(error); // Log for server
      return res.status(500).json({ message: error.message });
    }
  }
}
```

### 📄 File 4: Routes (`[name].routes.ts`)

  * **Purpose:** Map URLs to Controller methods.

<!-- end list -->

```typescript
import { Router } from "express";
import { ItemController } from "./[name].controller.js";

const router = Router();

// Define verbs
router.post("/", (req, res) => ItemController.create(req, res));
// router.get("/", (req, res) => ItemController.getAll(req, res));

export default router;
```

-----

## 4\. API Response Standards

To ensure the frontend can consume APIs predictably, follow these JSON structures:

**Success Response (200/201):**

```json
{
  "message": "Operation successful",
  "data": { ...object or array... },
  "token": "..." // Optional, for auth
}
```

**Validation Error (400):**

```json
{
  "name": "ZodError",
  "issues": [ ... ] 
}
```

**Server Error (500):**

```json
{
  "message": "Internal Server Error details..." 
}
```

-----

## 5\. Testing Protocol (Standalone Scripts)

We do not currently use Jest/Mocha. We use **Standalone TypeScript Scripts** to test logic rapidly.

**Steps to create a test:**

1.  Create `test-[feature].ts` inside the module folder.
2.  **CRITICAL:** Add `import "dotenv/config";` at the very top.
3.  Write a self-executing async function.
4.  Run it via `npx tsx src/modules/[feature]/test-[feature].ts`.

**Test Template:**

```typescript
import "dotenv/config"; 
import { ItemService } from "./[name].service.js";
import { prisma } from "../../db/prisma.js";

async function runTest() {
  console.log("🚀 Starting Test...");
  try {
    const result = await ItemService.create({ title: "Test", count: 1 });
    console.log("✅ Success:", result);
  } catch (err) {
    console.error("❌ Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}
runTest();
```

```
```