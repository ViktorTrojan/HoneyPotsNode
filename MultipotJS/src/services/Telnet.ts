import Logger from "@/util/Logger.js";
import net from 'net';
import { Service } from "./Service.js";

export class Telnet extends Service {
    constructor({ enabled = false, reportip = false, discord_webhook }) {
        super({ service_name: 'telnet', port: 23, enabled, reportip, discord_webhook });
    }

    async start() {
        const server = net.createServer(async (socket) => {
            let clientIP = socket.remoteAddress!;
            let locationStr = this.ip2Loc(clientIP);

            Logger.log(`Telnet connection from ${clientIP}`);
            this.sendDiscordMsg('', '', clientIP, locationStr);
            await this.saveDB_noCredentials(clientIP, locationStr);

            socket.on('end', () => {
                Logger.log(`[${clientIP}] - Disconnected`);
            });

            socket.on('close', () => {
                Logger.log(`[${clientIP}] - Connection closed`);
            });

            socket.on('error', (err) => {
                Logger.log(`Client error: ${err}`, 'error');
            });
        });

        server.listen(this.port, '0.0.0.0', () => {
            Logger.log(`Listening Telnet on Port ${this.port}`);
        });
    }
}