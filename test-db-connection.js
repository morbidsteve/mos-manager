import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testConnection() {
    try {
        // Test database connection
        console.log("Testing database connection...")
        await prisma.$connect()
        console.log("Successfully connected to database")

        // Count existing records
        const marineCount = await prisma.marine.count()
        const unitCount = await prisma.unit.count()
        const bicCount = await prisma.bIC.count()
        const assignmentCount = await prisma.assignment.count()

        console.log("\nCurrent record counts:")
        console.log("Marines:", marineCount)
        console.log("Units:", unitCount)
        console.log("BICs:", bicCount)
        console.log("Assignments:", assignmentCount)

        // Add a test unit if none exist
        if (unitCount === 0) {
            console.log("\nAdding test unit...")
            const unit = await prisma.unit.create({
                data: {
                    mcc: "TEST1",
                    name: "Test Unit",
                },
            })
            console.log("Created test unit:", unit)
        }

        // Add a test marine if none exist
        if (marineCount === 0) {
            console.log("\nAdding test marine...")
            const marine = await prisma.marine.create({
                data: {
                    edipi: "1234567890",
                    lastName: "Test",
                    firstName: "Marine",
                    payGrade: "E5",
                    pmos: "0123",
                },
            })
            console.log("Created test marine:", marine)
        }
    } catch (error) {
        console.error("Database test failed:", error)
    } finally {
        await prisma.$disconnect()
    }
}

testConnection()

