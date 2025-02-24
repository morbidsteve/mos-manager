const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
    console.log("Starting database setup...");

    try {
        // 1. Generate Prisma Client
        console.log("\n1. Generating Prisma Client...");
        execSync("npx prisma generate", { stdio: "inherit" });

        // 2. Run migrations
        console.log("\n2. Running database migrations...");
        execSync("npx prisma migrate dev", { stdio: "inherit" });

        // 3. Verify database connection
        console.log("\n3. Verifying database connection...");
        await prisma.$connect();

        // 4. Verify AuthorizedStrength table exists
        try {
            await prisma.authorizedStrength.findFirst();
            console.log("✅ AuthorizedStrength table verified");
        } catch (error) {
            throw new Error("Failed to verify AuthorizedStrength table. Schema may not have updated correctly.");
        }

        console.log("\n✅ Database setup completed successfully!");
        console.log("\nNext steps:");
        console.log("1. Restart your development server");
        console.log("2. Run 'npm run dev' to start the application");
    } catch (error) {
        console.error("\n❌ Error setting up database:", error);
        console.error("\nTroubleshooting steps:");
        console.error("1. Ensure your database is running");
        console.error("2. Check your DATABASE_URL in .env");
        console.error("3. Ensure you have the latest schema.prisma file");
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

setupDatabase();

