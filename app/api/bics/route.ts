import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const bics = await prisma.bIC.findMany({
            include: {
                unit: true,
            },
        })
        return NextResponse.json(bics)
    } catch (error) {
        console.error("Error fetching BICs:", error)
        return NextResponse.json({ error: "Error fetching BICs" }, { status: 400 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const bic = await prisma.bIC.create({
            data: {
                bic: body.bic,
                description: body.description,
                payGrade: body.payGrade,
                unitId: Number(body.unitId),
            },
        })
        return NextResponse.json(bic, { status: 201 })
    } catch (error) {
        console.error("Error creating BIC:", error)
        return NextResponse.json({ error: "Error creating BIC" }, { status: 400 })
    }
}

