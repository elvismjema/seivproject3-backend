import 'dotenv/config';

console.log('=== Environment Variables Debug ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PW:', process.env.DB_PW);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('===================================');

import dbConfig from './app/config/db.config.js';
console.log('Sequelize config:', JSON.stringify(dbConfig, null, 2));