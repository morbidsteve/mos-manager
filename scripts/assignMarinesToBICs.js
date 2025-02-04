const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function assignMarinesToBICs() {
    console.log('Assigning Marines to BICs...');

    const marines = await prisma.marine.findMany();
    const bics = await prisma.bIC.findMany({
        include: { unit: true },
    });

    for (const marine of marines) {
        try {
            // Find a BIC that matches the Marine's pay grade
            const eligibleBICs = bics.filter(bic => bic.payGrade === marine.payGrade);

            if (eligibleBICs.length === 0) {
                console.log(`No eligible BIC found for Marine ${marine.lastName} (ID: ${marine.id})`);
                continue;
            }

            const selectedBIC = faker.helpers.arrayElement(eligibleBICs);

            const dctb = faker.date.past({ years: 2 });
            const tourLength = faker.number.int({ min: 24, max: 48 });
            const plannedEndDate = new Date(dctb);
            plannedEndDate.setMonth(plannedEndDate.getMonth() + tourLength);

            const assignment = await prisma.assignment.create({
                data: {
                    marineId: marine.id,
                    unitId: selectedBIC.unit.id,
                    bicId: selectedBIC.id,
                    dctb: dctb,
                    djcu: dctb, // Assuming DJCU is the same as DCTB for simplicity
                    ocd: faker.date.future({ years: 2, refDate: dctb }),
                    tourLength: tourLength,
                    plannedEndDate: plannedEndDate,
                },
            });

            console.log(`Assigned Marine ${marine.lastName} (ID: ${marine.id}) to BIC ${selectedBIC.bic} (ID: ${selectedBIC.id}) in Unit ${selectedBIC.unit.name}`);

            // Update the Marine's information
            await prisma.marine.update({
                where: { id: marine.id },
                data: {
                    dctb: dctb,
                    djcu: dctb,
                    tourLength: tourLength,
                },
            });

        } catch (error) {
            console.error(`Error assigning Marine ${marine.lastName} (ID: ${marine.id}):`, error);
        }
    }

    console.log('Finished assigning Marines to BICs.');
}

assignMarinesToBICs()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });