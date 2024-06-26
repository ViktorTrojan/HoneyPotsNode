import dotenv from 'dotenv';
const isProduction = process.env.NODE_ENV === 'production';
dotenv.config({ path: isProduction ? '.env.production' : '.env' });

const Config = {
    app: {
        is_development: !isProduction!,
        is_production: isProduction!,
        ENV: process.env.NODE_ENV!,

        ABUSEIP_API_KEY: process.env.ABUSEIP_API_KEY!,
    },
    db: {
        MYSQL_HOST: process.env.MYSQL_HOST!,
        MYSQL_PORT: process.env.MYSQL_PORT!,
        MYSQL_USER: process.env.MYSQL_USER!,
        MYSQL_DB_NAME: process.env.MYSQL_DB_NAME!,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD!,
    },
    logger: {
        logpath: 'logs/',
    },
    telnet: {
        enabled: Boolean(process.env.TELNET!),
        reportip: Boolean(process.env.TELNET_REPORT!),
        discord_webhook: process.env.TELNET_DISCORD_HOOK!
    },
    ssh: {
        enabled: Boolean(process.env.SSH!),
        reportip: Boolean(process.env.SSH_REPORT!),
        discord_webhook: process.env.SSH_DISCORD_HOOK!
    },
    rdp: {
        enabled: Boolean(process.env.RDP!),
        reportip: Boolean(process.env.RDP_REPORT!),
        discord_webhook: process.env.RDP_DISCORD_HOOK!
    },
    mysql: {
        enabled: Boolean(process.env.MYSQL!),
        reportip: Boolean(process.env.MYSQL_REPORT!),
        discord_webhook: process.env.MYSQL_DISCORD_HOOK!
    },
    ftp: {
        enabled: Boolean(process.env.FTP!),
        reportip: Boolean(process.env.FTP_REPORT!),
        discord_webhook: process.env.FTP_DISCORD_HOOK!
    },
    vnc: {
        enabled: Boolean(process.env.VNC!),
        reportip: Boolean(process.env.VNC_REPORT!),
        discord_webhook: process.env.VNC_DISCORD_HOOK!
    },
    mongodb: {
        enabled: Boolean(process.env.MONGODB!),
        reportip: Boolean(process.env.MONGODB_REPORT!),
        discord_webhook: process.env.MONGODB_DISCORD_HOOK!
    },
    mssql: {
        enabled: Boolean(process.env.MSSQL!),
        reportip: Boolean(process.env.MSSQL_REPORT!),
        discord_webhook: process.env.MSSQL_DISCORD_HOOK!
    },
    redis: {
        enabled: Boolean(process.env.REDIS!),
        reportip: Boolean(process.env.REDIS_REPORT!),
        discord_webhook: process.env.REDIS_DISCORD_HOOK!
    },
    minecraft: {
        enabled: Boolean(process.env.MINECRAFT!),
        reportip: Boolean(process.env.MINECRAFT_REPORT!),
        discord_webhook: process.env.MINECRAFT_DISCORD_HOOK!
    }
};

export default Config;