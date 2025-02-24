const { execSync } = require("child_process")
const { writeFileSync, readFileSync } = require("fs")
const { join } = require("path")

async function updateSystem() {
    console.log("\n🚀 Starting system update...")

    try {
        // 1. Install dependencies with legacy peer deps
        console.log("📦 Installing dependencies...")
        const packages = [
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "date-fns",
            "react-day-picker",
        ]
        execSync(`npm install ${packages.join(" ")} --legacy-peer-deps`, { stdio: "inherit" })
        console.log("✅ Dependencies installed\n")

        // 2. Run database migrations
        console.log("🔄 Running database migrations...")
        execSync("npx prisma migrate reset --force", { stdio: "inherit" })
        execSync("npx prisma migrate dev --name add_orders_model", { stdio: "inherit" })
        console.log("✅ Database migrated\n")

        // 3. Generate Prisma client
        console.log("⚙️ Generating Prisma client...")
        execSync("npx prisma generate", { stdio: "inherit" })
        console.log("✅ Prisma client generated\n")

        // 4. Verify schema by running a test script
        console.log("🔍 Verifying new schema...")
        const verifyScript = `
    const { PrismaClient } = require('@prisma/client');
    
    async function verify() {
      const prisma = new PrismaClient();
      try {
        await prisma.$connect();
        const tables = await prisma.$queryRaw\`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        \`;
        console.log('Available tables:', tables);
        
        await prisma.orders.findFirst();
        console.log('✅ Orders table verified');
        process.exit(0);
      } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
      } finally {
        await prisma.$disconnect();
      }
    }
    
    verify();
    `

        writeFileSync("verify-schema.js", verifyScript)
        execSync("node verify-schema.js", { stdio: "inherit" })
        execSync("rm verify-schema.js")

        // 5. Kill any existing Next.js development server
        console.log("\n🔄 Restarting development server...")
        try {
            if (process.platform === "win32") {
                execSync("taskkill /F /IM node.exe /T", { stdio: "ignore" })
            } else {
                execSync('pkill -f "next dev"', { stdio: "ignore" })
            }
        } catch (error) {
            // Ignore errors if no process was found to kill
        }

        // 6. Start the development server
        console.log("Starting development server...")
        const startServer = process.platform === "win32" ? 'start cmd /c "npm run dev"' : "npm run dev &"

        execSync(startServer, { stdio: "inherit" })

        console.log("\n✅ System update completed successfully!")
        console.log("The development server has been restarted automatically.")
        console.log("The system is ready to handle orders.\n")
    } catch (error) {
        console.error("\n❌ Error updating system:", error.message)
        console.error("\nDetailed error information:")
        console.error(error)
        console.error("\nTroubleshooting steps:")
        console.error("1. Ensure your database is running")
        console.error("2. Check your DATABASE_URL in .env is correct")
        console.error("3. Try running the following commands manually:")
        console.error("   npx prisma migrate reset --force")
        console.error("   npx prisma migrate dev")
        console.error("   npx prisma generate\n")
        process.exit(1)
    }
}

updateSystem()

