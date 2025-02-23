import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        await prisma.$connect()
        return NextResponse.json({ status: "ok" })
    } catch (error) {
        console.error("Database connection error:", error)
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
}

