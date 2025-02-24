import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const assignments = await prisma.assignment.findMany({
            include: {
                marine: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        middleInitial: true,
                        payGrade: true,
                        pmos: true,
                    },
                },
                unit: {
                    select: {
                        id: true,
                        name: true,
                        mcc: true,
                    },
                },
                bic: {
                    select: {
                        id: true,
                        bic: true,
                        description: true,
                        payGrade: true,
                    },
                },
                orders: true,
            },
            orderBy: {
                dctb: "desc",
            },
        })
        return NextResponse.json(assignments)
    } catch (error) {
        console.error("Error fetching assignments:", error)
        return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.marineId || !data.unitId || !data.bicId || !data.dctb || !data.djcu) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Validate that the BIC belongs to the specified unit
        const bic = await prisma.bIC.findFirst({
            where: {
                id: Number(data.bicId),
                unitId: Number(data.unitId),
            },
        })

        if (!bic) {
            return NextResponse.json({ error: "Invalid BIC for the specified unit" }, { status: 400 })
        }

        const assignment = await prisma.assignment.create({
            data: {
                marineId: Number(data.marineId),
                unitId: Number(data.unitId),
                bicId: Number(data.bicId),
                dctb: new Date(data.dctb),
                djcu: new Date(data.djcu),
                ocd: data.ocd ? new Date(data.ocd) : null,
                tourLength: Number(data.tourLength || 24),
                plannedEndDate: new Date(
                    data.plannedEndDate || new Date(data.dctb).setMonth(new Date(data.dctb).getMonth() + (data.tourLength || 24)),
                ),
            },
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true,
            },
        })

        return NextResponse.json(assignment)
    } catch (error) {
        console.error("Error creating assignment:", error)
        return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...data } = await request.json()

        if (!id) {
            return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
        }

        const assignment = await prisma.assignment.update({
            where: { id: Number(id) },
            data: {
                marineId: Number(data.marineId),
                unitId: Number(data.unitId),
                bicId: Number(data.bicId),
                dctb: new Date(data.dctb),
                djcu: new Date(data.djcu),
                ocd: data.ocd ? new Date(data.ocd) : null,
                tourLength: Number(data.tourLength),
                plannedEndDate: new Date(data.plannedEndDate),
            },
            include: {
                marine: true,
                unit: true,
                bic: true,
                orders: true,
            },
        })

        return NextResponse.json(assignment)
    } catch (error) {
        console.error("Error updating assignment:", error)
        return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
        }

        await prisma.assignment.delete({
            where: { id: Number(id) },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting assignment:", error)
        return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

