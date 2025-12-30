/**
 * NFC Service
 * Handles NFC tag reading and writing for scene activation
 * 
 * Requires: react-native-nfc-manager
 * Install: npm install react-native-nfc-manager
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// NFC Tag Mapping stored locally
const NFC_MAPPINGS_KEY = '@nfc_scene_mappings';

export interface NFCTagMapping {
    tagId: string;           // Unique NFC tag ID
    sceneId: number;         // Scene to activate
    sceneName: string;       // For display
    createdAt: string;       // ISO timestamp
    lastUsed?: string;       // Last triggered
}

export interface NFCWriteData {
    type: 'scene';
    sceneId: number;
    sceneName: string;
    homeId: number;
}

// Check if NFC is available
let NfcManager: any = null;
let Ndef: any = null;
let isNfcAvailable = false;

// Try to load NFC manager (will fail in Expo Go)
try {
    const nfcModule = require('react-native-nfc-manager');
    NfcManager = nfcModule.default;
    Ndef = nfcModule.Ndef;
    isNfcAvailable = true;
} catch (e) {
    console.log('📱 NFC module not available (Expo Go mode)');
    isNfcAvailable = false;
}

class NFCService {
    private initialized = false;
    private isSupported = false;

    /**
     * Initialize NFC
     */
    async initialize(): Promise<boolean> {
        if (!isNfcAvailable) {
            console.log('📱 NFC not available in this build');
            return false;
        }

        try {
            const supported = await NfcManager.isSupported();
            if (supported) {
                await NfcManager.start();
                this.isSupported = true;
                this.initialized = true;
                console.log('✅ NFC initialized successfully');
                return true;
            }
        } catch (error) {
            console.error('❌ NFC initialization failed:', error);
        }
        return false;
    }

    /**
     * Check if NFC is available
     */
    isAvailable(): boolean {
        return isNfcAvailable && this.isSupported;
    }

    /**
     * Read an NFC tag
     */
    async readTag(): Promise<{ tagId: string; data?: NFCWriteData } | null> {
        if (!this.isSupported) {
            throw new Error('NFC not supported on this device');
        }

        try {
            await NfcManager.requestTechnology('Ndef');
            const tag = await NfcManager.getTag();

            if (!tag) {
                return null;
            }

            const tagId = tag.id;
            let data: NFCWriteData | undefined;

            // Try to read NDEF message
            if (tag.ndefMessage && tag.ndefMessage.length > 0) {
                const record = tag.ndefMessage[0];
                const payload = Ndef.text.decodePayload(new Uint8Array(record.payload));

                try {
                    data = JSON.parse(payload);
                } catch (e) {
                    console.log('Tag contains non-JSON data:', payload);
                }
            }

            return { tagId, data };
        } catch (error: any) {
            if (error.message !== 'cancelled') {
                console.error('NFC read error:', error);
            }
            throw error;
        } finally {
            await NfcManager.cancelTechnologyRequest();
        }
    }

    /**
     * Write scene data to an NFC tag
     */
    async writeTag(data: NFCWriteData): Promise<string> {
        if (!this.isSupported) {
            throw new Error('NFC not supported on this device');
        }

        try {
            await NfcManager.requestTechnology('Ndef');

            const tag = await NfcManager.getTag();
            if (!tag) {
                throw new Error('No tag found');
            }

            const tagId = tag.id;
            const jsonData = JSON.stringify(data);
            const bytes = Ndef.encodeMessage([Ndef.textRecord(jsonData)]);

            await NfcManager.ndefHandler.writeNdefMessage(bytes);
            console.log('✅ NFC tag written successfully');

            // Save mapping locally
            await this.saveMapping({
                tagId,
                sceneId: data.sceneId,
                sceneName: data.sceneName,
                createdAt: new Date().toISOString(),
            });

            return tagId;
        } catch (error: any) {
            if (error.message !== 'cancelled') {
                console.error('NFC write error:', error);
            }
            throw error;
        } finally {
            await NfcManager.cancelTechnologyRequest();
        }
    }

    /**
     * Cancel any ongoing NFC operation
     */
    async cancelOperation(): Promise<void> {
        if (this.isSupported) {
            try {
                await NfcManager.cancelTechnologyRequest();
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Save a tag-to-scene mapping
     */
    async saveMapping(mapping: NFCTagMapping): Promise<void> {
        const mappings = await this.getMappings();

        // Update existing or add new
        const existingIndex = mappings.findIndex(m => m.tagId === mapping.tagId);
        if (existingIndex >= 0) {
            mappings[existingIndex] = mapping;
        } else {
            mappings.push(mapping);
        }

        await AsyncStorage.setItem(NFC_MAPPINGS_KEY, JSON.stringify(mappings));
    }

    /**
     * Get all tag mappings
     */
    async getMappings(): Promise<NFCTagMapping[]> {
        try {
            const data = await AsyncStorage.getItem(NFC_MAPPINGS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Delete a mapping
     */
    async deleteMapping(tagId: string): Promise<void> {
        const mappings = await this.getMappings();
        const filtered = mappings.filter(m => m.tagId !== tagId);
        await AsyncStorage.setItem(NFC_MAPPINGS_KEY, JSON.stringify(filtered));
    }

    /**
     * Find scene for a tag
     */
    async findSceneForTag(tagId: string): Promise<NFCTagMapping | null> {
        const mappings = await this.getMappings();
        return mappings.find(m => m.tagId === tagId) || null;
    }

    /**
     * Update last used timestamp
     */
    async updateLastUsed(tagId: string): Promise<void> {
        const mappings = await this.getMappings();
        const mapping = mappings.find(m => m.tagId === tagId);
        if (mapping) {
            mapping.lastUsed = new Date().toISOString();
            await AsyncStorage.setItem(NFC_MAPPINGS_KEY, JSON.stringify(mappings));
        }
    }

    /**
     * Cleanup
     */
    async cleanup(): Promise<void> {
        if (this.isSupported) {
            await NfcManager.cancelTechnologyRequest();
        }
    }
}

// Export singleton
export const nfcService = new NFCService();
