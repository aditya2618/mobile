import { create } from "zustand";
import { api } from "../api/client";
import { smartApi } from "../api/smartClient";
import { Scene } from "../types/models";

interface SceneState {
    scenes: Scene[];
    loading: boolean;

    // Actions
    loadScenes: (homeId: number) => Promise<void>;
    createScene: (homeId: number, name: string, actionsData: any[]) => Promise<Scene>;
    updateScene: (sceneId: number, name: string, actionsData: any[]) => Promise<Scene>;
    deleteScene: (sceneId: number) => Promise<void>;
    runScene: (sceneId: number) => Promise<void>;
}

export const useSceneStore = create<SceneState>((set, get) => ({
    scenes: [],
    loading: false,

    loadScenes: async (homeId) => {
        set({ loading: true });
        try {
            const scenes = await smartApi.getScenes(homeId);
            set({ scenes: scenes, loading: false });
        } catch (error) {
            console.error('Failed to load scenes:', error);
            set({ loading: false });
            // throw error; // Don't throw to prevent app crash in cloud mode
        }
    },

    createScene: async (homeId, name, actionsData) => {
        try {
            const res = await api.post(`/homes/${homeId}/scenes/`, {
                name,
                actions_data: actionsData
            });

            // Add new scene to list
            set(state => ({
                scenes: [...state.scenes, res.data]
            }));

            return res.data;
        } catch (error) {
            console.error('Failed to create scene:', error);
            throw error;
        }
    },

    updateScene: async (sceneId, name, actionsData) => {
        try {
            const res = await api.put(`/scenes/${sceneId}/`, {
                name,
                actions_data: actionsData
            });

            // Update scene in list
            set(state => ({
                scenes: state.scenes.map(s =>
                    s.id === sceneId ? res.data : s
                )
            }));

            return res.data;
        } catch (error) {
            console.error('Failed to update scene:', error);
            throw error;
        }
    },

    deleteScene: async (sceneId) => {
        try {
            console.log('Deleting scene:', sceneId);
            await api.delete(`/scenes/${sceneId}/`);
            console.log('Scene deleted successfully');

            // Remove scene from list
            set(state => ({
                scenes: state.scenes.filter(s => s.id !== sceneId)
            }));
        } catch (error) {
            console.error('Failed to delete scene:', error);
            throw error;
        }
    },

    runScene: async (sceneId) => {
        try {
            await api.post(`/scenes/${sceneId}/run/`);
        } catch (error) {
            console.error('Failed to run scene:', error);
            throw error;
        }
    },
}));
