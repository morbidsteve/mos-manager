const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function generatePromotionEvents() {
    console.log('Generating Promotion Events...');

    const events = [
        'Selection Board',
        'Promotion Ceremony',
        'Application Deadline',
        'Results Announcement',
    ];

    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 10; i++) {
        const year = currentYear + Math.floor(i / 2);
        const fy = `FY${year}`;

        try {
            const event = await prisma.promotionEvent.create({
                data: {
                    event: faker.helpers.arrayElement(events),
                    roughDate: faker.date.future({ years: 3 }).toISOString().split('T')[0],
                    method: faker.helpers.arrayElement(['Board', 'TIG/TIS', 'Meritorious']),
                    opr: faker.helpers.arrayElement(['MMPR', 'MMOA', 'Unit CO']),
                    fy: fy,
                    callingMaradmin: faker.string.alphanumeric(8).toUpperCase(),
                    callingReleaseDate: faker.date.recent({ days: 30 }),
                    packageDue: faker.date.soon({ days: 90 }),
                    julianDate: faker.string.numeric(3),
                    daysToComplete: faker.number.int({ min: 30, max: 180 }),
                    boardConvene: faker.date.soon({ days: 180 }),
                    selectionMaradmin: faker.string.alphanumeric(8).toUpperCase(),
                    selectionMsgDate: faker.date.soon({ days: 270 }),
                    pkgToResults: faker.number.int({ min: 90, max: 270 }),
                    notes: faker.lorem.sentence(),
                },
            });

            console.log(`Created Promotion Event: ${event.event} (ID: ${event.id}) for ${event.fy}`);
        } catch (error) {
            console.error(`Error creating Promotion Event:`, error);
        }
    }

    console.log('Finished generating Promotion Events.');
}

generatePromotionEvents()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });