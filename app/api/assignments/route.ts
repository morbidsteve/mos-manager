import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const assignments = await prisma.assignment.findMany({
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true,
                history: {
                    orderBy: {
                        changedAt: 'desc'
                    }
                }
            },
            orderBy: [
                { dctb: 'desc' }
            ]
        })
        return NextResponse.json(assignments)
    } catch (error) {
        console.error("Error fetching assignments:", error)
        return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Create assignment and history in transaction
        const [assignment] = await prisma.$transaction([
            prisma.assignment.create({
                data,
                include: {
                    marine: true,
                    unit: true,
                    bic: true,
                    orders: true
                }
            }),
            prisma.assignmentHistory.create({
                data: {
                    assignmentId: (await prisma.assignment.findFirst({ orderBy: { id: 'desc' } }))!.id + 1,
                    changeType: 'CREATE',
                    newValue: JSON.stringify(data)
                }
            })
        ])

        return NextResponse.json(assignment)
    } catch (error) {
        console.error("Error creating assignment:", error)
        return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...data } = await request.json()

        // Get current assignment data for history
        const currentAssignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true
            }
        })

        if (!currentAssignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        // Update assignment and create history in transaction
        const [updatedAssignment] = await prisma.$transaction([
            prisma.assignment.update({
                where: { id },
                data,
                include: {
                    marine: true,
                    unit: true,
                    bic: true,
                    orders: true
                }
            }),
            prisma.assignmentHistory.create({
                data: {
                    assignmentId: id,
                    changeType: 'UPDATE',
                    oldValue: JSON.stringify(currentAssignment),
                    newValue: JSON.stringify({ ...currentAssignment, ...data })
                }
            })
        ])

        return NextResponse.json(updatedAssignment)
    } catch (error) {
        console.error("Error updating assignment:", error)
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()

        // Get current assignment data for history
        const currentAssignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true
            }
        })

        if (!currentAssignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        // Delete assignment and create history in transaction
        await prisma.$transaction([
            prisma.assignmentHistory.create({
                data: {
                    assignmentId: id,
                    changeType: 'DELETE',
                    oldValue: JSON.stringify(currentAssignment)
                }
            }),
            prisma.assignment.delete({
                where: { id }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting assignment:", error)
        return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
    }
}
