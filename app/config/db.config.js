import 'dotenv/config';

const db_host = process.env.DB_HOST;
const db_port = process.env.DB_PORT;
const db_pw = process.env.DB_PW;
const db_user = process.env.DB_USER;
const db_name = process.env.DB_NAME;

const dbConfig = {
  HOST: db_host,
  PORT: db_port,
  USER: db_user,
  PASSWORD: db_pw,
  DB: db_name,
  dialect: "mysql",
  dialectOptions: {
    socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000, 
    idle: 10000,
  },
};

export default dbConfig;
