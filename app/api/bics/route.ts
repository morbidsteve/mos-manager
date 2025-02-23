import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const bics = await prisma.bIC.findMany({
            include: {
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                    },
                    where: {
                        djcu: {
                            gt: new Date(),
                        },
                    },
                    take: 1,
                },
            },
        })
        return NextResponse.json(bics)
    } catch (error) {
        console.error("Error fetching BICs:", error)
        return NextResponse.json({ error: "Failed to fetch BICs" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const bic = await prisma.bIC.create({
            data,
            include: {
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                    },
                },
            },
        })
        return NextResponse.json(bic)
    } catch (error) {
        console.error("Error creating BIC:", error)
        return NextResponse.json({ error: "Failed to create BIC" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...data } = await request.json()
        const bic = await prisma.bIC.update({
            where: { id },
            data,
            include: {
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                    },
                },
            },
        })
        return NextResponse.json(bic)
    } catch (error) {
        console.error("Error updating BIC:", error)
        return NextResponse.json({ error: "Failed to update BIC" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()
        await prisma.bIC.delete({
            where: { id },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting BIC:", error)
        return NextResponse.json({ error: "Failed to delete BIC" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

