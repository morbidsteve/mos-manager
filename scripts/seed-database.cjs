const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker')

const prisma = new PrismaClient({
    log: ["info", "warn", "error"],
})

// Generate random MCC (3 characters, alphanumeric)
function generateMCC() {
    return faker.string.alphanumeric({ length: 3, casing: "upper" })
}

// Generate random BIC following military format (10 characters)
function generateBIC() {
    const prefix = faker.helpers.arrayElement(["M", "N"]) // M for Marine Corps, N for Navy
    const category = faker.string.numeric(1)
    const subcategory = faker.string.numeric(3)
    const sequence = faker.string.numeric(5)
    return `${prefix}${category}${subcategory}${sequence}`
}

// Generate random unit name components
const unitPrefixes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
const unitTypes = ["Battalion", "Regiment", "Division", "Group", "Squadron", "Wing"]
const unitSpecialties = ["Marine", "Intelligence", "Communications", "Support", "Logistics", "Operations"]

// Generate a random military unit name
function generateUnitName() {
    const prefix = faker.helpers.arrayElement(unitPrefixes)
    const type = faker.helpers.arrayElement(unitTypes)
    const specialty = faker.helpers.arrayElement(unitSpecialties)
    return `${prefix} ${specialty} ${type}`
}

// Military Constants
const PAY_GRADES = ["W1", "W2", "W3", "W4", "W5"]
const PMOS_LIST = ["1710", "0210", "0211", "0619", "0689", "2611", "2621", "2629", "2631", "2641", "2691"]
const CLEARANCE_LEVELS = ["Secret", "Top Secret", "TS/SCI"]
const POLY_TYPES = ["CI", "Full Scope", "None"]
const ORDER_TYPES = ["PCS", "PCA", "TEMINS", "TAD"]
const ORDER_STATUS = ["DRAFTED", "ISSUED", "EXECUTED", "CANCELLED"]
const SCHOOLS = ["MCIS", "JCAC", "DCO", "CCNA", "SEC+", "CEH", "CISSP", null]
const LOCATIONS = [
    "Camp Pendleton, CA",
    "Camp Lejeune, NC",
    "MCAS Miramar, CA",
    "Quantico, VA",
    "Fort Meade, MD",
    "Fort Gordon, GA",
    "Pearl Harbor, HI",
    "Okinawa, Japan",
    "Stuttgart, Germany",
]

// Helper Functions
function generateEDIPI() {
    return faker.string.numeric(10)
}

function generateBirthDate() {
    return faker.date.between({
        from: new Date(1970, 0, 1),
        to: new Date(2000, 11, 31),
    })
}

function generateDOR(birthDate) {
    return faker.date.between({
        from: new Date(birthDate.getFullYear() + 18, birthDate.getMonth(), birthDate.getDate()),
        to: new Date(),
    })
}

function generateAFADBD(birthDate) {
    return faker.date.between({
        from: new Date(birthDate.getFullYear() + 17, birthDate.getMonth(), birthDate.getDate()),
        to: new Date(),
    })
}

function generateOrderNumber() {
    const type = faker.helpers.arrayElement(ORDER_TYPES)
    const number = faker.string.numeric(6)
    const year = faker.string.numeric(2)
    return `${type}${number}/${year}`
}

async function seedDatabase() {
    console.log("Starting database seeding...")

    try {
        // Clear existing data
        await prisma.$transaction([
            prisma.marineHistory.deleteMany(),
            prisma.assignmentHistory.deleteMany(),
            prisma.changeLog.deleteMany(),
            prisma.assignment.deleteMany(),
            prisma.orders.deleteMany(),
            prisma.bIC.deleteMany(),
            prisma.marine.deleteMany(),
            prisma.unit.deleteMany(),
        ])

        console.log("Database cleared. Starting seeding...")

        // Create Random Units (20 units)
        const units = await Promise.all(
            Array(20)
                .fill(null)
                .map(() =>
                    prisma.unit.create({
                        data: {
                            mcc: generateMCC(),
                            name: generateUnitName(),
                            notes: faker.lorem.sentence(),
                        },
                    }),
                ),
        )
        console.log(`Created ${units.length} units`)

        // Create BICs - ensure each unit has at least 2 BICs
        const bics = []
        for (const unit of units) {
            // Create 2-4 BICs per unit
            const numBics = faker.number.int({ min: 2, max: 4 })
            for (let i = 0; i < numBics; i++) {
                const bic = await prisma.bIC.create({
                    data: {
                        bic: generateBIC(),
                        description: faker.lorem.words(3),
                        payGrade: faker.helpers.arrayElement(PAY_GRADES),
                        unitId: unit.id,
                    },
                })
                bics.push(bic)
            }
        }
        console.log(`Created ${bics.length} BICs`)

        // Create Marines (100 Marines)
        const marines = []
        for (let i = 0; i < 100; i++) {
            const birthDate = generateBirthDate()
            const dor = generateDOR(birthDate)
            const afadbd = generateAFADBD(birthDate)

            const marine = await prisma.marine.create({
                data: {
                    edipi: generateEDIPI(),
                    lastName: faker.person.lastName(),
                    firstName: faker.person.firstName(),
                    middleInitial: faker.string.alpha({ length: 1 }).toUpperCase(),
                    payGrade: faker.helpers.arrayElement(PAY_GRADES),
                    pmos: faker.helpers.arrayElement(PMOS_LIST),
                    dateOfBirth: birthDate,
                    dor: dor,
                    afadbd: afadbd,
                    trained: faker.datatype.boolean(),
                    cmf: faker.helpers.arrayElement(["Yes", "No", null]),
                    projectedSchoolhouse: faker.helpers.arrayElement(SCHOOLS),
                    clearance: faker.helpers.arrayElement(CLEARANCE_LEVELS),
                    poly: faker.helpers.arrayElement(POLY_TYPES),
                    tourLength: faker.helpers.arrayElement([24, 36, 48]),
                    linealNumber: faker.number.int({ min: 1, max: 10000 }),
                    ldoFy: faker.date.future().getFullYear(),
                },
            })
            marines.push(marine)

            // Create Marine History
            await prisma.marineHistory.create({
                data: {
                    marineId: marine.id,
                    fieldName: 'CREATE',
                    newValue: JSON.stringify(marine),
                    changedAt: faker.date.recent()
                }
            })
        }
        console.log(`Created ${marines.length} marines with history`)

        // Create Multiple Orders and Assignments per Marine
        for (const marine of marines) {
            // Generate 1-3 assignments per Marine
            const numAssignments = faker.number.int({ min: 1, max: 3 })

            for (let i = 0; i < numAssignments; i++) {
                const unit = faker.helpers.arrayElement(units)
                // Get BICs for this unit - we know each unit has at least 2 BICs
                const unitBics = bics.filter(b => b.unitId === unit.id)
                const bic = faker.helpers.arrayElement(unitBics)

                const orderDate = faker.date.past()
                const reportDate = faker.date.between({
                    from: orderDate,
                    to: faker.date.future({ years: 1, refDate: orderDate }),
                })

                const orders = await prisma.orders.create({
                    data: {
                        orderNumber: generateOrderNumber(),
                        marineId: marine.id,
                        unitId: unit.id,
                        type: faker.helpers.arrayElement(ORDER_TYPES),
                        status: faker.helpers.arrayElement(ORDER_STATUS),
                        issuedDate: orderDate,
                        reportNoLaterThan: reportDate,
                        detachNoEarlierThan: faker.date.soon({ days: 30, refDate: orderDate }),
                        detachNoLaterThan: faker.date.soon({ days: 60, refDate: orderDate }),
                        proceedDate: faker.date.soon({ days: 45, refDate: orderDate }),
                        travelDays: faker.number.int({ min: 1, max: 30 }),
                        temporaryDutyEnRoute: faker.datatype.boolean(),
                        tdyLocation: faker.helpers.arrayElement(LOCATIONS),
                        tdyStartDate: faker.date.soon({ days: 30, refDate: orderDate }),
                        tdyEndDate: faker.date.soon({ days: 60, refDate: orderDate }),
                        dependentsAuthorized: faker.datatype.boolean(),
                        povShipmentAuthorized: faker.datatype.boolean(),
                        householdGoodsAuthorized: faker.datatype.boolean(),
                        remarks: faker.lorem.paragraph(),
                    },
                })

                const assignment = await prisma.assignment.create({
                    data: {
                        marineId: marine.id,
                        unitId: unit.id,
                        bicId: bic.id,
                        ordersId: orders.id,
                        dctb: reportDate,
                        djcu: reportDate,
                        ocd: faker.date.future({ years: 2, refDate: reportDate }),
                        tourLength: marine.tourLength || 24,
                        plannedEndDate: faker.date.future({ years: 3, refDate: reportDate }),
                    },
                })

                // Create Assignment History with multiple entries
                const numHistoryEntries = faker.number.int({ min: 1, max: 5 })
                for (let j = 0; j < numHistoryEntries; j++) {
                    await prisma.assignmentHistory.create({
                        data: {
                            assignmentId: assignment.id,
                            changeType: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'MODIFY']),
                            newValue: JSON.stringify({
                                ...assignment,
                                modifiedField: faker.lorem.words(2),
                                previousValue: faker.lorem.word(),
                                newValue: faker.lorem.word()
                            }),
                            changedAt: faker.date.recent({ days: 90 })
                        }
                    })
                }

                // Create Change Log entries
                await prisma.changeLog.create({
                    data: {
                        modelName: 'Assignment',
                        recordId: assignment.id,
                        changeType: 'CREATE',
                        newValue: JSON.stringify(assignment),
                        changedAt: faker.date.recent()
                    }
                })
            }
        }
        console.log("Created orders and assignments with history")

        console.log("Database seeding completed successfully!")
    } catch (error) {
        console.error("Error seeding database:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Execute seeding
seedDatabase().catch(console.error)

