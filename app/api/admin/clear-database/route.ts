import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST() {
    try {
        // Clear all tables
        await prisma.$transaction([
            prisma.marineHistory.deleteMany(),
            prisma.assignmentHistory.deleteMany(),
            prisma.changeLog.deleteMany(),
            prisma.assignment.deleteMany(),
            prisma.bIC.deleteMany(),
            prisma.marine.deleteMany(),
            prisma.unit.deleteMany(),
            prisma.promotionEvent.deleteMany(),
        ])

        return NextResponse.json({ message: "Database cleared successfully" })
    } catch (error) {
        console.error("Error clearing database:", error)
        return NextResponse.json({ error: "Error clearing database" }, { status: 500 })
    }
}

