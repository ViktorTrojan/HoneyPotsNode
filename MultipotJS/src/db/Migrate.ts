import Logger from '@/util/Logger.js';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { DB } from './DB.js';

async function main() {
    try {
        Logger.log(`[*] Trying to migrate Database`);

        await migrate(DB, { migrationsFolder: "src/db/migrations", });

        Logger.log(`[+] DB Migration Successful`);
    } catch (err) {
        Logger.log(`[-] DB Migration Failed!: ${err}`, 'error');
        process.exit(1);
    } finally {

    }
}

main();