import { sql } from "drizzle-orm";
import { boolean, datetime, int, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";

export const attacker = mysqlTable("attacker", {
    id: int("id").primaryKey().autoincrement(),
    ip: varchar("ip", { length: 45 }).notNull(),
    location: varchar("location", { length: 255 }),
    reported: boolean("reported").default(false).notNull(),
    created: datetime("created").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const credential = mysqlTable("credential", {
    id: int("id").primaryKey().autoincrement(),
    username: varchar("username", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull()
});

// m-m relations

export const attack = mysqlTable("attack", { // no primary key allows multiple foreign keys to point to the same result, in case an attacker tries the same user/pass on the same service, so we can count how many times it was tried and when it was tried
    service: varchar("service", { length: 20 }).notNull(),
    created: datetime("created").default(sql`CURRENT_TIMESTAMP`).notNull(),
    fk_attacker: int("fk_attacker").references(() => attacker.id),
    fk_credential: int("fk_credential").references(() => credential.id)
});