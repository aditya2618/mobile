import { create } from "zustand";
import { api } from "../api/client";
import { smartApi } from "../api/smartClient";
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
        try {
            const devices = await smartApi.getDevices(homeId);
            console.log('📥 Devices loaded:', devices.length, 'devices');
            set({ devices });
        } catch (error) {
            console.error('Error loading devices:', error);
            // Don't clear devices on error to keep cache if available?
            // set({ devices: [] });
        }
    },

    updateEntityState: (entityId, state) => {
        console.log(`🔄 Store: Updating entity ${entityId} state:`, state);
        set((s) => ({
            devices: s.devices.map((d) => ({
                ...d,
                entities: d.entities.map((e) =>
                    e.id === entityId ? { ...e, state } : e
                ),
            })),
        }));
    },

    updateDeviceStatus: (deviceId, isOnline) => {
        console.log(`🔄 Store: Updating device ${deviceId} online status:`, isOnline);
        set((s) => ({
            devices: s.devices.map((d) =>
                d.id === deviceId ? { ...d, is_online: isOnline } : d
            ),
        }));
    },

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

            // Use smartApi which routes to cloud or local based on network mode
            // Refresh network mode first to ensure we use the right API
            await smartApi.refresh();
            const commandKey = Object.keys(command)[0];
            const commandValue = command[commandKey];
            await smartApi.controlEntity(entityId, commandKey, commandValue);
            // WebSocket will update with actual state from device
        } catch (error) {
            console.error('Control failed:', error);
            // Revert optimistic update on error
            throw error;
        }
    },

    reset: () => set({ devices: [] }),
}));
