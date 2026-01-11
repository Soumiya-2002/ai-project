const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const createDatabase = async () => {
    try {
        // Connect to MySQL server (without specifying database)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        const dbName = process.env.DB_NAME;

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' created or already exists.`);

        await connection.end();
        process.exit();
    } catch (error) {
        console.error('Error creating database:', error);
        process.exit(1);
    }
};

createDatabase();
