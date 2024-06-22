import * as schema from './Schema.js'
import { drizzle } from 'drizzle-orm/mysql2';
import { DB } from './DB.js';
import Logger from '@/util/Logger.js';
import Config from '@/Config.js';

async function clearTables() {
    if (Config.app.is_production) return; // dont delete table data in production for safety reasons
    Logger.log(`[*] Clearing Table Data`);

    // await DB.delete(schema.tbName);
}

async function seedTables() {
    
}

async function main() {
    try {
        Logger.log(`[*] Seeding Database`);

        await clearTables();
        await seedTables();

        Logger.log(`[+] DB Seeding Successful`);
    } catch (err) {
        Logger.log(`[-] DB Seeding Failed!: ${err}`, 'error');
        process.exit(1);
    } finally {

    }
}

main();