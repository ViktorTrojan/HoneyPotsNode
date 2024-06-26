import Logger from "@/util/Logger.js";

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
}