import winston from "winston";

const logger = winston.createLogger({
	level: "debug",
	transports: [new winston.transports.Console()],
	format: winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		winston.format.printf(({ timestamp, level, message }) => {
			return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
		})
	),
});

export default logger;
