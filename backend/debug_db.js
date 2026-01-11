const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./config/database');

async function checkIndexes() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const [results, metadata] = await sequelize.query("SHOW INDEX FROM Roles");
        console.log('Indexes on Roles table:', results.length);
        console.log(results.map(r => r.Key_name));

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

checkIndexes();
