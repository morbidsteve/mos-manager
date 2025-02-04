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
                billet: true,
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
    const body = await request.json()
    try {
        const updatedAssignment = await prisma.assignment.update({
            where: { id: Number(id) },
            data: {
                dctb: body.dctb,
                djcu: body.djcu,
                ocd: body.ocd,
            },
        })
        return NextResponse.json(updatedAssignment)
    } catch (error) {
        console.error("Error updating Assignment:", error)
        return NextResponse.json({ error: "Error updating Assignment" }, { status: 400 })
    }
}

