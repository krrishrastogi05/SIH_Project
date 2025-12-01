import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Fetching all schemes from the database...');

  try {
    // Fetch all records from the Scheme table
    const schemes = await prisma.scheme.findMany({
      // Optional: order by most recent
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (schemes.length === 0) {
      console.log('🟡 The "Scheme" table is empty.');
      return;
    }

    console.log(`✅ Found ${schemes.length} scheme(s).`);
    console.log('---');

    // Print the schemes in a readable, nested format
    console.dir(schemes, { depth: null });

  } catch (error) {
    console.error('❌ An error occurred while fetching schemes:', error);
  } finally {
    // Ensure the database connection is closed when the script finishes
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the main function
main();