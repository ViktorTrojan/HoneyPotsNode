import Config from "@/Config.js";
import { DB } from "@/db/DB.js";
import { attack, attacker, credential } from "@/db/Schema.js";
import Logger from "@/util/Logger.js";
import axios from "axios";
import { Webhook, MessageBuilder } from 'discord-webhook-node';
import { and, eq, sql } from "drizzle-orm";
import geoip from 'geoip-lite';

export interface ServiceProps {
    service_name: string;
    enabled: boolean;
    port: number;
    reportip: boolean;
    discord_webhook?: string;
}

export class Service {
    public service_name: string;
    public enabled: boolean;
    public port: number;
    public reportip: boolean;
    public discord_webhook?: string;

    constructor({ service_name, enabled = false, port, reportip = false, discord_webhook }: ServiceProps) {
        this.service_name = service_name;
        this.enabled = enabled;
        this.port = port;
        this.reportip = reportip;
        this.discord_webhook = discord_webhook;

        Logger.log(`Enabled [${enabled}] Service [${service_name}] Port [${port}] ReportIP [${reportip}] DiscordWebhook [${discord_webhook ? true : false}]`)
        if (enabled) this.start();
    }

    async start() { throw new Error('You have to implement the `start` method!'); } // IMPLEMENT THIS

    async reportIP(ip: string, categories: string, username?: string, password?: string) {
        if (Config.app.is_development || !this.reportip) return; // we dont want to report in development mode

        await DB.update(attacker).set({ reported: true }).where(eq(attacker.ip, ip));

        let comment = `${this.service_name} login attempt Port [${this.port}] Username [${username}] Password [${password}]`;
        if (!username || !password) comment = `${this.service_name} unauthorized access Port [${this.port}]`;

        try {
            // CATEGORIES: https://www.abuseipdb.com/categories
            await axios.post('https://api.abuseipdb.com/api/v2/report', { ip, categories, comment }
                , { headers: { 'Accept': 'application/json', 'Key': Config.app.ABUSEIP_API_KEY } })

        } catch (error) {
            Logger.log('Axios Report IP Error: ' + error, "error");
        }
    }

    // TODO: one function thats very customizeable and the other function should then use it internally 
    async discord_send(title: string, msg: string, username: string, ip: string, location: string) {
        if (!this.discord_webhook) return;

        const hook = new Webhook(this.discord_webhook);

        const embed = new MessageBuilder()
            .setTitle(title)
            .setColor('#f3423f')
            .setDescription(msg)
            .addField('Username', username)
            .addField('IP', ip)
            .addField('Location', location)
            .setTimestamp();

        hook.send(embed);
    }

    async sendDiscordMsg(username: string, password: string, ip: string, location: string) {
        if (!this.discord_webhook) return;

        const hook = new Webhook(this.discord_webhook);

        const embed = new MessageBuilder()
            .setTitle('🔵 Login Attempt')
            .setColor('#3342ff')
            .addField('Username', username)
            .addField('Password', password)
            .addField('IP', ip)
            .addField('Location', location)
            .setTimestamp();

        hook.send(embed);
    }

    // TODO: create a function that returns uniqueAttacks, then call it here and get the count
    async db_uniqueAttackCount() { // get unique Attack count from this service
        const result = await DB.select({
            unique_attack_count: sql<number>`COUNT(DISTINCT ${attack.fk_credential})`.mapWith(Number)
        }).from(attack).where(eq(attack.service, this.service_name));
        return result[0]?.unique_attack_count ?? 0;
    }

    async saveDB_noCredentials(ip: string, location: string, reportCategories = '15') {
        let attackerID;
        const foundAttacker = await DB.query.attacker.findFirst({ where: eq(attacker.ip, ip) });
        let shouldReport = true;
        if (foundAttacker) { shouldReport = !foundAttacker.reported; attackerID = foundAttacker.id; }
        else {
            const insertAttacker = await DB.insert(attacker).values({ ip, location }); if (insertAttacker[0].affectedRows === 0) Logger.log("Could not insert Attacker at " + this.service_name, 'error');
            attackerID = insertAttacker[0].insertId;
        }

        if (shouldReport) await this.reportIP(ip, reportCategories);
    }

    async saveDB(ip: string, username: string, password: string, location: string, reportCategories = '15') {
        let attackerID;
        const foundAttacker = await DB.query.attacker.findFirst({ where: eq(attacker.ip, ip) });
        let shouldReport = true;
        if (foundAttacker) { shouldReport = !foundAttacker.reported; attackerID = foundAttacker.id; }
        else {
            const insertAttacker = await DB.insert(attacker).values({ ip, location }); if (insertAttacker[0].affectedRows === 0) Logger.log("Could not insert Attacker at " + this.service_name, 'error');
            attackerID = insertAttacker[0].insertId;
        }

        if (shouldReport) await this.reportIP(ip, reportCategories, username, password);

        const foundCredential = await DB.query.credential.findFirst({ where: and(eq(credential.username, username), eq(credential.password, password)) });
        let credentialID;
        if (foundCredential) { credentialID = foundCredential.id; }
        else {
            const insertCredential = await DB.insert(credential).values({ username, password });
            if (insertCredential[0].affectedRows === 0) Logger.log("Could not insert Credential at " + this.service_name, 'error');
            credentialID = insertCredential[0].insertId;
        }

        const insertAttack = await DB.insert(attack).values({ service: this.service_name, fk_attacker: attackerID, fk_credential: credentialID });
        if (insertAttack[0].affectedRows === 0) Logger.log("Could not insert Attack at " + this.service_name, 'error');
    }

    ip2Loc(ip: string): string {
        let location = geoip.lookup(ip);
        return location ? `Country [${location.country}] City [${location.city}] Area [${location.area}]` : 'Unknown';
    }
}