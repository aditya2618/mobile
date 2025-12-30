/**
 * Voice Command Screen
 * Real speech-to-text interface for controlling smart home devices
 * Uses @react-native-voice/voice for actual microphone input
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, PermissionsAndroid, ScrollView } from 'react-native';
import { Text, IconButton, Card, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useDeviceStore } from '../store/deviceStore';
import { useSceneStore } from '../store/sceneStore';
import { useHomeStore } from '../store/homeStore';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import {
    parseVoiceCommand,
    findMatchingEntity,
    findMatchingScene,
    getExampleCommands,
    ParsedCommand,
} from '../utils/voiceParser';

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
    const [partialTranscript, setPartialTranscript] = useState('');
    const [lastResult, setLastResult] = useState<CommandResult | null>(null);
    const [recentCommands, setRecentCommands] = useState<string[]>([]);
    const [isVoiceAvailable, setIsVoiceAvailable] = useState(true);

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

    // Initialize Voice recognition
    useEffect(() => {
        const setupVoice = async () => {
            try {
                // Set up Voice event listeners
                Voice.onSpeechStart = () => {
                    console.log('🎤 Speech started');
                    setVoiceState('listening');
                };

                Voice.onSpeechEnd = () => {
                    console.log('🎤 Speech ended');
                };

                Voice.onSpeechResults = (e: SpeechResultsEvent) => {
                    console.log('🎤 Speech results:', e.value);
                    if (e.value && e.value.length > 0) {
                        const spokenText = e.value[0];
                        setTranscript(spokenText);
                        processCommand(spokenText);
                    }
                };

                Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
                    if (e.value && e.value.length > 0) {
                        setPartialTranscript(e.value[0]);
                    }
                };

                Voice.onSpeechError = (e: SpeechErrorEvent) => {
                    console.error('🎤 Speech error:', e.error);
                    setVoiceState('error');
                    setLastResult({
                        success: false,
                        message: getErrorMessage(e.error),
                    });
                    setTimeout(() => setVoiceState('idle'), 2000);
                };

                // Check if voice is available
                const available = await Voice.isAvailable();
                setIsVoiceAvailable(available === 1 || available === true);
                console.log('🎤 Voice available:', available);
            } catch (error) {
                console.error('Voice setup error:', error);
                setIsVoiceAvailable(false);
            }
        };

        setupVoice();

        // Cleanup
        return () => {
            Voice.destroy().then(Voice.removeAllListeners).catch(() => { });
        };
    }, []);

    const getErrorMessage = (error: any): string => {
        if (!error) return 'Unknown error';
        const code = error.code || error.message || '';
        if (code.includes('7') || code.includes('no_match')) return 'No speech detected. Try again.';
        if (code.includes('9') || code.includes('insufficient')) return 'Permission denied';
        if (code.includes('network')) return 'Network error';
        return `Voice error: ${code}`;
    };

    // Request microphone permission (Android)
    const requestMicrophonePermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'Voice Control needs access to your microphone to hear your commands.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.error('Permission error:', err);
                return false;
            }
        }
        return true; // iOS handles permissions differently
    };

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

    // Start voice recognition
    const startListening = async () => {
        // Check permission first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Please grant microphone permission to use voice commands.');
            return;
        }

        if (!isVoiceAvailable) {
            Alert.alert('Voice Not Available', 'Speech recognition is not available on this device.');
            return;
        }

        try {
            setVoiceState('listening');
            setTranscript('');
            setPartialTranscript('');
            setLastResult(null);

            await Voice.start('en-US');
            console.log('🎤 Voice recognition started');
        } catch (error: any) {
            console.error('🎤 Failed to start voice:', error);
            setVoiceState('error');
            setLastResult({
                success: false,
                message: 'Failed to start voice recognition',
            });
            setTimeout(() => setVoiceState('idle'), 2000);
        }
    };

    // Stop voice recognition
    const stopListening = async () => {
        try {
            await Voice.stop();
            console.log('🎤 Voice recognition stopped');
        } catch (error) {
            console.error('🎤 Failed to stop voice:', error);
        }
    };

    const processCommand = async (spokenText: string) => {
        setPartialTranscript('');
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

    const getStatusText = () => {
        switch (voiceState) {
            case 'idle': return 'Tap the microphone and speak';
            case 'listening': return partialTranscript || '🎙️ Listening...';
            case 'processing': return 'Processing...';
            case 'success': return lastResult?.message || 'Success!';
            case 'error': return lastResult?.message || 'Error occurred';
            default: return '';
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

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Main Content */}
                    <View style={styles.content}>
                        {/* Status Text */}
                        <Text variant="titleMedium" style={[styles.statusText, { color: voiceState === 'listening' ? getStateColor() : theme.textSecondary }]}>
                            {getStatusText()}
                        </Text>

                        {/* Transcript Display */}
                        {transcript && voiceState !== 'listening' && (
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
                                    transform: [{ scale: voiceState === 'listening' ? 1.1 : 1 }],
                                }
                            ]}
                            onPress={voiceState === 'listening' ? stopListening : startListening}
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
                            {voiceState === 'idle' && 'Try: "Turn on fan" or "Run movie scene"'}
                            {voiceState === 'listening' && 'Tap again to stop'}
                        </Text>
                    </View>

                    {/* Example Commands */}
                    <View style={styles.examples}>
                        <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                            Quick Commands
                        </Text>
                        {getExampleCommands().map((cmd, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.exampleChip, { backgroundColor: theme.primary + '15' }]}
                                onPress={() => {
                                    setTranscript(cmd);
                                    processCommand(cmd);
                                }}
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
                                    onPress={() => {
                                        setTranscript(cmd);
                                        processCommand(cmd);
                                    }}
                                >
                                    <Text style={{ color: theme.textSecondary, fontSize: 14, paddingVertical: 4 }}>
                                        • {cmd}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    statusText: {
        textAlign: 'center',
        marginBottom: 20,
        minHeight: 30,
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
