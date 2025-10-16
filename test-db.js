import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Password:', process.env.DB_PW ? 'SET' : 'EMPTY');
    console.log('Database:', process.env.DB_NAME);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PW,
      database: process.env.DB_NAME,
      socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock'
    });
    
    console.log('✅ Database connection successful!');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();