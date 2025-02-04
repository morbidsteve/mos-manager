import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const marines = await prisma.marine.findMany({
            select: {
                id: true,
                edipi: true,
                lastName: true,
                firstName: true,
            },
        })
        return NextResponse.json(marines)
    } catch (error) {
        console.error("Error fetching Marines list:", error)
        return NextResponse.json({ error: "Error fetching Marines list" }, { status: 400 })
    }
}

