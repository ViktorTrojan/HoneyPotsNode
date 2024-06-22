import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import Config from '@/Config.js';
import * as schema from './Schema.js'

const config = {
    host: Config.db.MYSQL_HOST,
    user: Config.db.MYSQL_USER,
    password: Config.db.MYSQL_PASSWORD,
    database: Config.db.MYSQL_DB_NAME,
    port: Config.db.MYSQL_PORT ? parseInt(Config.db.MYSQL_PORT) : 3306,
};

export async function createConnection() {
    return await mysql.createConnection({
        ...config,
        multipleStatements: true,
    });
}

const connection = await createConnection();

// https://orm.drizzle.team/docs/rqb#modes "When using mysql2 driver with regular MySQL database — you should specify mode: "default""
export const DB = drizzle(connection, { schema, mode: 'default' });