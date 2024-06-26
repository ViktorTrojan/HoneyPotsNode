import { sql } from 'drizzle-orm';
import { datetime, int, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export const login_attempts = mysqlTable("login_attempts", {
    id: int("id").primaryKey().autoincrement(),
    date: datetime("created").default(sql`CURRENT_TIMESTAMP`).notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    ip: varchar("ip", { length: 45 }).notNull(),
    location: varchar("location", { length: 255 }),
});

export const executed_commands = mysqlTable("executed_commands", {
    id: int("id").primaryKey().autoincrement(),
    command: text("command").default(sql`CURRENT_TIMESTAMP`).notNull(),
    fk_login: int("fk_login").references(() => login_attempts.id),
});