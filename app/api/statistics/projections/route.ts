import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { generateProjections } from "@/lib/calculations"

const prisma = new PrismaClient()

export async function GET(request: Request) {
    try {
        // Get all current and future assignments
        const assignments = await prisma.assignment.findMany({
            include: {
                marine: {
                    select: {
                        payGrade: true,
                        pmos: true,
                    },
                },
            },
            orderBy: {
                dctb: "asc",
            },
        })

        // Get authorized strength numbers
        const authorizedStrength = await prisma.authorizedStrength.findMany()

        // Generate projections
        const projections = generateProjections(assignments, authorizedStrength)

        return NextResponse.json(projections)
    } catch (error) {
        console.error("Error generating projections:", error)
        return NextResponse.json({ error: "Failed to generate projections" }, { status: 500 })
    }
}

