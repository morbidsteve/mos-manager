import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query",
        },
        {
            emit: "stdout",
            level: "error",
        },
        {
            emit: "stdout",
            level: "info",
        },
        {
            emit: "stdout",
            level: "warn",
        },
    ],
})

// Log all queries
prisma.$on("query", (e) => {
    console.log("Query: " + e.query)
    console.log("Params: " + e.params)
    console.log("Duration: " + e.duration + "ms")
    console.log("-------------------")
})

async function inspectDatabase() {
    try {
        // Get all table names from the database
        const tables = await prisma.$queryRaw`
      SELECT tablename as table_name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

        console.log("\n=== DATABASE STRUCTURE AND CONTENTS ===\n")

        // Inspect each table
        for (const tableObj of tables) {
            const tableName = tableObj.table_name

            console.log(`\n=== TABLE: ${tableName} ===`)

            // Get table structure
            const columns = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `

            console.log("\nCOLUMN STRUCTURE:")
            console.table(columns)

            // Get row count and data using dynamic SQL to handle table names properly
            try {
                const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`)
                const count = result[0].count
                console.log(`\nROW COUNT: ${count}`)

                if (count > 0) {
                    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}" LIMIT 100;`)
                    console.log("\nTABLE CONTENTS (up to 100 rows):")
                    console.table(rows)
                }
            } catch (error) {
                console.error(`Error querying table ${tableName}:`, error)
            }
        }

        // Get foreign key relationships
        console.log("\n=== FOREIGN KEY RELATIONSHIPS ===\n")

        const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `

        console.table(foreignKeys)

        // Get indexes
        console.log("\n=== INDEXES ===\n")

        const indexes = await prisma.$queryRaw`
      SELECT
        tablename as table_name,
        indexname as index_name,
        indexdef as index_definition
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `

        console.table(indexes)
    } catch (error) {
        console.error("Error inspecting database:", error)
    } finally {
        await prisma.$disconnect()
    }
}

inspectDatabase()

