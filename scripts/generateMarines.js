const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

const payGrades = ['W1', 'W2', 'W3', 'W4', 'W5'];
const pmosList = ['0102', '0202', '0302', '0402', '0602', '1302', '1802', '3002', '3404', '4402', '5803', '7562', '7565'];

function generateRandomMarine(payGrade) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const middleInitial = faker.person.middleName().charAt(0);

    return {
        edipi: faker.string.numeric(10),
        lastName,
        firstName,
        middleInitial,
        payGrade,
        pmos: faker.helpers.arrayElement(pmosList),
        dateOfBirth: faker.date.past({ years: 40, refDate: new Date(1990, 0, 1) }),
        dor: faker.date.past({ years: 10 }),
        afadbd: faker.date.past({ years: 20 }),
        trained: true,
        cmf: faker.helpers.arrayElement(['Yes', 'No']),
        projectedSchoolhouse: faker.helpers.arrayElement(['TBS', 'IOC', 'AITB', null]),
        dctb: faker.date.recent({ days: 365 }),
        djcu: faker.date.recent({ days: 365 }),
        ocd: faker.date.future({ years: 2 }),
        sedd: faker.date.future({ years: 5 }),
        clearance: faker.helpers.arrayElement(['Secret', 'Top Secret', 'TS/SCI']),
        poly: faker.helpers.arrayElement(['CI', 'Full Scope', null]),
        tourLength: faker.number.int({ min: 24, max: 48 }),
        linealNumber: faker.number.int({ min: 1, max: 10000 }),
        ldoFy: faker.date.future({ years: 5 }).getFullYear(),
    };
}

async function generateMarines() {
    console.log('Generating 25 Marines...');

    for (let i = 0; i < 25; i++) {
        const payGrade = payGrades[Math.floor(i / 5)]; // Distribute ranks evenly
        const marineData = generateRandomMarine(payGrade);

        try {
            const marine = await prisma.marine.create({
                data: marineData,
            });
            console.log(`Created Marine: ${marine.lastName}, ${marine.firstName} (ID: ${marine.id}, Rank: ${marine.payGrade})`);
        } catch (error) {
            console.error(`Error creating Marine:`, error);
        }
    }

    console.log('Finished generating Marines.');
}

generateMarines()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });