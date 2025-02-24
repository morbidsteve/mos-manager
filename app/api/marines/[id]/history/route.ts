import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    const { id } = await context.params
    const marineId = Number(id)

    if (isNaN(marineId)) {
        return NextResponse.json({ error: "Invalid Marine ID" }, { status: 400 })
    }

    try {
        const history = await prisma.marineHistory.findMany({
            where: { marineId },
            select: {
                changedAt: true,
                fieldName: true,
                oldValue: true,
                newValue: true,
            },
            orderBy: { changedAt: "desc" },
        })

        return NextResponse.json(history)
    } catch (error) {
        console.error("Error fetching Marine history:", error)
        return NextResponse.json({ error: "Error fetching Marine history" }, { status: 400 })
    }
}

