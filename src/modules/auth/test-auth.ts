import "dotenv/config"; // <-- ADD THIS LINE
import { AuthService } from "./auth.service.js";
import { prisma } from "../../db/prisma.js";
import { Role } from "@prisma/client"; // Import the Role enum from Prisma

// --- Configuration ---
// Add all roles from your Prisma schema that you want to test.
const rolesToTest: Role[] = [
  "BENEFICIARY",
  "ENUMERATOR",
  // "ADMIN", // Uncomment or add other roles as needed
];
// -------------------

async function runAllRoleTests() {
  const authService = new AuthService();
  let allTestsPassed = true;

  for (const role of rolesToTest) {
    console.log(`\n--- Testing for role: ${role} ---`);
    const testUserCredentials = {
      email: `${role.toLowerCase()}-test@example.com`,
      password: "Test123!@#",
      name: `${role} Test User`,
      role: role,
    };

    try {
      // 1. Test Registration
      console.log(`[${role}] Testing Registration...`);
      const registered = await authService.register(testUserCredentials);
      console.log(
        `✓ [${role}] Registration successful for:`,
        registered.user.email
      );

      // 2. Test Login
      console.log(`\n[${role}] Testing Login...`);
      const loggedIn = await authService.login({
        email: testUserCredentials.email,
        password: testUserCredentials.password,
      });
      console.log(`✓ [${role}] Login successful for:`, loggedIn.user.email);
      console.log(`--- Test for ${role} PASSED ---`);
    } catch (error) {
      console.error(`✗ [${role}] Test FAILED:`, error);
      allTestsPassed = false;
    } finally {
      // 3. Cleanup: Delete the user to ensure the test is repeatable
      console.log(`\n[${role}] Cleaning up test user...`);
      await prisma.user
        .delete({
          where: { email: testUserCredentials.email },
        })
        .catch(() => {
          // Suppress error if user was never created
        });
      console.log(`✓ [${role}] Cleanup complete.`);
    }
  }

  // Final Summary
  if (allTestsPassed) {
    console.log("\n\n✅✅✅ All role tests passed successfully! ✅✅✅");
  } else {
    console.log(
      "\n\n❌❌❌ Some role tests failed. Please review the logs. ❌❌❌"
    );
  }

  // Disconnect prisma client to allow the script to exit
  await prisma.$disconnect();
}

runAllRoleTests();
