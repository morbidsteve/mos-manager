import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const assignments = await prisma.assignment.findMany({
            include: {
                marine: true,
                unit: true,
                bic: true,
            },
        })
        return NextResponse.json(assignments)
    } catch (error) {
        console.error("Error fetching Assignments:", error)
        return NextResponse.json({ error: "Error fetching Assignments" }, { status: 400 })
    }
}

export async function POST(request: NextRequest) {
    console.log("POST request received")
    try {
        const body = await request.json()
        console.log("Request body:", body)

        if (!body || typeof body !== "object") {
            console.error("Invalid request body")
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
        }

        const { marineId, unitId, bicId, dctb, djcu, ocd, plannedEndDate, tourLength } = body

        if (!marineId || !unitId || !bicId || !dctb || !djcu || !plannedEndDate || !tourLength) {
            console.error("Missing required fields")
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        console.log("Creating assignment")
        const assignment = await prisma.$transaction(async (prisma) => {
            const newAssignment = await prisma.assignment.create({
                data: {
                    marineId: Number(marineId),
                    unitId: Number(unitId),
                    bicId: Number(bicId),
                    dctb: new Date(dctb),
                    djcu: new Date(djcu),
                    ocd: ocd ? new Date(ocd) : undefined,
                    plannedEndDate: new Date(plannedEndDate),
                    tourLength: Number(tourLength),
                },
                include: {
                    marine: true,
                    unit: true,
                    bic: true,
                },
            })

            await prisma.assignmentHistory.create({
                data: {
                    assignmentId: newAssignment.id,
                    changeType: "CREATE",
                    newValue: JSON.stringify(newAssignment),
                },
            })

            await prisma.changeLog.create({
                data: {
                    modelName: "Assignment",
                    recordId: newAssignment.id,
                    changeType: "CREATE",
                    newValue: JSON.stringify(newAssignment),
                },
            })

            return newAssignment
        })

        console.log("Assignment created:", assignment)
        console.log("Returning successful response")
        return NextResponse.json(assignment, { status: 201 })
    } catch (error) {
        console.error("Error creating Assignment:", error)
        if (error instanceof Error) {
            return NextResponse.json({ error: "Error creating Assignment: " + error.message }, { status: 500 })
        } else {
            return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 })
        }
    }
}

