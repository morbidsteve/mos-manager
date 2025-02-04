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
        const assignmentHistory = await prisma.assignmentHistory.findMany({
            where: {
                assignment: {
                    marineId: marineId,
                },
            },
            orderBy: {
                changedAt: "desc",
            },
        })

        return NextResponse.json(assignmentHistory)
    } catch (error) {
        console.error("Error fetching Assignment history:", error)
        return NextResponse.json({ error: "Error fetching Assignment history" }, { status: 400 })
    }
}

