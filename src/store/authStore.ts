import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "../api/client";

interface AuthState {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    updateProfile: (email: string, firstName: string, lastName: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "@auth_token";
const AUTH_USER_KEY = "@auth_user";

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start as loading to check for saved session

    login: async (username, password) => {
        const res = await api.post("auth/login/", {
            username,
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
    },

    register: async (username, email, password) => {
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
