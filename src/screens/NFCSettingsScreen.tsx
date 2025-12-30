/**
 * NFC Settings Screen
 * Manage NFC tags for scene activation
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, IconButton, Divider, Modal, Portal, RadioButton, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSceneStore } from '../store/sceneStore';
import { useHomeStore } from '../store/homeStore';
import { nfcService, NFCTagMapping, NFCWriteData } from '../services/nfcService';

type NFCMode = 'idle' | 'reading' | 'writing' | 'scanning';

export default function NFCSettingsScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const scenes = useSceneStore((s) => s.scenes);
    const runScene = useSceneStore((s) => s.runScene);
    const selectedHome = useHomeStore((s) => s.selectedHome);

    const [nfcAvailable, setNfcAvailable] = useState(false);
    const [nfcMode, setNfcMode] = useState<NFCMode>('idle');
    const [mappings, setMappings] = useState<NFCTagMapping[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    // Initialize NFC
    useEffect(() => {
        const init = async () => {
            const available = await nfcService.initialize();
            setNfcAvailable(available);
            loadMappings();
        };
        init();

        return () => {
            nfcService.cleanup();
        };
    }, []);

    // Reload mappings when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadMappings();
        }, [])
    );

    const loadMappings = async () => {
        const data = await nfcService.getMappings();
        setMappings(data);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadMappings();
        setRefreshing(false);
    };

    // Scan for NFC tag and run scene
    const handleScanAndRun = async () => {
        if (!nfcAvailable) {
            Alert.alert(
                'NFC Not Available',
                'NFC requires a development build. Install react-native-nfc-manager and rebuild the app.',
                [{ text: 'OK' }]
            );
            return;
        }

        setNfcMode('scanning');
        try {
            const result = await nfcService.readTag();

            if (result) {
                // First check if tag has scene data written to it
                if (result.data && result.data.type === 'scene') {
                    await executeScene(result.data.sceneId, result.data.sceneName);
                    await nfcService.updateLastUsed(result.tagId);
                } else {
                    // Check local mapping
                    const mapping = await nfcService.findSceneForTag(result.tagId);
                    if (mapping) {
                        await executeScene(mapping.sceneId, mapping.sceneName);
                        await nfcService.updateLastUsed(result.tagId);
                    } else {
                        Alert.alert(
                            'Unknown Tag',
                            `Tag ID: ${result.tagId}\n\nThis tag is not assigned to any scene. Would you like to assign it now?`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Assign', onPress: () => handleWriteToTag() }
                            ]
                        );
                    }
                }
            }
        } catch (error: any) {
            if (error.message !== 'cancelled') {
                Alert.alert('Scan Error', error.message);
            }
        } finally {
            setNfcMode('idle');
            loadMappings();
        }
    };

    const executeScene = async (sceneId: number, sceneName: string) => {
        try {
            await runScene(sceneId);
            Alert.alert('✅ Scene Activated', `"${sceneName}" has been executed!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to run scene');
        }
    };

    // Write scene to NFC tag
    const handleWriteToTag = () => {
        if (!nfcAvailable) {
            Alert.alert(
                'NFC Not Available',
                'NFC requires a development build with react-native-nfc-manager.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (scenes.length === 0) {
            Alert.alert('No Scenes', 'Create a scene first before assigning to NFC tag.');
            return;
        }

        setShowWriteModal(true);
    };

    const confirmWriteToTag = async () => {
        if (!selectedSceneId || !selectedHome) {
            Alert.alert('Error', 'Please select a scene');
            return;
        }

        const scene = scenes.find(s => s.id === selectedSceneId);
        if (!scene) return;

        setShowWriteModal(false);
        setNfcMode('writing');

        try {
            const writeData: NFCWriteData = {
                type: 'scene',
                sceneId: scene.id,
                sceneName: scene.name,
                homeId: selectedHome.id,
            };

            Alert.alert(
                'Place Tag',
                'Hold your phone near the NFC tag to write...',
                [{ text: 'Cancel', onPress: () => nfcService.cancelOperation() }]
            );

            const tagId = await nfcService.writeTag(writeData);
            Alert.alert(
                '✅ Tag Written!',
                `Tag is now linked to "${scene.name}"\n\nTag ID: ${tagId}`,
                [{ text: 'OK' }]
            );
            loadMappings();
        } catch (error: any) {
            if (error.message !== 'cancelled') {
                Alert.alert('Write Failed', error.message);
            }
        } finally {
            setNfcMode('idle');
            setSelectedSceneId(null);
        }
    };

    const handleDeleteMapping = (tagId: string, sceneName: string) => {
        Alert.alert(
            'Delete Mapping',
            `Remove "${sceneName}" from this tag?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await nfcService.deleteMapping(tagId);
                        loadMappings();
                    }
                }
            ]
        );
    };

    const formatDate = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        iconColor={theme.text}
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                        NFC Tags
                    </Text>
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    {/* Status Card */}
                    <Card style={[styles.card, { backgroundColor: nfcAvailable ? '#4CAF50' : '#FF9800' }]}>
                        <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconButton
                                icon={nfcAvailable ? 'nfc' : 'alert'}
                                size={28}
                                iconColor="#FFFFFF"
                            />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text variant="titleMedium" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                    {nfcAvailable ? 'NFC Ready' : 'NFC Not Available'}
                                </Text>
                                <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {nfcAvailable
                                        ? 'Tap a tag to activate scenes instantly'
                                        : 'Requires development build with native NFC module'
                                    }
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            icon="nfc"
                            onPress={handleScanAndRun}
                            loading={nfcMode === 'scanning'}
                            disabled={nfcMode !== 'idle'}
                            buttonColor={theme.primary}
                            style={{ flex: 1, marginRight: 8 }}
                        >
                            Scan Tag
                        </Button>
                        <Button
                            mode="outlined"
                            icon="pencil"
                            onPress={handleWriteToTag}
                            loading={nfcMode === 'writing'}
                            disabled={nfcMode !== 'idle'}
                            textColor={theme.primary}
                            style={{ flex: 1, marginLeft: 8 }}
                        >
                            Write Tag
                        </Button>
                    </View>

                    {/* How it Works */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                                💡 How to Use
                            </Text>
                            <View style={styles.stepRow}>
                                <Text style={{ fontSize: 20, marginRight: 12 }}>1️⃣</Text>
                                <Text style={{ color: theme.textSecondary, flex: 1 }}>
                                    Tap "Write Tag" and select a scene
                                </Text>
                            </View>
                            <View style={styles.stepRow}>
                                <Text style={{ fontSize: 20, marginRight: 12 }}>2️⃣</Text>
                                <Text style={{ color: theme.textSecondary, flex: 1 }}>
                                    Hold your phone near an NFC tag to write
                                </Text>
                            </View>
                            <View style={styles.stepRow}>
                                <Text style={{ fontSize: 20, marginRight: 12 }}>3️⃣</Text>
                                <Text style={{ color: theme.textSecondary, flex: 1 }}>
                                    Place the tag anywhere (bedside, door, etc.)
                                </Text>
                            </View>
                            <View style={styles.stepRow}>
                                <Text style={{ fontSize: 20, marginRight: 12 }}>4️⃣</Text>
                                <Text style={{ color: theme.textSecondary, flex: 1 }}>
                                    Tap your phone on the tag to instantly run the scene!
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Saved Mappings */}
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                            Saved Tags ({mappings.length})
                        </Text>

                        {mappings.length === 0 ? (
                            <Card style={[styles.card, { backgroundColor: cardBg }]}>
                                <Card.Content style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <Text style={{ fontSize: 40, marginBottom: 12 }}>🏷️</Text>
                                    <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                                        No NFC tags configured yet.{'\n'}
                                        Tap "Write Tag" to get started!
                                    </Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            mappings.map((mapping, index) => (
                                <Card
                                    key={mapping.tagId}
                                    style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}
                                >
                                    <Card.Content>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconButton icon="nfc" size={24} iconColor={theme.primary} />
                                            <View style={{ flex: 1, marginLeft: 4 }}>
                                                <Text variant="titleSmall" style={{ color: theme.text, fontWeight: '600' }}>
                                                    {mapping.sceneName}
                                                </Text>
                                                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                    Tag: {mapping.tagId.substring(0, 16)}...
                                                </Text>
                                                {mapping.lastUsed && (
                                                    <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                        Last used: {formatDate(mapping.lastUsed)}
                                                    </Text>
                                                )}
                                            </View>
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                iconColor={theme.error}
                                                onPress={() => handleDeleteMapping(mapping.tagId, mapping.sceneName)}
                                            />
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Write Modal */}
                <Portal>
                    <Modal
                        visible={showWriteModal}
                        onDismiss={() => setShowWriteModal(false)}
                        contentContainerStyle={[styles.modal, { backgroundColor: cardBg }]}
                    >
                        <Text variant="titleLarge" style={{ color: theme.text, marginBottom: 16, fontWeight: '600' }}>
                            Select Scene for Tag
                        </Text>

                        <ScrollView style={{ maxHeight: 300 }}>
                            <RadioButton.Group
                                value={selectedSceneId?.toString() || ''}
                                onValueChange={(value) => setSelectedSceneId(parseInt(value))}
                            >
                                {scenes.map((scene) => (
                                    <RadioButton.Item
                                        key={scene.id}
                                        label={scene.name}
                                        value={scene.id.toString()}
                                        labelStyle={{ color: theme.text }}
                                    />
                                ))}
                            </RadioButton.Group>
                        </ScrollView>

                        <View style={{ flexDirection: 'row', marginTop: 20 }}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowWriteModal(false)}
                                style={{ flex: 1, marginRight: 8 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={confirmWriteToTag}
                                disabled={!selectedSceneId}
                                buttonColor={theme.primary}
                                style={{ flex: 1, marginLeft: 8 }}
                            >
                                Write to Tag
                            </Button>
                        </View>
                    </Modal>
                </Portal>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 50,
        paddingBottom: 12,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    actions: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    section: {
        marginTop: 8,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modal: {
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },
});
