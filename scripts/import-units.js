import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const units = [
    { mcc: "1RA", name: "MFCC", notes: "0" },
    { mcc: "NFH", name: "USCC", notes: "0" },
    { mcc: "QDC", name: "DC I", notes: "0" },
    { mcc: "T14", name: "IPE @ Dam Neck", notes: "0" },
    { mcc: "T12", name: "JFHQ", notes: "0" },
    { mcc: "TRF", name: "CPT 1", notes: "650" },
    { mcc: "TRG", name: "MCCOG", notes: "0" },
    { mcc: "TRH", name: "IPE @ SOCOM", notes: "0" },
    { mcc: "TRJ", name: "CPT 5", notes: "700" },
    { mcc: "TRK", name: "CPT 8", notes: "95" },
    { mcc: "TRM", name: "CMT 1", notes: "700" },
    { mcc: "TRN", name: "NMT 1", notes: "81" },
    { mcc: "TRP", name: "CMT 2", notes: "701" },
    { mcc: "TRQ", name: "CMT 3", notes: "702" },
    { mcc: "TRR", name: "CPT 2", notes: "81" },
    { mcc: "TRU", name: "CPT 3", notes: "651" },
    { mcc: "TRV", name: "MCCOB", notes: "0" },
    { mcc: "TRW", name: "CPT 7", notes: "652" },
    { mcc: "TRX", name: "CPT 4", notes: "83" },
    { mcc: "TRY", name: "CST 1", notes: "700" },
    { mcc: "TRZ", name: "IPE @ Bragg", notes: "0" },
    { mcc: "TVG", name: "CPT 6", notes: "701" },
    { mcc: "TVZ", name: "MCCyWG", notes: "0" }
]

async function seedUnits() {
    console.log('Starting to seed units...')

    try {
        // Create all units
        const createdUnits = await Promise.all(
            units.map(async (unit) => {
                // Using upsert to avoid duplicate MCCs
                return await prisma.unit.upsert({
                    where: { mcc: unit.mcc },
                    update: {
                        name: unit.name,
                        notes: unit.notes
                    },
                    create: {
                        mcc: unit.mcc,
                        name: unit.name,
                        notes: unit.notes
                    }
                })
            })
        )

        console.log(`Successfully seeded ${createdUnits.length} units:`)
        createdUnits.forEach(unit => {
            console.log(`- ${unit.mcc}: ${unit.name} (Notes: ${unit.notes})`)
        })
    } catch (error) {
        console.error('Error seeding units:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Execute the seeding
seedUnits()