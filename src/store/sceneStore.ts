import { create } from "zustand";
import { api } from "../api/client";
import { Scene } from "../types/models";

interface SceneState {
    scenes: Scene[];
    loadScenes: (homeId: number) => Promise<void>;
    runScene: (sceneId: number) => Promise<void>;
}

export const useSceneStore = create<SceneState>((set) => ({
    scenes: [],

    loadScenes: async (homeId) => {
        const res = await api.get(`homes/${homeId}/scenes/`);
        set({ scenes: res.data });
    },

    runScene: async (sceneId) => {
        await api.post(`scenes/${sceneId}/run/`);
    },
}));
