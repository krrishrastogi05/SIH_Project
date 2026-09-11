import app from "./app.js"; // Added .js
import { prisma } from "./db/prisma.js"; // Added .js
import { publishSchemes } from "./queue/outbox.js";

const PORT = Number(process.env.PORT) || 8000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Retry schemes that did not get to the queue
    publishSchemes();
    setInterval(publishSchemes, 10_000);

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();
