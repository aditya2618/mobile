import { DeviceEventEmitter, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showNotification } from './notificationService';
import { apiClient } from '../api/client';

const NFC_MAPPINGS_KEY = 'nfc_scene_mappings';

export interface NfcSceneMapping {
    tagId: string;
    sceneId: number;
    sceneName: string;
    homeId: number;
}

/**
 * Initialize background NFC listener
 * This listens for NFC tags scanned from native layer
 */
export const initBackgroundNfcListener = () => {
    if (Platform.OS !== 'android') {
        console.log('📱 NFC background triggering only supported on Android');
        return;
    }

    // Listen for NFC scans from native layer
    DeviceEventEmitter.addListener('nfcTagScanned', async (event) => {
        const { tagData } = event;
        console.log(' Background NFC scan detected:', tagData);

        try {
            // Parse scene ID from tag data
            const sceneData = parseSceneData(tagData);

            if (!sceneData) {
                console.warn('⚠️ Could not parse scene data from NFC tag');
                await showNotification({
                    title: 'NFC Error',
                    body: 'Tag data format not recognized',
                    icon: 'error',
                });
                return;
            }

            // Execute the scene
            console.log(`🎬 Executing scene ${sceneData.sceneId} from NFC tag`);
            await executeSceneFromTag(sceneData);

            // Show success notification
            await showNotification({
                title: 'Scene Activated',
                body: `"${sceneData.sceneName}" is now running`,
                icon: 'scene',
            });

            console.log(`✅ Scene "${sceneData.sceneName}" executed successfully`);
        } catch (error: any) {
            console.error('❌ Background NFC error:', error);

            // Show error notification
            await showNotification({
                title: 'Scene Activation Failed',
                body: error.message || 'Could not execute scene',
                icon: 'error',
            });
        }
    });

    console.log('📡 Background NFC listener initialized');
};

/**
 * Parse scene data from NFC tag payload
 */
const parseSceneData = (tagData: string): NfcSceneMapping | null => {
    try {
        // Try parsing as JSON
        const data = JSON.parse(tagData);

        if (data.sceneId && data.sceneName) {
            return {
                tagId: data.tagId || '',
                sceneId: data.sceneId,
                sceneName: data.sceneName,
                homeId: data.homeId || 0,
            };
        }
    } catch {
        // Not JSON, try other formats
    }

    // Try format: "scene:123:Scene Name"
    if (tagData.startsWith('scene:')) {
        const parts = tagData.split(':');
        if (parts.length >= 2) {
            const sceneId = parseInt(parts[1]);
            const sceneName = parts[2] || `Scene ${sceneId}`;

            return {
                tagId: '',
                sceneId,
                sceneName,
                homeId: 0,
            };
        }
    }

    return null;
};

/**
 * Execute scene via API
 */
const executeSceneFromTag = async (sceneData: NfcSceneMapping) => {
    try {
        // Call API to run scene
        const response = await apiClient.post(`/scenes/${sceneData.sceneId}/run/`);

        console.log(`📌 Scene API response:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`❌ Failed to execute scene ${sceneData.sceneId}:`, error);
        throw new Error('Could not connect to server. Check your network.');
    }
};

/**
 * Save NFC to scene mapping
 */
export const saveNfcMapping = async (mapping: NfcSceneMapping) => {
    try {
        const mappings = await getNfcMappings();
        const updated = [...mappings.filter((m) => m.tagId !== mapping.tagId), mapping];
        await AsyncStorage.setItem(NFC_MAPPINGS_KEY, JSON.stringify(updated));
        console.log(`💾 Saved NFC mapping: ${mapping.sceneName} (${mapping.sceneId})`);
        return true;
    } catch (error) {
        console.error('❌ Failed to save NFC mapping:', error);
        return false;
    }
};

/**
 * Get all NFC mappings
 */
export const getNfcMappings = async (): Promise<NfcSceneMapping[]> => {
    try {
        const data = await AsyncStorage.getItem(NFC_MAPPINGS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

/**
 * Remove NFC mapping
 */
export const removeNfcMapping = async (tagId: string) => {
    try {
        const mappings = await getNfcMappings();
        const updated = mappings.filter((m) => m.tagId !== tagId);
        await AsyncStorage.setItem(NFC_MAPPINGS_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('❌ Failed to remove NFC mapping:', error);
        return false;
    }
};

export default {
    initBackgroundNfcListener,
    saveNfcMapping,
    getNfcMappings,
    removeNfcMapping,
};
