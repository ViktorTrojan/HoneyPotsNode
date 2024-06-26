import Config from "@/Config.js";
import { DB } from "@/db/DB.js";
import { attack, attacker, credential } from "@/db/Schema.js";
import Logger from "@/util/Logger.js";
import axios from "axios";
import { Webhook, MessageBuilder } from 'discord-webhook-node';
import { and, eq } from "drizzle-orm";

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
    }

    async reportIP(ip: string, categories: string, username: string, password: string) {
        if (Config.app.is_development) return; // we dont want to report in development mode

        await DB.update(attacker).set({ reported: true }).where(eq(attacker.ip, ip));

        try {
            // CATEGORIES: https://www.abuseipdb.com/categories
            await axios.post('https://api.abuseipdb.com/api/v2/report', { ip, categories, comment: `${this.service_name} login attempt Port [${this.port}] Username [${username}] Password [${password}]` }
                , { headers: { 'Accept': 'application/json', 'Key': Config.app.ABUSEIP_API_KEY } })

        } catch (error) {
            Logger.log('Axios Report IP Error: ' + error, "error");
        }
    }

    async sendDiscordMsg(webhookUrl: string, username: string, password: string, ip: string, location: string) {
        const hook = new Webhook(webhookUrl);

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

    async saveDB(ip: string, username: string, password: string, location: string, reportCategories='15') {
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

        const insertAttack = await DB.insert(attack).values({ service: 'ssh', fk_attacker: attackerID, fk_credential: credentialID });
        if (insertAttack[0].affectedRows === 0) Logger.log("Could not insert Attack at " + this.service_name, 'error');
    }
}