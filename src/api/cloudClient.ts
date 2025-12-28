/**
 * Cloud API Client
 * Handles API requests to the cloud backend for remote access
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLOUD_URL = 'http://35.209.239.164:8000'; // GCP Instance IP with Daphne port
const TOKEN_KEY = '@cloud_token';
const REFRESH_TOKEN_KEY = '@cloud_refresh_token';
const HOMES_KEY = '@cloud_homes';  // ⭐ Store accessible homes

// Create cloud API client
const cloudClient = axios.create({
    baseURL: `${CLOUD_URL}/api`,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
cloudClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`☁️ Cloud API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
});

// Response interceptor for token refresh
cloudClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try refreshing token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
                if (refreshToken) {
                    const response = await axios.post(`${CLOUD_URL}/api/auth/token/refresh/`, {
                        refresh: refreshToken
                    });

                    const { access } = response.data;
                    await AsyncStorage.setItem(TOKEN_KEY, access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return cloudClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens
                await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, HOMES_KEY]);
                throw refreshError;
            }
        }

        throw error;
    }
);

// Cloud API functions
export const cloudApi = {
    // Authentication
    login: async (email: string, password: string) => {
        const response = await cloudClient.post('/auth/login', { email, password });
        const { access, refresh, homes, user } = response.data;

        // Store tokens and homes
        await AsyncStorage.setItem(TOKEN_KEY, access);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
        await AsyncStorage.setItem(HOMES_KEY, JSON.stringify(homes));  // ⭐ Store homes

        console.log(`✅ Logged in as ${user.email}, accessible homes: ${homes.length}`);
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, HOMES_KEY]);
    },

    // Get stored homes (from JWT)
    getStoredHomes: async (): Promise<string[]> => {
        const homesJson = await AsyncStorage.getItem(HOMES_KEY);
        return homesJson ? JSON.parse(homesJson) : [];
    },

    // Pairing Code Management ⭐ NEW
    requestPairingCode: async (homeName?: string, expiryMinutes: number = 10) => {
        const response = await cloudClient.post('/gateways/request-pairing', {
            home_name: homeName || 'My Home',
            expiry_minutes: expiryMinutes
        });
        return response.data;  // { code, expires_at, message }
    },

    verifyPairingCode: async (code: string) => {
        const response = await cloudClient.get(`/gateways/verify-pairing/${code}`);
        return response.data;  // { valid, message }
    },

    // Gateway Management
    listGateways: async () => {
        const response = await cloudClient.get('/gateways/');
        return response.data;
    },

    // Gateway status
    getGatewayStatus: async (homeId: string) => {
        const response = await cloudClient.get(`/remote/homes/${homeId}/status`);
        return response.data;
    },

    // Entity control
    controlEntity: async (homeId: string, entityId: number, command: string, value?: any) => {
        const response = await cloudClient.post(
            `/remote/homes/${homeId}/entities/${entityId}/control`,
            { command, value }
        );
        return response.data;
    },

    // Scene execution
    runScene: async (homeId: string, sceneId: number) => {
        const response = await cloudClient.post(
            `/remote/homes/${homeId}/scenes/${sceneId}/run`
        );
        return response.data;
    },

    // Get homes (for selection)
    getHomes: async () => {
        const response = await cloudClient.get('/homes/');
        return response.data;
    },

    // Get user's gateways (to get UUID for cloud API)
    getGateways: async () => {
        const response = await cloudClient.get('/remote/gateways');
        return response.data;
    },

    // Get devices for a home (Cloud Synced)
    getDevices: async (homeId: string) => {
        const response = await cloudClient.get(`/homes/${homeId}/devices/`);
        return response.data;
    },

    // Get gateway UUID from AsyncStorage or fetch it
    getGatewayUuid: async (): Promise<string | null> => {
        try {
            // Try to get cached UUID
            const cached = await AsyncStorage.getItem('@gateway_uuid');
            if (cached) return cached;

            // Fetch from API
            const gateways = await cloudApi.getGateways();
            if (gateways && gateways.length > 0) {
                const uuid = gateways[0].home_id;  // Use first gateway
                await AsyncStorage.setItem('@gateway_uuid', uuid);
                return uuid;
            }
            return null;
        } catch (error) {
            console.error('Failed to get gateway UUID:', error);
            return null;
        }
    },
};

export { cloudClient };
