import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import DailyRotate from 'winston-daily-rotate-file';
import Config from '@/Config.js';

const logDir = Config.logger.logpath;

let infoLogger;
let errorLogger;
let warnLogger;
let allLogger;

class Logger {
	static init() {
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir);
		}

		infoLogger = createLogger({
			// change level if in dev environment versus production
			level: Config.app.is_development ? 'info' : 'debug',
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss',
				}),
				format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
				// this is to log in json format
				// format.json()

			),
			transports: [
				new transports.Console({
					level: 'info',
					format: format.combine(
						format.colorize(),
						format.printf(
							info => `${info.timestamp} ${info.level}: ${info.message}`,
						),
					),
				}),

				new (DailyRotate)({
					filename: `${logDir}/%DATE%-info-results.log`,
					datePattern: 'YYYY-MM-DD',
				}),
			],
			exitOnError: false,
		});

		errorLogger = createLogger({
			// change level if in dev environment versus production
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss',
				}),
				format.printf(error => `${error.timestamp} ${error.level}: ${error.message}`),

			),
			transports: [
				new transports.Console({
					level: 'error',
					format: format.combine(
						format.errors({ stack: Config.app.is_development ? true : false }), // <-- use errors format
						format.colorize(),
						format.printf(error => {if(error.stack) return `${error.timestamp} ${error.level}: ${error.message} - ${error.stack}`;
						return `${error.timestamp} ${error.level}: ${error.message}`}),
					),
				}),

				new (DailyRotate)({
					filename: `${logDir}/%DATE%-errors-results.log`,
					datePattern: 'YYYY-MM-DD',
				}),
			],
			exitOnError: false,
		});

		warnLogger = createLogger({
			// change level if in dev environment versus production
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss',
				}),
				format.printf(warn => `${warn.timestamp} ${warn.level}: ${warn.message}`),

			),
			transports: [
				new transports.Console({
					level: 'warn',
					format: format.combine(
						format.colorize(),
						format.printf(
							warn => `${warn.timestamp} ${warn.level}: ${warn.message}`,
						),
					),
				}),

				new (DailyRotate)({
					filename: `${logDir}/%DATE%-warnings-results.log`,
					datePattern: 'YYYY-MM-DD',
				}),
			],
			exitOnError: false,
		});

		allLogger = createLogger({
			// change level if in dev environment versus production
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss',
				}),
				format.printf(silly => `${silly.timestamp} ${silly.level}: ${silly.message}`),

			),
			transports: [
				new (DailyRotate)({
					filename: `${logDir}/%DATE%-results.log`,
					datePattern: 'YYYY-MM-DD',
				}),
			],
			exitOnError: false,
		});
	}

	static log(message: string, severity: 'info' | 'error' | 'warn' = 'info', data?) {
		if (infoLogger.levels[severity] == null) severity = 'info'; // e.g level error in production will not print, only as info
		if (severity === 'info') {
			infoLogger.log(severity, message, data);
			allLogger.log(severity, message, data);
		} else if (severity === 'error') {
			errorLogger.log(severity, message);
			allLogger.log(severity, message, data);
		} else if (severity === 'warn') {
			warnLogger.log(severity, message, data);
			allLogger.log(severity, message, data);
		}
	}
}

Logger.init();
export default Logger;