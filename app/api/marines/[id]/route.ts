import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params
  const marineId = Number(id)

  if (isNaN(marineId)) {
    return NextResponse.json({ error: "Invalid Marine ID" }, { status: 400 })
  }

  try {
    const marine = await prisma.marine.findUnique({
      where: { id: marineId },
    })
    if (marine) {
      return NextResponse.json(marine)
    } else {
      return NextResponse.json({ error: "Marine not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching Marine:", error)
    return NextResponse.json({ error: "Error fetching Marine" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params
  const marineId = Number(id)

  if (isNaN(marineId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (prisma) => {
      // 1. First, get all assignments for this marine
      const assignments = await prisma.assignment.findMany({
        where: { marineId },
        select: { id: true },
      })

      // 2. Delete all assignment history records for these assignments
      await prisma.assignmentHistory.deleteMany({
        where: {
          assignmentId: {
            in: assignments.map((a) => a.id),
          },
        },
      })

      // 3. Delete all marine history records
      await prisma.marineHistory.deleteMany({
        where: { marineId },
      })

      // 4. Delete all orders for this marine
      await prisma.orders.deleteMany({
        where: { marineId },
      })

      // 5. Delete all assignments
      await prisma.assignment.deleteMany({
        where: { marineId },
      })

      // 6. Finally, delete the marine
      await prisma.marine.delete({
        where: { id: marineId },
      })
    })

    return NextResponse.json({ message: "Marine and related records deleted successfully" })
  } catch (error) {
    console.error("Error deleting Marine:", error)
    return NextResponse.json({ error: "Error deleting Marine and related records" }, { status: 400 })
  }
}

// Update the PUT route to strictly handle only changed fields
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Invalid marine ID" }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Remove id and any undefined/null values from update data
    const { id: _, ...rawUpdateData } = body
    const updateData = Object.entries(rawUpdateData).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>,
    )

    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" })
    }

    // Validate that the marine exists before updating
    const existingMarine = await prisma.marine.findUnique({
      where: { id: Number(id) },
    })

    if (!existingMarine) {
      return NextResponse.json({ error: "Marine not found" }, { status: 404 })
    }

    // Update the marine with only the explicitly changed fields
    const updatedMarine = await prisma.$transaction(async (prisma) => {
      // Get current marine data for history
      const currentMarine = await prisma.marine.findUnique({
        where: { id: Number(id) },
      })

      if (!currentMarine) {
        throw new Error("Marine not found")
      }

      // Only update fields that are different from current values
      const finalUpdateData = Object.entries(updateData).reduce(
          (acc, [key, value]) => {
            // Special handling for date fields
            if (
                key === "dateOfBirth" ||
                key === "dor" ||
                key === "afadbd" ||
                key === "dctb" ||
                key === "djcu" ||
                key === "ocd" ||
                key === "sedd"
            ) {
              const currentDate = currentMarine[key as keyof typeof currentMarine]
              const newDate = value ? new Date(value) : null

              // Only include if dates are actually different
              if (currentDate?.toISOString() !== newDate?.toISOString()) {
                acc[key] = value
              }
            }
            // For non-date fields, use direct comparison
            else if (currentMarine[key as keyof typeof currentMarine] !== value) {
              acc[key] = value
            }
            return acc
          },
          {} as Record<string, any>,
      )

      // If no fields actually changed, return current marine
      if (Object.keys(finalUpdateData).length === 0) {
        return currentMarine
      }

      // Update only the fields that actually changed
      const updated = await prisma.marine.update({
        where: { id: Number(id) },
        data: finalUpdateData,
      })

      // Create history entries only for fields that were actually updated
      await Promise.all(
          Object.entries(finalUpdateData).map(([key, value]) =>
              prisma.marineHistory.create({
                data: {
                  marineId: Number(id),
                  fieldName: key,
                  oldValue: JSON.stringify(currentMarine[key as keyof typeof currentMarine]),
                  newValue: JSON.stringify(value),
                },
              }),
          ),
      )

      return updated
    })

    return NextResponse.json(updatedMarine)
  } catch (error) {
    console.error("Error updating marine:", error)
    return NextResponse.json(
        {
          error: "Failed to update marine",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
    )
  }
}

