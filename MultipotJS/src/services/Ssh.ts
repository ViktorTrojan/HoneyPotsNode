import { Service, ServiceProps } from "./Service.js";


export class Ssh extends Service {
    constructor({ service_name, enabled = false, port, reportip = false, discord_webhook }: ServiceProps) {
        super({service_name, enabled, port, reportip, discord_webhook});
    }
}