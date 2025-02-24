import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
})

async function checkDatabaseContents() {
    try {
        console.log("\n=== Checking Marines ===")
        const marines = await prisma.marine.findMany({
            include: {
                assignments: {
                    include: {
                        unit: true,
                        bic: true,
                        orders: true,
                    },
                },
                marineHistory: true,
            },
        })
        console.log(`Found ${marines.length} marines`)
        console.log(JSON.stringify(marines, null, 2))

        console.log("\n=== Checking Units ===")
        const units = await prisma.unit.findMany({
            include: {
                assignments: {
                    include: {
                        marine: true,
                        bic: true,
                    },
                },
                bics: true,
            },
        })
        console.log(`Found ${units.length} units`)
        console.log(JSON.stringify(units, null, 2))

        console.log("\n=== Checking BICs ===")
        const bics = await prisma.bIC.findMany({
            include: {
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                    },
                },
            },
        })
        console.log(`Found ${bics.length} BICs`)
        console.log(JSON.stringify(bics, null, 2))

        console.log("\n=== Checking Assignments ===")
        const assignments = await prisma.assignment.findMany({
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true,
                history: true,
            },
        })
        console.log(`Found ${assignments.length} assignments`)
        console.log(JSON.stringify(assignments, null, 2))

        console.log("\n=== Checking Orders ===")
        const orders = await prisma.orders.findMany({
            include: {
                marine: true,
                unit: true,
                assignments: true,
            },
        })
        console.log(`Found ${orders.length} orders`)
        console.log(JSON.stringify(orders, null, 2))
    } catch (error) {
        console.error("Error checking database contents:", error)
    } finally {
        await prisma.$disconnect()
    }
}

checkDatabaseContents()

