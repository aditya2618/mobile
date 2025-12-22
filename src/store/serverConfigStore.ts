import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ServerConfigState {
    serverIp: string | null;
    serverPort: string;
    isConfigured: boolean;
    loading: boolean;

    setServerConfig: (ip: string, port: string) => Promise<void>;
    loadServerConfig: () => Promise<void>;
    clearServerConfig: () => Promise<void>;
    getBaseUrl: () => string;
    getWebSocketUrl: () => string;
}

const SERVER_IP_KEY = "@server_ip";
const SERVER_PORT_KEY = "@server_port";

export const useServerConfigStore = create<ServerConfigState>((set, get) => ({
    serverIp: null,
    serverPort: "8000",
    isConfigured: false,
    loading: true,

    setServerConfig: async (ip: string, port: string) => {
        // Save to AsyncStorage
        await AsyncStorage.setItem(SERVER_IP_KEY, ip);
        await AsyncStorage.setItem(SERVER_PORT_KEY, port);

        set({
            serverIp: ip,
            serverPort: port,
            isConfigured: true,
            loading: false,
        });

        console.log(`✅ Server config saved: ${ip}:${port}`);
    },

    loadServerConfig: async () => {
        try {
            const ip = await AsyncStorage.getItem(SERVER_IP_KEY);
            const port = await AsyncStorage.getItem(SERVER_PORT_KEY);

            if (ip) {
                set({
                    serverIp: ip,
                    serverPort: port || "8000",
                    isConfigured: true,
                    loading: false
                });
                console.log(`✅ Server config loaded: ${ip}:${port || "8000"}`);
            } else {
                set({ isConfigured: false, loading: false });
                console.log('⚠️  No server config found - user needs to configure');
            }
        } catch (error) {
            console.error('Failed to load server config:', error);
            set({ isConfigured: false, loading: false });
        }
    },

    clearServerConfig: async () => {
        try {
            await AsyncStorage.removeItem(SERVER_IP_KEY);
            await AsyncStorage.removeItem(SERVER_PORT_KEY);
            set({ serverIp: null, serverPort: '8000', isConfigured: false });
            console.log('✅ Server config cleared');
        } catch (error) {
            console.error('Failed to clear server config:', error);
        }
    },

    getBaseUrl: () => {
        const { serverIp, serverPort } = get();
        if (!serverIp) return '';
        return `http://${serverIp}:${serverPort}`;
    },

    getWebSocketUrl: () => {
        const { serverIp, serverPort } = get();
        if (!serverIp) return '';
        return `ws://${serverIp}:${serverPort}/ws`;
    },
}));
