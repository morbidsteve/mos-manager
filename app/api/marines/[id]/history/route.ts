import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const marineId = Number.parseInt(id, 10)

    if (isNaN(marineId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    try {
        const history = await prisma.marineHistory.findMany({
            where: { marineId },
            orderBy: { changedAt: "desc" },
        })
        return NextResponse.json(history)
    } catch (error) {
        console.error("Error fetching Marine history:", error)
        return NextResponse.json({ error: "Error fetching Marine history" }, { status: 400 })
    }
}




