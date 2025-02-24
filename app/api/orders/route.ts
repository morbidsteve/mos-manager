import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function generateOrderNumber() {
    const prefix = "PCS"
    const number = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")
    const year = new Date().getFullYear().toString().slice(-2)
    return `${prefix}${number}/${year}`
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log("Creating orders with body:", body)

        // Extract assignmentId from body and remove it from the data we'll send to Prisma
        const { assignmentId, ...orderData } = body

        const orders = await prisma.orders.create({
            data: {
                ...orderData,
                orderNumber: generateOrderNumber(),
                issuedDate: new Date(),
                reportNoLaterThan: new Date(orderData.reportNoLaterThan),
                detachNoEarlierThan: orderData.detachNoEarlierThan ? new Date(orderData.detachNoEarlierThan) : null,
                detachNoLaterThan: new Date(orderData.detachNoLaterThan),
                proceedDate: new Date(orderData.proceedDate),
                tdyStartDate: orderData.tdyStartDate ? new Date(orderData.tdyStartDate) : null,
                tdyEndDate: orderData.tdyEndDate ? new Date(orderData.tdyEndDate) : null,
                travelDays: orderData.travelDays || 4,
                // Connect the order to the assignment using the assignments relation
                assignments: {
                    connect: {
                        id: assignmentId,
                    },
                },
            },
            include: {
                marine: true,
                unit: true,
                assignments: {
                    include: {
                        marine: true,
                        unit: true,
                        bic: true,
                    },
                },
            },
        })

        console.log("Created orders:", orders)
        return NextResponse.json(orders)
    } catch (error) {
        console.error("Error creating orders:", error)
        return NextResponse.json(
            {
                error: "Failed to create orders",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        )
    }
}

export async function GET() {
    try {
        const orders = await prisma.orders.findMany({
            include: {
                marine: true,
                unit: true,
                assignments: true,
            },
        })
        return NextResponse.json(orders)
    } catch (error) {
        console.error("Error fetching orders:", error)
        return NextResponse.json({ error: "Error fetching orders" }, { status: 400 })
    }
}

