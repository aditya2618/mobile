import { logger } from '../utils/logger';

export class DeviceClient {
    private baseUrl: string;

    constructor(ipAddress: string = '192.168.4.1') {
        this.baseUrl = `http://${ipAddress}/api`;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        try {
            // Add a timeout to the fetch since we're connecting to a local device
            // that might be flakey or unreachable
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            clearTimeout(id);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Request failed: ${response.status}`);
            }

            return response.json();
        } catch (error: any) {
            logger.error(`Device API Error (${endpoint}):`, error);
            throw new Error(error.message || 'Failed to communicate with device');
        }
    }

    /**
     * Get device information (chip ID, MAC, etc.)
     */
    async getDeviceInfo() {
        return this.request('/info');
    }

    /**
     * Send WiFi credentials to the device
     */
    async sendWiFiConfig(ssid: string, password: string) {
        return this.request('/wifi', {
            method: 'POST',
            body: JSON.stringify({ ssid, password }),
        });
    }

    /**
     * Send MQTT configuration to the device
     */
    async sendMQTTConfig(
        broker: string,
        port: number,
        topic_prefix: string,
        node_name: string
    ) {
        return this.request('/mqtt', {
            method: 'POST',
            body: JSON.stringify({
                broker,
                port,
                topic_prefix,
                node_name,
            }),
        });
    }

    /**
     * Trigger device restart
     */
    async restartDevice() {
        return this.request('/restart', {
            method: 'POST',
        });
    }
}
