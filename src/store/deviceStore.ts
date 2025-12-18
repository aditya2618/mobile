import { create } from "zustand";
import { api } from "../api/client";
import { Device } from "../types/models";

interface DeviceState {
    devices: Device[];
    loadDevices: (homeId: number) => Promise<void>;
    updateEntityState: (entityId: number, state: any) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
    devices: [],

    loadDevices: async (homeId) => {
        const res = await api.get(`homes/${homeId}/devices/`);
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
}));
