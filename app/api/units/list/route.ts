import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const units = await prisma.unit.findMany({
            select: {
                id: true,
                mcc: true,
                name: true,
            },
        })
        return NextResponse.json(units)
    } catch (error) {
        console.error("Error fetching Units list:", error)
        return NextResponse.json({ error: "Error fetching Units list" }, { status: 400 })
    }
}

