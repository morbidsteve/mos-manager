import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: Number(id) },
            include: {
                marine: true,
                unit: true,
                bic: true, // Changed from 'billet' to 'bic'
            },
        })
        if (assignment) {
            return NextResponse.json(assignment)
        } else {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }
    } catch (error) {
        console.error("Error fetching Assignment:", error)
        return NextResponse.json({ error: "Error fetching Assignment" }, { status: 400 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        await prisma.assignment.delete({
            where: { id: Number(id) },
        })
        return NextResponse.json({ message: "Assignment deleted successfully" })
    } catch (error) {
        console.error("Error deleting Assignment:", error)
        return NextResponse.json({ error: "Error deleting Assignment" }, { status: 400 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        const body = await request.json()

        // Validate that the BIC exists and belongs to the specified unit
        const bic = await prisma.bIC.findFirst({
            where: {
                id: Number(body.bicId),
                unitId: Number(body.unitId),
            },
        })

        if (!bic) {
            return NextResponse.json({ error: "Invalid BIC for the specified unit" }, { status: 400 })
        }

        const updatedAssignment = await prisma.assignment.update({
            where: { id: Number(id) },
            data: {
                marineId: Number(body.marineId),
                unitId: Number(body.unitId),
                bicId: Number(body.bicId),
                dctb: new Date(body.dctb),
                djcu: new Date(body.djcu),
                ocd: body.ocd ? new Date(body.ocd) : null,
                tourLength: Number(body.tourLength),
                plannedEndDate: new Date(body.plannedEndDate),
            },
            include: {
                marine: true,
                unit: true,
                bic: true,
            },
        })

        return NextResponse.json(updatedAssignment)
    } catch (error) {
        console.error("Error updating assignment:", error)

        // Handle specific Prisma errors
        if (error.code === "P2003") {
            return NextResponse.json({ error: "Invalid BIC or Unit reference" }, { status: 400 })
        }

        return NextResponse.json(
            { error: "Failed to update assignment", details: error instanceof Error ? error.message : String(error) },
            { status: 500 },
        )
    }
}

