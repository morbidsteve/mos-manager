import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        const bic = await prisma.billet.findUnique({
            where: { id: Number(id) },
            include: { unit: true },
        })
        if (bic) {
            return NextResponse.json(bic)
        } else {
            return NextResponse.json({ error: "BIC not found" }, { status: 404 })
        }
    } catch (error) {
        console.error("Error fetching BIC:", error)
        return NextResponse.json({ error: "Error fetching BIC" }, { status: 400 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    const body = await request.json()
    try {
        const updatedBIC = await prisma.billet.update({
            where: { id: Number(id) },
            data: {
                bic: body.bic,
                description: body.description,
                payGrade: body.payGrade,
                unitId: Number(body.unitId),
            },
        })
        return NextResponse.json(updatedBIC)
    } catch (error) {
        console.error("Error updating BIC:", error)
        return NextResponse.json({ error: "Error updating BIC" }, { status: 400 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = params.id
    try {
        // First, delete all assignments related to this BIC
        await prisma.assignment.deleteMany({
            where: { billetId: Number(id) },
        })

        // Then, delete the BIC
        await prisma.billet.delete({
            where: { id: Number(id) },
        })
        return NextResponse.json({ message: "BIC and related assignments deleted successfully" })
    } catch (error) {
        console.error("Error deleting BIC:", error)
        return NextResponse.json({ error: "Error deleting BIC" }, { status: 400 })
    }
}

