import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
    log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
    ],
})

// Log all queries
prisma.$on("query", (e) => {
    console.log("Query: " + e.query)
    console.log("Params: " + e.params)
    console.log("Duration: " + e.duration + "ms")
    console.log("-------------------")
})

async function inspectFullDatabase() {
    try {
        console.log("\n=== STARTING FULL DATABASE INSPECTION ===\n")

        // 1. Inspect Marines
        console.log("\n=== MARINES ===\n")
        const marines = await prisma.marine.findMany({
            include: {
                assignments: {
                    include: {
                        unit: true,
                        bic: true,
                        orders: true,
                    },
                },
                orders: true,
                marineHistory: true,
            },
        })
        console.log("Marine Count:", marines.length)
        console.log("Marine Data:", JSON.stringify(marines, null, 2))

        // 2. Inspect Units
        console.log("\n=== UNITS ===\n")
        const units = await prisma.unit.findMany({
            include: {
                assignments: {
                    include: {
                        marine: true,
                        bic: true,
                        orders: true,
                    },
                },
                bics: true,
                orders: true,
            },
        })
        console.log("Unit Count:", units.length)
        console.log("Unit Data:", JSON.stringify(units, null, 2))

        // 3. Inspect BICs
        console.log("\n=== BICs ===\n")
        const bics = await prisma.bIC.findMany({
            include: {
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                        orders: true,
                    },
                },
            },
        })
        console.log("BIC Count:", bics.length)
        console.log("BIC Data:", JSON.stringify(bics, null, 2))

        // 4. Inspect Assignments
        console.log("\n=== ASSIGNMENTS ===\n")
        const assignments = await prisma.assignment.findMany({
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true,
                history: true,
            },
        })
        console.log("Assignment Count:", assignments.length)
        console.log("Assignment Data:", JSON.stringify(assignments, null, 2))

        // 5. Inspect Orders
        console.log("\n=== ORDERS ===\n")
        const orders = await prisma.orders.findMany({
            include: {
                marine: true,
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                        unit: true,
                        bic: true,
                    },
                },
            },
        })
        console.log("Orders Count:", orders.length)
        console.log("Orders Data:", JSON.stringify(orders, null, 2))

        // 6. Inspect Marine History
        console.log("\n=== MARINE HISTORY ===\n")
        const marineHistory = await prisma.marineHistory.findMany({
            include: {
                marine: true,
            },
        })
        console.log("Marine History Count:", marineHistory.length)
        console.log("Marine History Data:", JSON.stringify(marineHistory, null, 2))

        // 7. Inspect Assignment History
        console.log("\n=== ASSIGNMENT HISTORY ===\n")
        const assignmentHistory = await prisma.assignmentHistory.findMany({
            include: {
                assignment: {
                    include: {
                        marine: true,
                        unit: true,
                        bic: true,
                    },
                },
            },
        })
        console.log("Assignment History Count:", assignmentHistory.length)
        console.log("Assignment History Data:", JSON.stringify(assignmentHistory, null, 2))

        // 8. Inspect Change Log
        console.log("\n=== CHANGE LOG ===\n")
        const changeLogs = await prisma.changeLog.findMany()
        console.log("Change Log Count:", changeLogs.length)
        console.log("Change Log Data:", JSON.stringify(changeLogs, null, 2))

        // 9. Inspect Promotion Events
        console.log("\n=== PROMOTION EVENTS ===\n")
        const promotionEvents = await prisma.promotionEvent.findMany()
        console.log("Promotion Events Count:", promotionEvents.length)
        console.log("Promotion Events Data:", JSON.stringify(promotionEvents, null, 2))
    } catch (error) {
        console.error("Error during database inspection:", error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the inspection
inspectFullDatabase()
    .then(() => console.log("\nDatabase inspection completed."))
    .catch(console.error)

