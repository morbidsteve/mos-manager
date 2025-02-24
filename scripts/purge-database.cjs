const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function purgeDatabase() {
    console.log("Starting database purge...")

    try {
        // Delete all records in reverse order of dependencies
        await prisma.$transaction([
            prisma.marineHistory.deleteMany(),
            prisma.assignmentHistory.deleteMany(),
            prisma.changeLog.deleteMany(),
            prisma.assignment.deleteMany(),
            prisma.orders.deleteMany(),
            prisma.bIC.deleteMany(),
            prisma.marine.deleteMany(),
            prisma.unit.deleteMany(),
        ])

        console.log("Database successfully purged!")
    } catch (error) {
        console.error("Error purging database:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

purgeDatabase()
    .catch(console.error)

