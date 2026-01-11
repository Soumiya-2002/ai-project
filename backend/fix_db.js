const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./config/database');

async function dropDuplicateIndexes(tableName) {
    try {
        const [results, metadata] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);

        // Drop all indexes except PRIMARY and FOREIGN KEYS (usually imply specific naming, but here we focus on the problem ones)
        // The problem ones are 'email', 'email_2', 'name', 'name_2' etc.
        // We should keep foreign key indexes if they are named specifically (e.g. 'role_id'), but 'unique' constraints often create names like column_name.

        // For safety, let's just drop everything that isn't PRIMARY. 
        // Sequelize sync({alter:true}) will just recreate the necessary ones (foreign keys and unique constraints).
        // The issue is that it *failed* to drop old ones or reused them weirdly.

        const indexesToDrop = results
            .filter(row => row.Key_name !== 'PRIMARY')
            .map(row => row.Key_name);

        const uniqueIndexesToDrop = [...new Set(indexesToDrop)];

        console.log(`[${tableName}] Found ${uniqueIndexesToDrop.length} indexes to drop.`);

        for (const indexName of uniqueIndexesToDrop) {
            console.log(`[${tableName}] Dropping index: ${indexName}`);
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON ${tableName}`);
            } catch (err) {
                console.error(`[${tableName}] Failed to drop index ${indexName}:`, err.message);
            }
        }
    } catch (error) {
        console.error(`[${tableName}] Error checking indexes:`, error.message);
    }
}

async function fixAllTables() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Clean up Roles and Users, as these are known to have UNIQUE constraints causing issues
        await dropDuplicateIndexes('Roles');
        await dropDuplicateIndexes('Users');

        console.log('All cleanup complete.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

fixAllTables();
