import { create } from "zustand";
import { api } from "../api/client";
import { Automation } from "../types/models";

interface AutomationState {
    automations: Automation[];
    loadAutomations: (homeId: number) => Promise<void>;
    createAutomation: (homeId: number, name: string, triggersData: any[], actionsData: any[]) => Promise<void>;
    updateAutomation: (id: number, name: string, triggersData: any[], actionsData: any[]) => Promise<void>;
    deleteAutomation: (id: number) => Promise<void>;
    toggleAutomation: (id: number) => Promise<void>;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
    automations: [],

    loadAutomations: async (homeId) => {
        console.log('📥 Loading automations for home:', homeId);
        const res = await api.get(`homes/${homeId}/automations/`);
        console.log('📥 Automations loaded:', res.data.length, 'automations');
        set({ automations: res.data });
    },

    createAutomation: async (homeId, name, triggersData, actionsData) => {
        console.log('➕ Creating automation:', name);
        const res = await api.post(`homes/${homeId}/automations/`, {
            name,
            enabled: true,
            triggers_data: triggersData,
            actions_data: actionsData
        });
        console.log('✅ Automation created:', res.data);

        // Reload automations
        await get().loadAutomations(homeId);
    },

    updateAutomation: async (id, name, triggersData, actionsData) => {
        console.log('✏️ Updating automation:', id);
        const res = await api.put(`automations/${id}/`, {
            name,
            triggers_data: triggersData,
            actions_data: actionsData
        });
        console.log('✅ Automation updated:', res.data);

        // Update in state
        set((state) => ({
            automations: state.automations.map((a) =>
                a.id === id ? res.data : a
            ),
        }));
    },

    deleteAutomation: async (id) => {
        console.log('🗑️ Deleting automation:', id);
        await api.delete(`automations/${id}/`);
        console.log('✅ Automation deleted');

        // Remove from state
        set((state) => ({
            automations: state.automations.filter((a) => a.id !== id),
        }));
    },

    toggleAutomation: async (id) => {
        console.log('🔄 Toggling automation:', id);
        const res = await api.post(`automations/${id}/toggle/`);
        console.log('✅ Automation toggled:', res.data);

        // Update in state
        set((state) => ({
            automations: state.automations.map((a) =>
                a.id === id ? { ...a, enabled: res.data.enabled } : a
            ),
        }));
    },
}));
