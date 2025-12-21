import { create } from 'zustand';
import { api } from '../api/client';

interface EnergyData {
    today: {
        date: string;
        total_kwh: number;
        total_cost: number;
        top_consumers: Array<{
            entity__id: number;
            entity__name: string;
            estimated_kwh: number;
            estimated_cost: number;
            on_duration_seconds: number;
        }>;
    };
}

interface EnergyHistory {
    date: string;
    kwh: number;
    cost: number;
}

interface EnergySettings {
    electricity_rate: number;
    currency: string;
}

interface EnergyStore {
    energyData: EnergyData | null;
    history: EnergyHistory[];
    settings: EnergySettings | null;
    loading: boolean;

    loadEnergyData: (homeId: number) => Promise<void>;
    loadHistory: (homeId: number, days?: number) => Promise<void>;
    loadSettings: () => Promise<void>;
    updateSettings: (rate: number, currency: string) => Promise<void>;
}

export const useEnergyStore = create<EnergyStore>((set) => ({
    energyData: null,
    history: [],
    settings: null,
    loading: false,

    loadEnergyData: async (homeId: number) => {
        set({ loading: true });
        try {
            console.log('📊 Loading energy data for home:', homeId);
            const response = await api.get(`/energy/?home=${homeId}`);
            console.log('✅ Energy data loaded:', response.data);
            set({ energyData: response.data, loading: false });
        } catch (error) {
            console.error('❌ Failed to load energy data:', error);
            set({ loading: false });
        }
    },

    loadHistory: async (homeId: number, days: number = 7) => {
        try {
            console.log(`📈 Loading ${days} days of energy history`);
            const response = await api.get(`/energy/history/?home=${homeId}&days=${days}`);
            console.log('✅ Energy history loaded:', response.data);
            set({ history: response.data.history });
        } catch (error) {
            console.error('❌ Failed to load energy history:', error);
        }
    },

    loadSettings: async () => {
        try {
            const response = await api.get('/energy/settings/');
            console.log('✅ Energy settings loaded:', response.data);
            set({ settings: response.data });
        } catch (error) {
            console.error('❌ Failed to load energy settings:', error);
        }
    },

    updateSettings: async (rate: number, currency: string) => {
        try {
            const response = await api.put('/energy/settings/', {
                electricity_rate: rate,
                currency: currency,
            });
            console.log('✅ Energy settings updated:', response.data);
            set({ settings: response.data });
        } catch (error) {
            console.error('❌ Failed to update energy settings:', error);
        }
    },
}));
