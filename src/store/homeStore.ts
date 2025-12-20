import { create } from "zustand";
import { api } from "../api/client";
import { Home } from "../types/models";

interface HomeState {
    homes: Home[];
    activeHome: Home | null;

    loadHomes: () => Promise<void>;
    createHome: (name: string) => Promise<void>;
    setActiveHome: (home: Home) => void;
    reset: () => void;
}

export const useHomeStore = create<HomeState>((set) => ({
    homes: [],
    activeHome: null,

    loadHomes: async () => {
        const res = await api.get("homes/");
        set({
            homes: res.data,
            activeHome: res.data[0] ?? null,
        });
    },

    createHome: async (name: string) => {
        const res = await api.post("homes/", { name });
        // Reload homes to get the new one
        const homesRes = await api.get("homes/");
        set({
            homes: homesRes.data,
            activeHome: res.data, // Set the newly created home as active
        });
    },

    setActiveHome: (home) => set({ activeHome: home }),

    reset: () => set({ homes: [], activeHome: null }),
}));
