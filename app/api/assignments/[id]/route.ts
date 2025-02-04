import { type NextRequest, NextResponse } from "next/server"
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

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    const { id } = context.params
    const assignmentId = Number(id)

    if (isNaN(assignmentId)) {
        return NextResponse.json({ error: "Invalid Assignment ID" }, { status: 400 })
    }

    const body = await request.json()
    try {
        const currentAssignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { marine: true, unit: true, bic: true },
        })

        if (!currentAssignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        const updatedAssignment = await prisma.$transaction(async (prisma) => {
            const updated = await prisma.assignment.update({
                where: { id: assignmentId },
                data: {
                    marineId: Number(body.marineId),
                    unitId: Number(body.unitId),
                    bicId: Number(body.bicId),
                    dctb: new Date(body.dctb),
                    djcu: new Date(body.djcu),
                    ocd: body.ocd ? new Date(body.ocd) : null,
                    plannedEndDate: new Date(body.plannedEndDate),
                    tourLength: Number(body.tourLength),
                },
                include: { marine: true, unit: true, bic: true },
            })

            // Create AssignmentHistory entry
            await prisma.assignmentHistory.create({
                data: {
                    assignmentId: assignmentId,
                    changeType: "UPDATE",
                    oldValue: JSON.stringify(currentAssignment),
                    newValue: JSON.stringify(updated),
                },
            })

            // Create ChangeLog entry
            await prisma.changeLog.create({
                data: {
                    modelName: "Assignment",
                    recordId: assignmentId,
                    changeType: "UPDATE",
                    oldValue: JSON.stringify(currentAssignment),
                    newValue: JSON.stringify(updated),
                },
            })

            return updated
        })

        return NextResponse.json(updatedAssignment)
    } catch (error) {
        console.error("Error updating Assignment:", error)
        return NextResponse.json({ error: "Error updating Assignment" }, { status: 400 })
    }
}

