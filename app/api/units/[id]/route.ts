import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        const unit = await prisma.unit.findUnique({
            where: { id: Number(id) },
        })
        if (unit) {
            return NextResponse.json(unit)
        } else {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 })
        }
    } catch (error) {
        console.error("Error fetching Unit:", error)
        return NextResponse.json({ error: "Error fetching Unit" }, { status: 400 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        await prisma.$transaction(async (prisma) => {
            // First, delete all assignments related to this unit
            await prisma.assignment.deleteMany({
                where: { unitId: Number(id) },
            })

            // Then, delete all Billets related to this unit
            await prisma.billet.deleteMany({
                where: { unitId: Number(id) },
            })

            // Finally, delete the unit
            await prisma.unit.delete({
                where: { id: Number(id) },
            })
        })

        return NextResponse.json({ message: "Unit and related records deleted successfully" })
    } catch (error) {
        console.error("Error deleting Unit:", error)
        return NextResponse.json({ error: "Error deleting Unit and its related records" }, { status: 400 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    const body = await request.json()
    try {
        const updatedUnit = await prisma.unit.update({
            where: { id: Number(id) },
            data: body,
        })
        return NextResponse.json(updatedUnit)
    } catch (error) {
        console.error("Error updating Unit:", error)
        return NextResponse.json({ error: "Error updating Unit" }, { status: 400 })
    }
}

