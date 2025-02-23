import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const orders = await prisma.orders.findMany({
            include: {
                marine: true,
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                        unit: true,
                        bic: true
                    }
                }
            },
            orderBy: [
                { issuedDate: 'desc' }
            ]
        })
        return NextResponse.json(orders)
    } catch (error) {
        console.error("Error fetching orders:", error)
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Create orders and related assignment in transaction
        const [orders] = await prisma.$transaction([
            prisma.orders.create({
                data: {
                    ...data,
                    assignments: {
                        create: {
                            marineId: data.marineId,
                            unitId: data.unitId,
                            bicId: data.bicId,
                            dctb: new Date(data.reportNoLaterThan),
                            djcu: new Date(data.reportNoLaterThan),
                            ocd: data.tdyStartDate ? new Date(data.tdyStartDate) : null,
                            tourLength: data.tourLength || 24,
                            plannedEndDate: new Date(data.reportNoLaterThan)
                        }
                    }
                },
                include: {
                    marine: true,
                    unit: true,
                    assignments: {
                        include: {
                            marine: true,
                            unit: true,
                            bic: true
                        }
                    }
                }
            }),
            prisma.changeLog.create({
                data: {
                    modelName: 'Orders',
                    recordId: (await prisma.orders.findFirst({ orderBy: { id: 'desc' } }))!.id + 1,
                    changeType: 'CREATE',
                    newValue: JSON.stringify(data)
                }
            })
        ])

        return NextResponse.json(orders)
    } catch (error) {
        console.error("Error creating orders:", error)
        return NextResponse.json({ error: "Failed to create orders" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...data } = await request.json()

        // Get current orders data for history
        const currentOrders = await prisma.orders.findUnique({
            where: { id },
            include: {
                marine: true,
                unit: true,
                assignments: true
            }
        })

        if (!currentOrders) {
            return NextResponse.json({ error: "Orders not found" }, { status: 404 })
        }

        // Update orders and create history in transaction
        const [updatedOrders] = await prisma.$transaction([
            prisma.orders.update({
                where: { id },
                data,
                include: {
                    marine: true,
                    unit: true,
                    assignments: {
                        include: {
                            marine: true,
                            unit: true,
                            bic: true
                        }
                    }
                }
            }),
            prisma.changeLog.create({
                data: {
                    modelName: 'Orders',
                    recordId: id,
                    changeType: 'UPDATE',
                    oldValue: JSON.stringify(currentOrders),
                    newValue: JSON.stringify({ ...currentOrders, ...data })
                }
            })
        ])

        return NextResponse.json(updatedOrders)
    } catch (error) {
        console.error("Error updating orders:", error)
        return NextResponse.json({ error: "Failed to update orders" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()

        // Get current orders data for history
        const currentOrders = await prisma.orders.findUnique({
            where: { id },
            include: {
                marine: true,
                unit: true,
                assignments: true
            }
        })

        if (!currentOrders) {
            return NextResponse.json({ error: "Orders not found" }, { status: 404 })
        }

        // Delete orders and create history in transaction
        await prisma.$transaction([
            // First update any assignments to remove the orders reference
            prisma.assignment.updateMany({
                where: { ordersId: id },
                data: { ordersId: null }
            }),
            // Then delete the orders
            prisma.orders.delete({
                where: { id }
            }),
            // Create change log entry
            prisma.changeLog.create({
                data: {
                    modelName: 'Orders',
                    recordId: id,
                    changeType: 'DELETE',
                    oldValue: JSON.stringify(currentOrders)
                }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting orders:", error)
        return NextResponse.json({ error: "Failed to delete orders" }, { status: 500 })
    }
}
