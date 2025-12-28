/**
 * Home Selection Store
 * Manages selected home and available homes
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Home {
    id: number;
    name: string;
    identifier: string;
}

interface HomeState {
    selectedHome: Home | null;
    homes: Home[];
    loading: boolean;

    setSelectedHome: (home: Home) => Promise<void>;
    loadSelectedHome: () => Promise<void>;
    loadHomes: () => Promise<void>;
    setHomes: (homes: Home[]) => void;
    clearSelectedHome: () => Promise<void>;
    createHome: (name: string) => Promise<void>;
}

const SELECTED_HOME_KEY = '@selected_home';

export const useHomeStore = create<HomeState>((set, get) => ({
    selectedHome: null,
    homes: [],
    loading: true,

    createHome: async (name: string) => {
        try {
            const { apiClient } = require('../api/client');
            const response = await apiClient.post('/homes/', { name });
            const newHome = response.data;
            console.log(`✅ Created home: ${newHome.name}`);

            // Add to homes list
            const { homes } = get();
            set({ homes: [...homes, newHome] });

            // Select it if it's the first one
            if (homes.length === 0) {
                await get().setSelectedHome(newHome);
            }
        } catch (error) {
            console.error('Failed to create home:', error);
            throw error;
        }
    },

    setSelectedHome: async (home: Home) => {
        await AsyncStorage.setItem(SELECTED_HOME_KEY, JSON.stringify(home));
        set({ selectedHome: home });
        console.log(`✅ Selected home: ${home.name} (ID: ${home.id})`);
    },

    loadSelectedHome: async () => {
        try {
            const homeJson = await AsyncStorage.getItem(SELECTED_HOME_KEY);
            if (homeJson) {
                const home = JSON.parse(homeJson);
                set({ selectedHome: home, loading: false });
                console.log(`✅ Loaded selected home: ${home.name}`);
            } else {
                set({ loading: false });
                console.log('⚠️ No selected home found');
            }
        } catch (error) {
            console.error('Failed to load selected home:', error);
            set({ loading: false });
        }
    },

    loadHomes: async () => {
        try {
            const { apiClient } = require('../api/client');
            const response = await apiClient.get('/homes/');
            const homes = response.data;
            set({ homes });
            console.log(`✅ Loaded ${homes.length} homes`);
        } catch (error) {
            console.error('Error loading homes:', error);
            set({ homes: [] });
        }
    },

    setHomes: (homes: Home[]) => {
        set({ homes });
    },

    clearSelectedHome: async () => {
        await AsyncStorage.removeItem(SELECTED_HOME_KEY);
        set({ selectedHome: null });
        console.log('✅ Cleared selected home');
    },
}));
