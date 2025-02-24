import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const pmos = searchParams.get("pmos")
        const unitId = searchParams.get("unitId") || "1"

        console.log("Received GET request:", { pmos, unitId })

        if (!pmos) {
            console.error("Missing PMOS parameter")
            return NextResponse.json({ error: "Missing PMOS parameter" }, { status: 400 })
        }

        // Get existing authorized strength
        const strength = await prisma.authorizedStrength.findMany({
            where: {
                pmos,
                unitId: Number(unitId),
            },
        })
        console.log("Found records:", strength)

        // If no records exist, return default values
        if (!strength || strength.length === 0) {
            console.log("No records found, returning defaults")
            const defaultStrength = {
                W5: 1,
                W4: 1,
                W3: 1,
                W2: 1,
                W1: 1,
            }
            return NextResponse.json(defaultStrength)
        }

        // Convert array of records to an object
        const strengthByGrade = strength.reduce(
            (acc, curr) => {
                acc[curr.payGrade] = curr.authorized
                return acc
            },
            {} as Record<string, number>,
        )
        console.log("Returning strength by grade:", strengthByGrade)

        return NextResponse.json(strengthByGrade)
    } catch (error) {
        console.error("Error fetching authorized strength:", error)
        return NextResponse.json(
            {
                error: "Failed to fetch authorized strength",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        )
    }
}

export async function POST(request: Request) {
    try {
        const { pmos, strength, unitId = 1 } = await request.json()

        console.log("Received POST request:", { pmos, strength, unitId })

        if (!pmos || !strength) {
            console.error("Missing required fields:", { pmos, strength })
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // First, ensure the Unit exists
        let unit = await prisma.unit.findUnique({
            where: { id: unitId },
        })

        // If unit doesn't exist, create it with a default name
        if (!unit) {
            console.log("Unit not found, creating default unit")
            unit = await prisma.unit.create({
                data: {
                    id: unitId,
                    mcc: "DEF1",
                    name: "Default Unit",
                },
            })
            console.log("Created default unit:", unit)
        }

        // Now proceed with authorized strength updates
        await prisma.$transaction(async (tx) => {
            // Delete existing entries
            const deleteResult = await tx.authorizedStrength.deleteMany({
                where: {
                    pmos,
                    unitId,
                },
            })
            console.log("Deleted records:", deleteResult)

            // Create new entries
            const createPromises = Object.entries(strength).map(([payGrade, authorized]) => {
                console.log("Creating record:", { payGrade, authorized, pmos, unitId })
                return tx.authorizedStrength.create({
                    data: {
                        payGrade,
                        pmos,
                        authorized: Number(authorized),
                        unitId,
                    },
                })
            })

            const results = await Promise.all(createPromises)
            console.log("Created new records:", results)

            // Verify the newly created records
            const verificationRecords = await tx.authorizedStrength.findMany({
                where: {
                    pmos,
                    unitId,
                },
            })
            console.log("Verification of new records:", verificationRecords)

            return results
        })

        // Fetch and return the updated records
        const updatedRecords = await prisma.authorizedStrength.findMany({
            where: {
                pmos,
                unitId,
            },
        })

        return NextResponse.json({
            success: true,
            data: updatedRecords,
        })
    } catch (error) {
        console.error("Error updating authorized strength:", error)
        return NextResponse.json(
            {
                error: "Failed to update authorized strength",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        )
    }
}

