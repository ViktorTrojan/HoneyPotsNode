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
        enabled: process.env.TELNET! === 'true',
        reportip: process.env.TELNET_REPORT! === 'true',
        discord_webhook: process.env.TELNET_DISCORD_HOOK!
    },
    ssh: {
        enabled: process.env.SSH! === 'true',
        reportip: process.env.SSH_REPORT! === 'true',
        discord_webhook: process.env.SSH_DISCORD_HOOK!
    },
    rdp: {
        enabled: process.env.RDP! === 'true',
        reportip: process.env.RDP_REPORT! === 'true',
        discord_webhook: process.env.RDP_DISCORD_HOOK!
    },
    mysql: {
        enabled: process.env.MYSQL! === 'true',
        reportip: process.env.MYSQL_REPORT! === 'true',
        discord_webhook: process.env.MYSQL_DISCORD_HOOK!
    },
    ftp: {
        enabled: process.env.FTP! === 'true',
        reportip: process.env.FTP_REPORT! === 'true',
        discord_webhook: process.env.FTP_DISCORD_HOOK!
    },
    vnc: {
        enabled: process.env.VNC! === 'true',
        reportip: process.env.VNC_REPORT! === 'true',
        discord_webhook: process.env.VNC_DISCORD_HOOK!
    },
    mongodb: {
        enabled: process.env.MONGODB! === 'true',
        reportip: process.env.MONGODB_REPORT! === 'true',
        discord_webhook: process.env.MONGODB_DISCORD_HOOK!
    },
    mssql: {
        enabled: process.env.MSSQL! === 'true',
        reportip: process.env.MSSQL_REPORT! === 'true',
        discord_webhook: process.env.MSSQL_DISCORD_HOOK!
    },
    redis: {
        enabled: process.env.REDIS! === 'true',
        reportip: process.env.REDIS_REPORT! === 'true',
        discord_webhook: process.env.REDIS_DISCORD_HOOK!
    },
    minecraft: {
        enabled: process.env.MINECRAFT! === 'true',
        reportip: process.env.MINECRAFT_REPORT! === 'true',
        discord_webhook: process.env.MINECRAFT_DISCORD_HOOK!
    }
};

export default Config;