import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:5432/postgres';

export const pool = new Pool({
    user:"postgres",
    password:"123456789",
    host:"localhost",
    port:5432,
    database:"nurserylinkDB",
   
    
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = pool;