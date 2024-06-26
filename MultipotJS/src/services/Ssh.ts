import Config from "@/Config.js";
import Logger from "@/util/Logger.js";
import * as fs from 'fs';
import geoip from 'geoip-lite';
import ssh2 from 'ssh2';
import { Service, ServiceProps } from "./Service.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export class Ssh extends Service {
    constructor({ service_name, enabled = false, port, reportip = false, discord_webhook }: ServiceProps) {
        super({ service_name, enabled, port, reportip, discord_webhook });

        if (!enabled) return; // when not enabled dont run code

        const server = new ssh2.Server({ hostKeys: [fs.readFileSync(__dirname + '/../../other/ssh2.private.key')], ident: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.7' }, (client: any) => {
            let clientIP = (client as any)._sock.remoteAddress;

            Logger.log(`Client ${clientIP} trying to establish connection!`);
            client.on('authentication', async (ctx) => {
                if (ctx.method === 'password') {
                    const { username, password } = ctx;
                    let location = geoip.lookup(clientIP);
                    let locationStr = location ? `Country [${location.country}] City [${location.city}] Area [${location.area}]` : 'Unknown';

                    Logger.log(`Login attempt [${clientIP}] [${username}] [${password}]`);
                    this.sendDiscordMsg(Config.ssh.discord_webhook, username, password, clientIP, locationStr);
                    await this.saveDB(clientIP, username, password, locationStr, '22');

                    ctx.reject();

                } else ctx.reject();
            });

            client.on('end', () => { Logger.log(`[${clientIP}] - Disconnected`); });
            client.on('close', () => { Logger.log(`[${clientIP}] - Connection closed`); });
            client.on('error', (err) => { Logger.log(`Client error: ${err}`, 'error'); });
        });

        server.listen(port, '0.0.0.0', () => { // Start SSH server
            Logger.log(`Listening SSH on Port ${port}`);
        });
    }
}