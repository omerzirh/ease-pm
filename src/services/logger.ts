import { error } from "console";

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    stack?: string;
    meta?: any;
}

class Logger {
    private level: LogLevel;
    private maxLogs: number;
    private logLevels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    };
    
    constructor() {
        this.level = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || (import.meta.env.DEV ? 'debug' : 'info');

        // Maximum number of logs to store in localStorage (defaults to 500 if VITE_MAX_LOGS is not set properly in .env)
        this.maxLogs = (import.meta.env.VITE_MAX_LOGS && !isNaN(parseInt(import.meta.env.VITE_MAX_LOGS))) ? parseInt(import.meta.env.VITE_MAX_LOGS) : 500;
    }

    private extractErrorInfo(meta?: any): { stack?: string; cleanMeta?: any } {
        if (!meta) return {};

        // Check if meta is an Error object
        if (meta instanceof Error) {
        return {
            stack: meta.stack,
            cleanMeta: {
            name: meta.name,
            message: meta.message,
            }
        };
        }

        // Check if meta has an error property
        if (meta.error instanceof Error) {
        const { error, ...rest } = meta;
        return {
            stack: error.stack,
            cleanMeta: {
                ...rest,
                error: {
                    name: error.name,
                    message: error.message,
                }
            }
        };
        }

        // Check if meta has a stack property (already extracted)
        if (meta.stack && typeof meta.stack === 'string') {
            const { stack, ...rest } = meta;
            return {
                stack: stack,
                cleanMeta: rest
            };
        }

        return { cleanMeta: meta };
    }

    private formatLog(entry: LogEntry): string {
        let log = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]: ${entry.message}`;
    
        // Add stack trace if present
        if (entry.stack) {
            log += `\n${entry.stack}`;
        }
        
        // Add metadata if present
        if (entry.meta && Object.keys(entry.meta).length > 0) {
            log += `\n${JSON.stringify(entry.meta, null, 2)}`;
        }
        
        return log;
    }

    private log(level: LogLevel, service: string, message: string, meta?: any) {
        if (this.logLevels[level] > this.logLevels[this.level]) return;

        // Extract error information
        const { stack, cleanMeta } = this.extractErrorInfo(meta);

        const entry: LogEntry = {
            timestamp: new Date().toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
            }),
            level,
            service,
            message,
            stack,
            meta: cleanMeta
        };

        const formattedLog = this.formatLog(entry);

        switch (level) {
            case 'error':
                console.error(`%c${formattedLog}`, 'color: #ff6b6b; font-weight: bold;');
                break;
            case 'warn':
                console.warn(`%c${formattedLog}`, 'color: #ffa726; font-weight: bold;');
                break;
            case 'info':
                console.info(`%c${formattedLog}`, 'color: #42a5f5; font-weight: bold;');
                break;
            case 'http':
                console.log(`%c${formattedLog}`, 'color: #ab47bc; font-weight: bold;');
                break;
            case 'debug':
                console.debug(`%c${formattedLog}`, 'color: #66bb6a; font-weight: bold;');
                break;
        }

        // Store logs for potential export/analysis
        if (import.meta.env.DEV) {
            this.storeLogs(entry);
        }
    }

    private storeLogs(entry: LogEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('ease-pm-logs') || '[]');
            logs.push(entry);
            
            // Keep only last maxLogs logs to avoid localStorage bloat
            if (logs.length > this.maxLogs) {
                logs.splice(0, logs.length - this.maxLogs);
            }
        
            localStorage.setItem('ease-pm-logs', JSON.stringify(logs));
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    createLogger(service: string) {
        return {
            error: (message: string, meta?: any) => this.log('error', service, message, meta),
            warn: (message: string, meta?: any) => this.log('warn', service, message, meta),
            info: (message: string, meta?: any) => this.log('info', service, message, meta),
            http: (message: string, meta?: any) => this.log('http', service, message, meta),
            debug: (message: string, meta?: any) => this.log('debug', service, message, meta),
        };
    }

    exportLogs(): LogEntry[] {
        try {
            return JSON.parse(localStorage.getItem('ease-pm-logs') || '[]');
        } catch {
            return [];
        }
    }

    clearLogs() {
        localStorage.removeItem('ease-pm-logs');
    }
}

const logger = new Logger();

export const createLogger = (service: string) => logger.createLogger(service);

export const exportLogs = () => logger.exportLogs();
export const clearLogs = () => logger.clearLogs();

export default logger;