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
        const now = new Date()
        const assignmentHistory = await prisma.assignment.findMany({
            where: {
                marineId: marineId,
            },
            include: {
                unit: true,
                bic: true,
            },
            orderBy: {
                dctb: "desc",
            },
        })

        // Categorize assignments
        const categorizedAssignments = {
            past: assignmentHistory.filter((a) => new Date(a.plannedEndDate) < now),
            current: assignmentHistory.filter((a) => new Date(a.dctb) <= now && new Date(a.plannedEndDate) >= now),
            future: assignmentHistory.filter((a) => new Date(a.dctb) > now),
        }

        return NextResponse.json(categorizedAssignments)
    } catch (error) {
        console.error("Error fetching Assignment history:", error)
        return NextResponse.json({ error: "Error fetching Assignment history" }, { status: 400 })
    }
}

