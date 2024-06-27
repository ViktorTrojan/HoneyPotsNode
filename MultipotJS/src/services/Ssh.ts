import Logger from "@/util/Logger.js";
import * as fs from 'fs';

import { dirname } from 'path';
import ssh2 from 'ssh2';
import { fileURLToPath } from 'url';
import { Service } from "./Service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export class Ssh extends Service {
    constructor({ enabled = false, reportip = false, discord_webhook }) {
        super({ service_name: 'ssh', port: 22, enabled, reportip, discord_webhook });
    }

    async start() {
        const server = new ssh2.Server({ hostKeys: [fs.readFileSync(__dirname + '/../../other/ssh2.private.key')], ident: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.7' }, (client: any) => {
            let clientIP = (client as any)._sock.remoteAddress;

            Logger.log(`Client ${clientIP} trying to establish connection!`);
            client.on('authentication', async (ctx) => {
                if (ctx.method === 'password') {
                    const { username, password } = ctx;
                    let locationStr = this.ip2Loc(clientIP);

                    Logger.log(`Login attempt [${clientIP}] [${username}] [${password}]`);
                    this.sendDiscordMsg(username, password, clientIP, locationStr);
                    await this.saveDB(clientIP, username, password, locationStr, '22');

                    ctx.reject();

                } else ctx.reject();
            });

            client.on('end', () => { Logger.log(`[${clientIP}] - Disconnected`); });
            client.on('close', () => { Logger.log(`[${clientIP}] - Connection closed`); });
            client.on('error', (err) => { Logger.log(`Client error: ${err}`, 'error'); });
        });

        server.listen(this.port, '0.0.0.0', () => { // Start SSH server
            Logger.log(`Listening SSH on Port ${this.port}`);
        });
    }
}