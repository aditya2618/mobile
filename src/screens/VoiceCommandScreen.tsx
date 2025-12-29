/**
 * Voice Command Screen
 * Provides speech-to-text interface for controlling smart home devices
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, IconButton, Card, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDeviceStore } from '../store/deviceStore';
import { useSceneStore } from '../store/sceneStore';
import { useHomeStore } from '../store/homeStore';
import { smartApi } from '../api/smartClient';
import {
    parseVoiceCommand,
    findMatchingEntity,
    findMatchingScene,
    getExampleCommands,
    ParsedCommand,
} from '../utils/voiceParser';

// Note: For production, install @react-native-voice/voice
// For now, we'll use a mock/expo-speech approach

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface CommandResult {
    success: boolean;
    message: string;
    entityName?: string;
}

export default function VoiceCommandScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const devices = useDeviceStore((s) => s.devices);
    const controlEntity = useDeviceStore((s) => s.controlEntity);
    const scenes = useSceneStore((s) => s.scenes);
    const runScene = useSceneStore((s) => s.runScene);
    const selectedHome = useHomeStore((s) => s.selectedHome);

    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState('');
    const [lastResult, setLastResult] = useState<CommandResult | null>(null);
    const [recentCommands, setRecentCommands] = useState<string[]>([]);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';

    // Get all entities from devices
    const allEntities = devices.flatMap(device =>
        device.entities?.map(e => ({
            id: e.id,
            name: e.name,
            entity_type: e.entity_type,
            deviceName: device.name,
        })) || []
    );

    // Execute the parsed command
    const executeCommand = async (command: ParsedCommand): Promise<CommandResult> => {
        console.log('🎤 Executing command:', command);

        if (command.action === 'unknown') {
            return {
                success: false,
                message: `I didn't understand: "${command.raw}"`,
            };
        }

        // Handle scene commands
        if (command.action === 'scene') {
            const matchedScene = findMatchingScene(command.target, scenes);
            if (!matchedScene) {
                return {
                    success: false,
                    message: `Scene "${command.target}" not found`,
                };
            }

            try {
                await runScene(matchedScene.id);
                return {
                    success: true,
                    message: `Running ${matchedScene.name}`,
                    entityName: matchedScene.name,
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Failed to run scene',
                };
            }
        }

        // Handle device commands
        const matchedEntity = findMatchingEntity(command.target, allEntities);
        if (!matchedEntity) {
            return {
                success: false,
                message: `Device "${command.target}" not found`,
            };
        }

        try {
            let controlCommand: Record<string, any> = {};

            switch (command.action) {
                case 'on':
                    controlCommand = { power: true };
                    break;
                case 'off':
                    controlCommand = { power: false };
                    break;
                case 'brightness':
                    controlCommand = { power: true, brightness: command.value };
                    break;
                case 'speed':
                    controlCommand = { power: true, speed: command.value };
                    break;
            }

            await controlEntity(matchedEntity.id, controlCommand);

            const actionText = command.action === 'on' ? 'Turned on' :
                command.action === 'off' ? 'Turned off' :
                    command.action === 'brightness' ? `Set to ${command.value}%` :
                        command.action === 'speed' ? `Set speed to ${command.value}` : 'Controlled';

            return {
                success: true,
                message: `${actionText} ${matchedEntity.name}`,
                entityName: matchedEntity.name,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to control ${matchedEntity.name}`,
            };
        }
    };

    // Simulated voice recognition (for demo without native module)
    // In production, replace with @react-native-voice/voice
    const startListening = async () => {
        setVoiceState('listening');
        setTranscript('');
        setLastResult(null);

        // For demo: Show input dialog
        // In production: Use Voice.start()
        Alert.prompt(
            'Voice Command',
            'Type what you would say (demo mode)',
            [
                { text: 'Cancel', onPress: () => setVoiceState('idle'), style: 'cancel' },
                {
                    text: 'Execute',
                    onPress: async (text?: string) => {
                        if (text) {
                            await processCommand(text);
                        } else {
                            setVoiceState('idle');
                        }
                    },
                },
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const processCommand = async (spokenText: string) => {
        setTranscript(spokenText);
        setVoiceState('processing');

        // Parse the command
        const parsedCommand = parseVoiceCommand(spokenText);
        console.log('🎤 Parsed:', parsedCommand);

        // Execute it
        const result = await executeCommand(parsedCommand);
        setLastResult(result);
        setVoiceState(result.success ? 'success' : 'error');

        // Add to recent commands
        if (result.success) {
            setRecentCommands(prev => [spokenText, ...prev.slice(0, 4)]);
        }

        // Reset after delay
        setTimeout(() => {
            setVoiceState('idle');
        }, 3000);
    };

    const getStateColor = () => {
        switch (voiceState) {
            case 'listening': return '#2196F3';
            case 'processing': return '#FF9800';
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            default: return theme.primary;
        }
    };

    const getStateIcon = () => {
        switch (voiceState) {
            case 'listening': return 'microphone';
            case 'processing': return 'loading';
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            default: return 'microphone';
        }
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
                        Voice Control
                    </Text>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    {/* Status Text */}
                    <Text variant="titleMedium" style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }}>
                        {voiceState === 'idle' && 'Tap the microphone to speak'}
                        {voiceState === 'listening' && 'Listening...'}
                        {voiceState === 'processing' && 'Processing...'}
                        {voiceState === 'success' && lastResult?.message}
                        {voiceState === 'error' && lastResult?.message}
                    </Text>

                    {/* Transcript Display */}
                    {transcript && (
                        <Card style={[styles.transcriptCard, { backgroundColor: cardBg }]}>
                            <Card.Content>
                                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                    You said:
                                </Text>
                                <Text variant="titleMedium" style={{ color: theme.text, marginTop: 4 }}>
                                    "{transcript}"
                                </Text>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Microphone Button */}
                    <TouchableOpacity
                        style={[
                            styles.micButton,
                            {
                                backgroundColor: getStateColor() + '20',
                                borderColor: getStateColor(),
                            }
                        ]}
                        onPress={startListening}
                        disabled={voiceState === 'processing'}
                        activeOpacity={0.8}
                    >
                        {voiceState === 'processing' ? (
                            <ActivityIndicator size={60} color={getStateColor()} />
                        ) : (
                            <IconButton
                                icon={getStateIcon()}
                                size={60}
                                iconColor={getStateColor()}
                            />
                        )}
                    </TouchableOpacity>

                    {/* Hint Text */}
                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>
                        {voiceState === 'idle' ? 'Try saying: "Turn on fan"' : ''}
                    </Text>
                </View>

                {/* Example Commands */}
                <View style={styles.examples}>
                    <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                        Example Commands
                    </Text>
                    {getExampleCommands().map((cmd, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.exampleChip, { backgroundColor: theme.primary + '15' }]}
                            onPress={() => processCommand(cmd)}
                        >
                            <Text style={{ color: theme.primary, fontSize: 14 }}>
                                "{cmd}"
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Commands */}
                {recentCommands.length > 0 && (
                    <View style={styles.recent}>
                        <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 8, fontWeight: '600' }}>
                            Recent
                        </Text>
                        {recentCommands.map((cmd, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => processCommand(cmd)}
                            >
                                <Text style={{ color: theme.textSecondary, fontSize: 14, paddingVertical: 4 }}>
                                    • {cmd}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    transcriptCard: {
        width: '100%',
        maxWidth: 300,
        marginBottom: 30,
        borderRadius: 12,
    },
    micButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    examples: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    exampleChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 8,
    },
    recent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
});
