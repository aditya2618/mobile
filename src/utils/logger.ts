import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_LOGS = 500; // Keep last 500 logs
const LOG_STORAGE_KEY = '@app_logs';

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
}

class Logger {
    private logs: LogEntry[] = [];
    private initialized = false;

    async initialize() {
        if (this.initialized) return;

        try {
            const storedLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            if (storedLogs) {
                this.logs = JSON.parse(storedLogs);
            }
            this.initialized = true;
        } catch (error) {
            console.error('Failed to load logs:', error);
            this.logs = [];
        }
    }

    private async saveLogs() {
        try {
            await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to save logs:', error);
        }
    }

    private addLog(level: LogEntry['level'], message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };

        this.logs.push(entry);

        // Keep only last MAX_LOGS entries
        if (this.logs.length > MAX_LOGS) {
            this.logs = this.logs.slice(-MAX_LOGS);
        }

        // Save to AsyncStorage (async, non-blocking)
        this.saveLogs();

        // Also log to console
        const consoleMessage = `[${entry.timestamp}] ${message}`;
        switch (level) {
            case 'error':
                console.error(consoleMessage, data || '');
                break;
            case 'warn':
                console.warn(consoleMessage, data || '');
                break;
            case 'debug':
                console.debug(consoleMessage, data || '');
                break;
            default:
                console.log(consoleMessage, data || '');
        }
    }

    info(message: string, data?: any) {
        this.addLog('info', message, data);
    }

    warn(message: string, data?: any) {
        this.addLog('warn', message, data);
    }

    error(message: string, data?: any) {
        this.addLog('error', message, data);
    }

    debug(message: string, data?: any) {
        this.addLog('debug', message, data);
    }

    async getLogs(limit?: number): Promise<LogEntry[]> {
        await this.initialize();
        if (limit) {
            return this.logs.slice(-limit);
        }
        return this.logs;
    }

    async getLogsByLevel(level: LogEntry['level']): Promise<LogEntry[]> {
        await this.initialize();
        return this.logs.filter(log => log.level === level);
    }

    async clearLogs() {
        this.logs = [];
        await AsyncStorage.removeItem(LOG_STORAGE_KEY);
    }

    async exportLogs(): Promise<string> {
        await this.initialize();
        return JSON.stringify(this.logs, null, 2);
    }
}

// Singleton instance
export const logger = new Logger();

// Initialize on import
logger.initialize();
