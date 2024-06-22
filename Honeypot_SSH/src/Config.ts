import dotenv from 'dotenv';
const isProduction = process.env.NODE_ENV === 'production';
dotenv.config({ path: isProduction ? '.env.production' : '.env' });

const Config = {
    app: {
        is_development: !isProduction!,
        is_production: isProduction!,
        ENV: process.env.NODE_ENV!,
    },
    db: {
        MYSQL_HOST: process.env.MYSQL_HOST!,
        MYSQL_PORT: process.env.MYSQL_PORT!,
        MYSQL_USER: process.env.MYSQL_USER!,
        MYSQL_DB_NAME: process.env.MYSQL_DB_NAME!,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD!,
    },
};

export default Config;