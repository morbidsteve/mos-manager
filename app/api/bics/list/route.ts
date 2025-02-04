import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const bics = await prisma.bIC.findMany({
            select: {
                id: true,
                bic: true,
                description: true,
                payGrade: true,
                unit: {
                    select: {
                        id: true,
                        mcc: true,
                        name: true,
                    },
                },
            },
        })
        return NextResponse.json(bics)
    } catch (error) {
        console.error("Error fetching BICs list:", error)
        return NextResponse.json({ error: "Error fetching BICs list" }, { status: 400 })
    }
}

