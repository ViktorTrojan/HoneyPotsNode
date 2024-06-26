import Config from "./Config.js";
import { Minecraft } from "./services/Minecraft.js";
import { Ssh } from "./services/Ssh.js";
import Logger from "./util/Logger.js";


async function main() {
    if(Config.app.is_development) {
        Logger.log("DEVELOPMENT MODE ACTIVATED! IPs WILL NOT GET REPORTED!");
    }

    new Ssh({service_name: 'ssh', port: 22, enabled: Config.ssh.enabled, reportip: Config.ssh.reportip, discord_webhook: Config.ssh.discord_webhook })
    new Minecraft({service_name: 'minecraft', port: 25565, enabled: Config.minecraft.enabled, reportip: Config.minecraft.reportip, discord_webhook: Config.minecraft.discord_webhook })

}

main();