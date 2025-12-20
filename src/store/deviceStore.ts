import { create } from "zustand";
import { api, controlEntity as apiControlEntity } from "../api/client";
import { Device } from "../types/models";

interface DeviceState {
    devices: Device[];
    loadDevices: (homeId: number) => Promise<void>;
    updateEntityState: (entityId: number, state: any) => void;
    updateDeviceStatus: (deviceId: number, isOnline: boolean) => void;
    controlEntity: (entityId: number, command: any) => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
    devices: [],

    loadDevices: async (homeId) => {
        console.log('📥 Loading devices for home:', homeId);
        const res = await api.get(`homes/${homeId}/devices/`);
        console.log('📥 Devices loaded:', res.data.length, 'devices');
        set({ devices: res.data });
    },

    updateEntityState: (entityId, state) =>
        set((s) => ({
            devices: s.devices.map((d) => ({
                ...d,
                entities: d.entities.map((e) =>
                    e.id === entityId ? { ...e, state } : e
                ),
            })),
        })),

    updateDeviceStatus: (deviceId, isOnline) =>
        set((s) => ({
            devices: s.devices.map((d) =>
                d.id === deviceId ? { ...d, is_online: isOnline } : d
            ),
        })),

    controlEntity: async (entityId, command) => {
        try {
            // Optimistic update - immediately update UI
            console.log('⚡ Optimistic update for entity:', entityId, command);
            set((s) => ({
                devices: s.devices.map((d) => ({
                    ...d,
                    entities: d.entities.map((e) =>
                        e.id === entityId
                            ? { ...e, state: { ...e.state, ...command } } // Merge instead of replace
                            : e
                    ),
                })),
            }));

            await apiControlEntity(entityId, command);
            // WebSocket will update with actual state from device
        } catch (error) {
            console.error('Control failed:', error);
            // Revert optimistic update on error
            throw error;
        }
    },

    reset: () => set({ devices: [] }),
}));
