import axios from 'axios';
import { useServerConfigStore } from '../store/serverConfigStore';

// Create axios instance with dynamic baseURL
const apiClient = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to set baseURL dynamically from store
apiClient.interceptors.request.use((config) => {
    const baseUrl = useServerConfigStore.getState().getBaseUrl();

    console.log("🔍 Axios Interceptor - baseURL from store:", baseUrl);

    if (!baseUrl) {
        console.error("❌ ERROR: baseURL is empty! Server config not set.");
        console.error("Current store state:", useServerConfigStore.getState());
        throw new Error("Server not configured. Please set server IP.");
    }

    // Set baseURL ensuring proper path concatenation
    config.baseURL = baseUrl + '/api';

    // Ensure URL starts with / for proper concatenation
    if (config.url && !config.url.startsWith('/')) {
        config.url = '/' + config.url;
    }

    console.log("✅ Final request URL:", config.baseURL + config.url);

    return config;
}, (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
});

// Export the client
export { apiClient };
export default apiClient;

export const api = apiClient;

export const setAuthToken = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

export const controlEntity = async (entityId: number, command: any) => {
    const response = await apiClient.post(`/entities/${entityId}/control/`, command);
    return response.data;
};
