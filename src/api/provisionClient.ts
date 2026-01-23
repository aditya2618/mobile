import AsyncStorage from '@react-native-async-storage/async-storage';
import { useServerConfigStore } from '../store/serverConfigStore';
import { logger } from '../utils/logger';

interface ProvisioningResponse {
    provisioning_id: string;
    mqtt_config: {
        broker_host: string;
        broker_port: number;
        topic_prefix: string;
        node_name: string;
    };
    device: {
        id: number;
        node_name: string;
        name: string;
        status: 'pending' | 'connected';
    };
}

interface ProvisioningStatusResponse {
    status: 'pending' | 'connected';
    is_provisioned: boolean;
    device: {
        id: number;
        name: string;
        node_name: string;
        is_online: boolean;
        is_provisioned: boolean;
        provisioned_at: string | null;
        last_seen: string | null;
    };
}

interface MQTTConfigResponse {
    broker_host: string;
    broker_port: number;
}

interface HomeResponse {
    homes: Array<{
        id: number;
        name: string;
        device_count: number;
    }>;
}

class ProvisioningAPIClient {
    private getBaseURL(): string {
        const baseUrl = useServerConfigStore.getState().getBaseUrl();
        if (!baseUrl) {
            throw new Error('Server not configured. Please set server IP.');
        }
        return baseUrl;
    }

    private async getAuthToken(): Promise<string | null> {
        return await AsyncStorage.getItem('@auth_token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = await this.getAuthToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers as Record<string, string>,
        };

        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }

        const baseURL = this.getBaseURL();
        const response = await fetch(`${baseURL}/api${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * Register a new device for provisioning
     */
    async registerDevice(
        deviceId: string,
        homeId: number,
        deviceName?: string
    ): Promise<ProvisioningResponse> {
        return this.request<ProvisioningResponse>('/provision/register/', {
            method: 'POST',
            body: JSON.stringify({
                device_id: deviceId,
                home_id: homeId,
                device_name: deviceName || deviceId,
            }),
        });
    }

    /**
     * Check provisioning status of a device
     */
    async getProvisioningStatus(
        provisioningId: string
    ): Promise<ProvisioningStatusResponse> {
        return this.request<ProvisioningStatusResponse>(
            `/provision/status/${provisioningId}/`
        );
    }

    /**
     * Get MQTT broker configuration
     */
    async getMQTTConfig(): Promise<MQTTConfigResponse> {
        return this.request<MQTTConfigResponse>('/provision/mqtt-config/');
    }

    /**
     * Get list of homes for device assignment
     */
    async getUserHomes(): Promise<HomeResponse> {
        return this.request<HomeResponse>('/provision/homes/');
    }

    /**
     * Poll provisioning status until device connects or timeout
     */
    async pollProvisioningStatus(
        provisioningId: string,
        intervalMs: number = 3000,
        timeoutMs: number = 120000
    ): Promise<ProvisioningStatusResponse> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const status = await this.getProvisioningStatus(provisioningId);

            if (status.status === 'connected') {
                return status;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        throw new Error('Provisioning timeout - device did not connect');
    }
    /**
     * Cancel provisioning session and cleanup
     */
    async cancelProvisioning(provisioningId: string): Promise<void> {
        return this.request<void>(`/provision/cancel/${provisioningId}/`, {
            method: 'DELETE',
        });
    }
}

export const provisioningAPI = new ProvisioningAPIClient();

/**
 * Device Client - Communicates directly with ESP32 device over local WiFi
 * When phone is connected to ESP32's AP network
 */
export class DeviceClient {
    private deviceIP: string;

    constructor(deviceIP: string = '192.168.4.1') {
        this.deviceIP = deviceIP; // Default ESP32 AP IP
    }

    /**
     * Send WiFi credentials to ESP32 device
     */
    async sendWiFiConfig(ssid: string, password: string): Promise<boolean> {
        try {
            const response = await fetch(`http://${this.deviceIP}/api/wifi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ssid,
                    password,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send WiFi config');
            }

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            logger.error('Error sending WiFi config:', error);
            throw error;
        }
    }

    /**
     * Send MQTT configuration to ESP32 device
     */
    async sendMQTTConfig(
        brokerHost: string,
        brokerPort: number,
        topicPrefix: string,
        nodeName: string
    ): Promise<boolean> {
        try {
            const response = await fetch(`http://${this.deviceIP}/api/mqtt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    broker_host: brokerHost,
                    broker_port: brokerPort,
                    topic_prefix: topicPrefix,
                    node_name: nodeName,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send MQTT config');
            }

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            logger.error('Error sending MQTT config:', error);
            throw error;
        }
    }

    /**
     * Get device info from ESP32
     */
    async getDeviceInfo(): Promise<{
        chip_id: string;
        mac_address: string;
        firmware_version: string;
    }> {
        try {
            const response = await fetch(`http://${this.deviceIP}/api/info`);

            if (!response.ok) {
                throw new Error('Failed to get device info');
            }

            return response.json();
        } catch (error) {
            logger.error('Error getting device info:', error);
            throw error;
        }
    }

    /**
     * Trigger device restart after configuration
     */
    async restartDevice(): Promise<boolean> {
        try {
            const response = await fetch(`http://${this.deviceIP}/api/restart`, {
                method: 'POST',
            });

            return response.ok;
        } catch (error) {
            // Device might restart before responding
            console.log('Device restarting...');
            return true;
        }
    }
}
