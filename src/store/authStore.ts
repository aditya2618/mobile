import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "../api/client";
import { cloudApi } from "../api/cloudClient";
import { wsClient } from "../api/websocket";

interface AuthState {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginMode: 'local' | 'cloud';

    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    updateProfile: (email: string, firstName: string, lastName: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "@auth_token";
const AUTH_USER_KEY = "@auth_user";
const CLOUD_TOKEN_KEY = "@cloud_token";

// Helper function to initialize WebSocket connection
const initializeWebSocket = async (token: string) => {
    try {
        // Get first home ID from homeStore
        const { useHomeStore } = require("./homeStore");
        const homes = useHomeStore.getState().homes;

        if (homes && homes.length > 0) {
            const firstHome = homes[0];
            console.log(`🔌 Connecting WebSocket to home: ${firstHome.id}`);

            // Import deviceStore to handle WebSocket messages
            const { useDeviceStore } = require("./deviceStore");

            // Connect WebSocket
            wsClient.connect(token, firstHome.id, (data: any) => {
                console.log('📨 WebSocket message received:', data);

                // Handle different message types
                if (data.type === 'entity_state') {
                    useDeviceStore.getState().updateEntityState(data.entity_id, data.state);
                } else if (data.type === 'device_status') {
                    useDeviceStore.getState().updateDeviceStatus(data.device_id, data.is_online);
                }
            });

            console.log('✅ WebSocket connection initiated');
        } else {
            console.log('⚠️  No homes found, WebSocket not connected');
        }
    } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
    }
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start as loading to check for saved session
    loginMode: 'local',

    login: async (username, password) => {
        try {
            // Updated to handle email login input if user provides email
            const loginData = { username, password };
            // If username looks like email, handle accordingly if backend supports it
            // For now assuming backend takes username

            console.log('🔄 Attempting LOCAL login...');
            const res = await api.post("auth/login/", loginData);

            const token = res.data.token;
            const user = res.data.user;

            console.log('✅ Local login successful');

            // Save to AsyncStorage (Local)
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

            setAuthToken(token);
            set({
                token,
                user,
                isAuthenticated: true,
                loginMode: 'local'
            });

            // ⭐ Connect WebSocket after successful login
            await initializeWebSocket(token);

        } catch (localError) {
            console.log('⚠️ Local login failed, trying CLOUD login...');
            try {
                // Determine if input is email or username
                const isEmail = username.includes('@');
                const cloudRes = await cloudApi.login(
                    isEmail ? username : username, // Cloud API expects email mostly, but check cloudClient
                    password
                );

                // cloudClient.login returns response.data
                const { access, refresh, user } = cloudRes; // Assuming cloud returns user object too?
                // If cloud login response structure is different, we adjust. 
                // Typically cloud auth returns tokens. We might need to fetch profile.

                console.log('✅ Cloud login successful');

                // Save Cloud Token
                await AsyncStorage.setItem(CLOUD_TOKEN_KEY, access);
                // Also save as main auth token so app considers us logged in
                await AsyncStorage.setItem(AUTH_TOKEN_KEY, access);

                // If user object not in login response, might need separate fetch
                // For now, let's assume we get basic info or create a placeholder
                const cloudUser = user || { username, email: username, is_cloud: true };
                await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(cloudUser));

                setAuthToken(access); // Set it for client.ts too (though it might fail on local calls)
                set({
                    token: access,
                    user: cloudUser,
                    isAuthenticated: true,
                    loginMode: 'cloud'
                });

                // ⭐ Connect WebSocket for cloud mode too
                await initializeWebSocket(access);

            } catch (cloudError) {
                console.error('❌ Both Local and Cloud login failed');
                throw cloudError; // Throw the last error
            }
        }
    },

    register: async (username, email, password) => {
        // Register only supports local for now, OR we could make it try both?
        // Let's stick to local register for simple flow, or cloud?
        // User is likely on local network when setting up. 
        // If we want cloud registration:

        try {
            const res = await api.post("auth/register/", {
                username,
                email,
                password,
            });

            const token = res.data.token;
            const user = res.data.user;

            // Save to AsyncStorage
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

            setAuthToken(token);
            set({
                token,
                user,
                isAuthenticated: true,
            });
        } catch (error) {
            // Optional: fallback to cloud registration
            console.log('⚠️ Local register failed, try cloud?');
            // For now throw error to keep it simple
            throw error;
        }
    },

    updateProfile: async (email, firstName, lastName) => {
        const res = await api.put("auth/profile/", {
            email,
            first_name: firstName,
            last_name: lastName,
        });

        const user = res.data;

        // Update AsyncStorage
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

        set((state) => ({
            user,
        }));
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        await api.post("auth/change-password/", {
            current_password: currentPassword,
            new_password: newPassword,
        });
    },

    logout: async () => {
        // Clear AsyncStorage
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(AUTH_USER_KEY);

        // Clear auth token
        setAuthToken(null);

        // Clear all stores
        const { useHomeStore } = require("./homeStore");
        const { useDeviceStore } = require("./deviceStore");

        useHomeStore.getState().reset();
        useDeviceStore.getState().reset();

        // Clear auth state
        set({
            token: null,
            user: null,
            isAuthenticated: false,
        });
    },

    restoreSession: async () => {
        try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);

            if (token && userJson) {
                const user = JSON.parse(userJson);

                setAuthToken(token);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });

                console.log('✅ Session restored for user:', user.username);

                // ⭐ Reconnect WebSocket on session restore
                await initializeWebSocket(token);
            } else {
                set({ isLoading: false });
                console.log('ℹ️ No saved session found');
            }
        } catch (error) {
            console.error('Failed to restore session:', error);
            set({ isLoading: false });
        }
    },
}));
