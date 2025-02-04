import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const bics = [
    { bic: "M3060501253", description: "MFCC G9", payGrade: "W5" },
    { bic: "MS517100202", description: "DC I", payGrade: "W4" },
    { bic: "M3062500955", description: "JFHQ-C (Meade) - J-35", payGrade: "W4" },
    { bic: "M3062501100", description: "JFHQ-C (Meade) - CTOC (W&T)", payGrade: "W4" },
    { bic: "M2037100200", description: "I MIG", payGrade: "W3" },
    { bic: "M2036000200", description: "II MIG", payGrade: "W3" },
    { bic: "M2038100200", description: "III MIG", payGrade: "W3" },
    { bic: "M2157100245", description: "1 RadBn", payGrade: "W3" },
    { bic: "M2159100245", description: "2 RadBn", payGrade: "W3" },
    { bic: "M2154100230", description: "3 RadBn", payGrade: "W3" },
    { bic: "M3062501039", description: "JFHQ-C (Bragg)", payGrade: "W3" },
    { bic: "MS300001374", description: "DC CD&I", payGrade: "W3" },
    { bic: "M3061500833", description: "MCCYWG", payGrade: "W2" },
    { bic: "M3062500956", description: "JFHQ-C (Meade) - J-35", payGrade: "W2" },
    { bic: "M3062500977", description: "JFHQ-C (Meade) - J-35", payGrade: "W2" },
    { bic: "M3062501013", description: "JFHQ-C (Hawaii)", payGrade: "W2" },
    { bic: "M3062501101", description: "JFHQ-C (Meade) - CTOC (W&T)", payGrade: "W2" },
    { bic: "M3062501102", description: "JFHQ-C (Meade) - CTOC (W&T)", payGrade: "W2" },
    { bic: "M3062501108", description: "JFHQ-C (Meade) - CTOC (Capes)", payGrade: "W2" },
    { bic: "M3062501151", description: "JFHQ-C (Meade) -JTF SUPPORT", payGrade: "W2" },
    { bic: "M2006100104", description: "MCIC", payGrade: "W2" },
    { bic: "M3064100020", description: "CST - Dev OIC", payGrade: "W2" },
]

// Helper function to find the appropriate unit ID based on description
async function findUnitId(description) {
    // Map of keywords to MCCs
    const unitMappings = {
        MFCC: "1RA",
        "DC I": "QDC",
        JFHQ: "T12",
        CST: "TRY",
        MCCYWG: "TVZ",
        MIG: "QDC", // Assuming MIGs are under DC I
        RadBn: "QDC", // Assuming RadBns are under DC I
        MCIC: "QDC", // Assuming MCIC is under DC I
        "DC CD&I": "QDC", // DC CD&I is under DC I
    }

    // Find the first matching unit
    for (const [keyword, mcc] of Object.entries(unitMappings)) {
        if (description.includes(keyword)) {
            const unit = await prisma.unit.findUnique({
                where: { mcc },
            })
            if (unit) return unit.id
        }
    }

    // Default to first unit if no match found
    const firstUnit = await prisma.unit.findFirst()
    return firstUnit?.id
}

async function seedBICs() {
    console.log("Starting to seed BICs...")

    try {
        await prisma.$transaction(async (prisma) => {
            for (const bicData of bics) {
                const unitId = await findUnitId(bicData.description)

                if (!unitId) {
                    console.warn(`No unit found for BIC: ${bicData.bic}. Skipping.`)
                    continue
                }

                // Using upsert to avoid duplicate BICs
                await prisma.bIC.upsert({
                    where: { bic: bicData.bic },
                    update: {
                        description: bicData.description,
                        payGrade: bicData.payGrade,
                        unitId,
                    },
                    create: {
                        bic: bicData.bic,
                        description: bicData.description,
                        payGrade: bicData.payGrade,
                        unitId,
                    },
                })

                console.log(`Processed BIC: ${bicData.bic}`)
            }
        })

        console.log(`Successfully seeded ${bics.length} BICs`)
    } catch (error) {
        console.error("Error seeding BICs:", error)
    } finally {
        await prisma.$disconnect()
    }
}

// Execute the seeding
seedBICs().catch((error) => {
    console.error("Unhandled error during BIC seeding:", error)
    process.exit(1)
})

