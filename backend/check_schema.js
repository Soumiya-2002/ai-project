const { sequelize } = require('./models');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        const [results, metadata] = await sequelize.query("DESCRIBE Lectures;");
        console.log("Lectures Table Columns:", results.map(c => c.Field));
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

checkSchema();
