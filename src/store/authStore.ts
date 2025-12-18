import { create } from "zustand";
import { api, setAuthToken } from "../api/client";

interface AuthState {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;

    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,

    login: async (username, password) => {
        const res = await api.post("auth/login/", {
            username,
            password,
        });

        const token = res.data.token;

        setAuthToken(token);
        set({
            token,
            isAuthenticated: true,
        });
    },

    logout: () => {
        setAuthToken(null);
        set({
            token: null,
            user: null,
            isAuthenticated: false,
        });
    },
}));
