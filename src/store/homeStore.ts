import { create } from "zustand";
import { api } from "../api/client";
import { Home } from "../types/models";

interface HomeState {
    homes: Home[];
    activeHome: Home | null;

    loadHomes: () => Promise<void>;
    setActiveHome: (home: Home) => void;
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

    setActiveHome: (home) => set({ activeHome: home }),
}));
