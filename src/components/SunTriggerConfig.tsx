import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, TextInput, Button, IconButton } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

interface SunTriggerConfigProps {
    trigger: {
        sun_event?: string;
        sun_offset?: number;
    };
    onChange: (trigger: any) => void;
}

export default function SunTriggerConfig({ trigger, onChange }: SunTriggerConfigProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Safety check
    if (!theme) {
        return null;
    }

    const [event, setEvent] = useState(trigger.sun_event || 'sunrise');
    const [offset, setOffset] = useState(trigger.sun_offset || 0);

    const sunEvents = [
        { value: 'sunrise', label: '🌅 Sunrise', icon: 'weather-sunset-up' },
        { value: 'sunset', label: '🌇 Sunset', icon: 'weather-sunset-down' },
        { value: 'dawn', label: '🌄 Dawn', icon: 'weather-sunset-up' },
        { value: 'dusk', label: '🌆 Dusk', icon: 'weather-sunset-down' },
        { value: 'noon', label: '☀️ Noon', icon: 'white-balance-sunny' },
    ];

    const handleEventChange = (newEvent: string) => {
        setEvent(newEvent);
        onChange({
            ...trigger,
            trigger_type: 'sun',
            sun_event: newEvent,
            sun_offset: offset,
        });
    };

    const handleOffsetChange = (newOffset: number) => {
        setOffset(newOffset);
        onChange({
            ...trigger,
            trigger_type: 'sun',
            sun_event: event,
            sun_offset: newOffset,
        });
    };

    const adjustOffset = (delta: number) => {
        handleOffsetChange(offset + delta);
    };

    const getOffsetDescription = () => {
        if (offset === 0) return 'At exact event time';
        const absOffset = Math.abs(offset);
        const hours = Math.floor(absOffset / 60);
        const minutes = absOffset % 60;
        const timeStr = hours > 0
            ? `${hours}h ${minutes}m`
            : `${minutes}m`;
        return offset < 0
            ? `${timeStr} before ${event}`
            : `${timeStr} after ${event}`;
    };

    return (
        <View style={styles.container}>
            <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                🌞 Sun Event
            </Text>

            <View style={styles.eventGrid}>
                {sunEvents.map((sunEvent) => (
                    <Button
                        key={sunEvent.value}
                        mode={event === sunEvent.value ? 'contained' : 'outlined'}
                        onPress={() => handleEventChange(sunEvent.value)}
                        style={styles.eventButton}
                        buttonColor={event === sunEvent.value ? theme.primary : 'transparent'}
                        textColor={event === sunEvent.value ? '#fff' : theme.text}
                        icon={sunEvent.icon}
                    >
                        {sunEvent.label}
                    </Button>
                ))}
            </View>

            <Text variant="labelLarge" style={[styles.label, { color: theme.text, marginTop: 24 }]}>
                ⏱️ Time Offset
            </Text>

            <View style={styles.offsetContainer}>
                <IconButton
                    icon="minus-circle"
                    size={32}
                    iconColor={theme.primary}
                    onPress={() => adjustOffset(-15)}
                />

                <View style={styles.offsetInputContainer}>
                    <TextInput
                        mode="outlined"
                        value={offset.toString()}
                        onChangeText={(text) => {
                            const num = parseInt(text) || 0;
                            handleOffsetChange(num);
                        }}
                        keyboardType="numeric"
                        style={[styles.offsetInput, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}
                        theme={{
                            colors: {
                                onSurfaceVariant: theme.textSecondary,
                                outline: isDark ? theme.border : 'rgba(0,0,0,0.2)',
                                primary: theme.primary,
                            }
                        }}
                        textColor={theme.text}
                        right={<TextInput.Affix text="min" textStyle={{ color: theme.textSecondary }} />}
                    />
                </View>

                <IconButton
                    icon="plus-circle"
                    size={32}
                    iconColor={theme.primary}
                    onPress={() => adjustOffset(15)}
                />
            </View>

            <View style={styles.quickButtons}>
                <Button mode="outlined" onPress={() => handleOffsetChange(-60)} compact>
                    -1h
                </Button>
                <Button mode="outlined" onPress={() => handleOffsetChange(-30)} compact>
                    -30m
                </Button>
                <Button mode="outlined" onPress={() => handleOffsetChange(0)} compact>
                    Exact
                </Button>
                <Button mode="outlined" onPress={() => handleOffsetChange(30)} compact>
                    +30m
                </Button>
                <Button mode="outlined" onPress={() => handleOffsetChange(60)} compact>
                    +1h
                </Button>
            </View>

            <View style={[styles.descriptionBox, { backgroundColor: isDark ? theme.cardBackground : 'rgba(103, 80, 164, 0.1)' }]}>
                <Text variant="bodyMedium" style={{ color: theme.text, textAlign: 'center' }}>
                    {getOffsetDescription()}
                </Text>
            </View>

            <Text variant="bodySmall" style={[styles.hint, { color: theme.textSecondary }]}>
                💡 Negative values = before event, Positive = after event
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    label: {
        marginBottom: 12,
        fontWeight: '600',
    },
    eventGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    eventButton: {
        flex: 1,
        minWidth: '45%',
        marginBottom: 8,
    },
    offsetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    offsetInputContainer: {
        flex: 1,
        maxWidth: 150,
        marginHorizontal: 8,
    },
    offsetInput: {
        textAlign: 'center',
    },
    quickButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        gap: 4,
    },
    descriptionBox: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
    },
    hint: {
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
