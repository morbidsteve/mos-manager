import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
  ],
})

// Log all queries
prisma.$on("query", (e) => {
  console.log("Query: " + e.query)
  console.log("Params: " + e.params)
  console.log("Duration: " + e.duration + "ms")
  console.log("-------------------")
})

export async function GET() {
  try {
    const marines = await prisma.marine.findMany({
      include: {
        assignments: {
          include: {
            unit: true,
            bic: true,
            orders: true,
          },
          orderBy: {
            dctb: "desc",
          },
        },
        orders: {
          orderBy: {
            issuedDate: "desc",
          },
        },
        marineHistory: {
          orderBy: {
            changedAt: "desc",
          },
          take: 10, // Get last 10 changes
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })
    return NextResponse.json(marines)
  } catch (error) {
    console.error("Error fetching marines:", error)
    return NextResponse.json({ error: "Failed to fetch marines" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("Received marine data:", data)

    // Validate required fields
    const requiredFields = ["edipi", "lastName", "firstName", "payGrade", "pmos", "dor", "afadbd"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const marine = await prisma.marine.create({
      data,
      include: {
        assignments: {
          include: {
            unit: true,
            bic: true,
          },
        },
      },
    })

    // Create history entry
    await prisma.marineHistory.create({
      data: {
        marineId: marine.id,
        fieldName: "CREATE",
        newValue: JSON.stringify(marine),
      },
    })

    return NextResponse.json(marine)
  } catch (error) {
    console.error("Error creating marine:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "EDIPI already exists" }, { status: 400 })
    }
    return NextResponse.json(
        {
          error: "Failed to create marine",
          details: error.message,
        },
        { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()

    // Convert date strings to Date objects
    const dateFields = ["dateOfBirth", "dor", "afadbd", "dctb", "djcu", "ocd", "sedd"]
    dateFields.forEach((field) => {
      if (data[field]) {
        data[field] = new Date(data[field])
      }
    })

    // Get current marine data for history
    const currentMarine = await prisma.marine.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            unit: true,
            bic: true,
          },
        },
      },
    })

    if (!currentMarine) {
      return NextResponse.json({ error: "Marine not found" }, { status: 404 })
    }

    // Update marine and create history entries in a transaction
    const [updatedMarine] = await prisma.$transaction([
      prisma.marine.update({
        where: { id },
        data,
        include: {
          assignments: {
            include: {
              unit: true,
              bic: true,
            },
          },
        },
      }),
      ...Object.keys(data).map((field) =>
          prisma.marineHistory.create({
            data: {
              marineId: id,
              fieldName: field,
              oldValue: String(currentMarine[field]),
              newValue: String(data[field]),
            },
          }),
      ),
    ])

    return NextResponse.json(updatedMarine)
  } catch (error) {
    console.error("Error updating marine:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "EDIPI already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update marine" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    await prisma.$transaction(async (prisma) => {
      // Delete related records first
      await prisma.marineHistory.deleteMany({
        where: { marineId: id },
      })

      await prisma.assignment.deleteMany({
        where: { marineId: id },
      })

      await prisma.orders.deleteMany({
        where: { marineId: id },
      })

      // Finally delete the marine
      await prisma.marine.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting marine:", error)
    return NextResponse.json({ error: "Failed to delete marine" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

