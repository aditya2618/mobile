/**
 * Network Mode Detection
 * Determines if the app should use local or cloud API
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useServerConfigStore } from '../store/serverConfigStore';
import { cloudApi } from './cloudClient';
import { apiClient } from './client';
import axios from 'axios';

export type NetworkMode = 'local' | 'cloud' | 'offline';

const CLOUD_MODE_KEY = '@cloud_mode_enabled';
const FORCE_CLOUD_KEY = '@force_cloud_only';

/**
 * Get user's cloud mode preference
 */
export const getCloudModePreference = async (): Promise<boolean> => {
    const pref = await AsyncStorage.getItem(CLOUD_MODE_KEY);
    return pref === 'true';
};

/**
 * Set cloud mode preference
 */
export const setCloudModePreference = async (enabled: boolean): Promise<void> => {
    await AsyncStorage.setItem(CLOUD_MODE_KEY, enabled.toString());
};

/**
 * Get force cloud only preference
 */
export const getForceCloudPreference = async (): Promise<boolean> => {
    const pref = await AsyncStorage.getItem(FORCE_CLOUD_KEY);
    return pref === 'true';
};

/**
 * Set force cloud only preference
 */
export const setForceCloudPreference = async (enabled: boolean): Promise<void> => {
    await AsyncStorage.setItem(FORCE_CLOUD_KEY, enabled.toString());
};

/**
 * Check if local server is reachable
 */
export const checkLocalServer = async (): Promise<boolean> => {
    try {
        const baseUrl = useServerConfigStore.getState().getBaseUrl();
        if (!baseUrl) return false;

        // Try to reach local server with short timeout
        // Use apiClient to include auth headers
        const response = await apiClient.get('/homes/', {
            timeout: 2000,
        });

        return response.status === 200;
    } catch (error) {
        console.log('📡 Local server not reachable');
        return false;
    }
};

/**
 * Check if cloud server is reachable and gateway is online
 */
export const checkCloudGateway = async (homeId: string): Promise<boolean> => {
    try {
        // Get gateway UUID for cloud API
        const gatewayUuid = await cloudApi.getGatewayUuid();
        if (!gatewayUuid) {
            console.log('☁️ No gateway UUID found');
            return false;
        }

        const status = await cloudApi.getGatewayStatus(gatewayUuid);
        // Cloud is reachable if we got a response (regardless of gateway online/offline)
        console.log(`☁️ Cloud gateway status: ${status.status}`);
        return true;  // Cloud API is reachable
    } catch (error) {
        console.log('☁️ Cloud gateway not reachable');
        return false;
    }
};

/**
 * Check if home has active cloud subscription
 */
export const checkCloudSubscription = async (homeId: number): Promise<boolean> => {
    try {
        const response = await apiClient.get(`/homes/${homeId}/subscription/`);
        return response.data.has_cloud_access === true;
    } catch (error) {
        console.log('⚠️ No cloud subscription');
        return false;
    }
};

/**
 * Detect current network mode based on:
 * 1. User preference (cloud toggle)
 * 2. Local server reachability
 * 3. Cloud server reachability + subscription
 */
export const detectNetworkMode = async (homeId?: number): Promise<NetworkMode> => {
    const cloudPrefEnabled = await getCloudModePreference();
    const forceCloudOnly = await getForceCloudPreference();

    console.log(`🔍 DETECT: homeId=${homeId}, cloudPref=${cloudPrefEnabled}, forceCloud=${forceCloudOnly}`);

    // 0. Force Cloud Only mode - skip local check entirely
    if (forceCloudOnly && cloudPrefEnabled && homeId) {
        console.log('🔍 DETECT: Force Cloud Only mode enabled');
        const cloudReachable = await checkCloudGateway(homeId.toString());
        if (cloudReachable) {
            console.log('✅ Network mode: CLOUD (forced)');
            return 'cloud';
        } else {
            console.log('⚠️ Force Cloud mode but cloud unreachable, falling back to local');
        }
    }

    // 1. Try Local Server
    const localAvailable = await checkLocalServer();
    console.log(`🔍 DETECT: localAvailable=${localAvailable}`);

    if (localAvailable && !cloudPrefEnabled) {
        console.log('✅ Network mode: LOCAL (default)');
        return 'local';
    }

    // 2. If Cloud Mode enabled, check viability
    if (cloudPrefEnabled && homeId) {
        console.log(`🔍 DETECT: Checking cloud access for home ${homeId}`);

        // If local is available, always use LOCAL for faster response
        if (localAvailable) {
            console.log('🔍 DETECT: Local available, checking subscription for cloud fallback...');
            const hasCloudAccess = await checkCloudSubscription(homeId);
            console.log(`🔍 DETECT: hasCloudAccess=${hasCloudAccess}`);
            // Even with cloud subscription, prefer LOCAL when on local network
            console.log('✅ Network mode: LOCAL (preferred over cloud when local available)');
            return 'local';
        }

        // If local unavailable (or failed sub check), Try Cloud Direct
        // This allows remote access when away from home
        console.log('🔍 DETECT: Checking cloud gateway...');
        const cloudReachable = await checkCloudGateway(homeId.toString());
        console.log(`🔍 DETECT: cloudReachable=${cloudReachable}`);
        if (cloudReachable) {
            console.log('✅ Network mode: CLOUD (verified remote)');
            return 'cloud';
        }
    } else {
        console.log(`🔍 DETECT: Skipping cloud check (cloudPref=${cloudPrefEnabled}, homeId=${homeId})`);
    }

    // 3. Fallback to Local if available (even if cloud pref was on but failed)
    if (localAvailable) {
        console.log('✅ Network mode: LOCAL (fallback)');
        return 'local';
    }

    console.log('⚠️ Network mode: OFFLINE');
    return 'offline';
};

/**
 * Get human-readable network mode status
 */
export const getNetworkModeLabel = (mode: NetworkMode): string => {
    switch (mode) {
        case 'local':
            return '🏠 Local Connection';
        case 'cloud':
            return '☁️ Cloud Connection';
        case 'offline':
            return '🏠 Local Connection';
        default:
            return '❓ Unknown';
    }
};

/**
 * Get status color for network mode
 */
export const getNetworkModeColor = (mode: NetworkMode): string => {
    switch (mode) {
        case 'local':
            return '#4CAF50'; // Green
        case 'cloud':
            return '#2196F3'; // Blue
        case 'offline':
            return '#FFC107'; // Yellow (Local fallback)
        default:
            return '#9E9E9E'; // Gray
    }
};
