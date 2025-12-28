/**
 * Smart API Client
 * Automatically switches between local and cloud APIs based on network availability
 */
import { apiClient } from './client';
import { cloudApi, CLOUD_URL } from './cloudClient';
import { detectNetworkMode, NetworkMode } from './networkMode';
import { useServerConfigStore } from '../store/serverConfigStore';
import { wsClient } from './websocket';

class SmartApiClient {
    private currentMode: NetworkMode = 'local';
    private homeId: string | null = null;

    /**
     * Initialize and detect network mode
     */
    async initialize(homeId?: string) {
        if (homeId) {
            this.homeId = homeId;
        }
        const homeIdNum = this.homeId ? parseInt(this.homeId, 10) : undefined;
        this.currentMode = await detectNetworkMode(homeIdNum);

        // Update WebSocket mode
        wsClient.setCloudMode(this.currentMode === 'cloud', CLOUD_URL);

        return this.currentMode;
    }

    /**
     * Get current network mode
     */
    getMode(): NetworkMode {
        return this.currentMode;
    }

    /**
     * Force re-detection of network mode
     */
    async refresh() {
        return this.initialize(this.homeId || undefined);
    }

    /**
     * Set home ID for cloud operations
     */
    setHomeId(homeId: string) {
        this.homeId = homeId;
    }

    /**
     * Get homes (local or cloud)
     */
    async getHomes() {
        if (this.currentMode === 'local') {
            const response = await apiClient.get('/homes/');
            return response.data;
        } else if (this.currentMode === 'cloud') {
            return await cloudApi.getHomes();
        }
        throw new Error('No network connection available');
    }

    /**
     * Get devices for a home
     */
    async getDevices(homeId: number) {
        if (this.currentMode === 'local') {
            const response = await apiClient.get(`/homes/${homeId}/devices/`);
            return response.data;
        } else if (this.currentMode === 'cloud') {
            // Use REST API to get synced devices
            console.log('☁️ Using CLOUD REST API for devices');
            const gatewayUuid = await cloudApi.getGatewayUuid();
            if (!gatewayUuid) {
                throw new Error("Gateway UUID not found (not paired?)");
            }
            return await cloudApi.getDevices(gatewayUuid);
        }
        throw new Error('No network connection available');
    }

    /**
     * Control an entity
     */
    async controlEntity(entityId: number, command: string, value?: any) {
        console.log(`🎮 SmartAPI controlEntity: mode=${this.currentMode}, entityId=${entityId}`);
        if (this.currentMode === 'local') {
            // Local server expects {key: value} format, e.g., {value: "ON"}
            const payload = { [command]: value };
            console.log('🏠 Using LOCAL API for control');
            const response = await apiClient.post(`/entities/${entityId}/control/`, payload);
            return response.data;
        } else if (this.currentMode === 'cloud') {
            // Use cloud API for remote control with gateway UUID
            console.log('☁️ Using CLOUD API for control');
            const gatewayUuid = await cloudApi.getGatewayUuid();
            if (!gatewayUuid) {
                throw new Error("Gateway UUID not found for cloud control");
            }
            return await cloudApi.controlEntity(gatewayUuid, entityId, command, value);
        }
        throw new Error('No network connection available');
    }

    /**
     * Run a scene
     */
    async runScene(sceneId: number) {
        if (this.currentMode === 'local') {
            const response = await apiClient.post(`/scenes/${sceneId}/run`);
            return response.data;
        } else if (this.currentMode === 'cloud') {
            const gatewayUuid = await cloudApi.getGatewayUuid();
            if (!gatewayUuid) {
                throw new Error("Gateway UUID not found for cloud control");
            }
            return await cloudApi.runScene(gatewayUuid, sceneId);
        }
        throw new Error('No network connection available');
    }

    /**
     * Get automations
     */
    async getAutomations(homeId: number) {
        if (this.currentMode === 'local') {
            const response = await apiClient.get(`/homes/${homeId}/automations/`);
            return response.data;
        } else if (this.currentMode === 'cloud') {
            // Cloud doesn't have this endpoint yet
            throw new Error('Remote automation listing not yet implemented');
        }
        throw new Error('No network connection available');
    }

    /**
     * Get scenes  
     */
    async getScenes(homeId: number) {
        if (this.currentMode === 'local') {
            const response = await apiClient.get(`/homes/${homeId}/scenes/`);
            return response.data;
        } else if (this.currentMode === 'cloud') {
            // Cloud doesn't have this endpoint yet
            throw new Error('Remote scene listing not yet implemented');
        }
        throw new Error('No network connection available');
    }
}

// Export singleton instance
export const smartApi = new SmartApiClient();
