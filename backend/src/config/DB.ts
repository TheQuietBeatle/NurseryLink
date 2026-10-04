import "dotenv/config";
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if(!connectionString) {
    throw new Error("DATABASE_URL is not set in the environment");
}

export const pool = new Pool({
    connectionString,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

module.exports = pool;
