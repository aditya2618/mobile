import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import TimeTriggerConfig from '../components/TimeTriggerConfig';
import SunTriggerConfig from '../components/SunTriggerConfig';

export default function TestTriggersScreen() {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const [timeTrigger, setTimeTrigger] = useState({
        time_of_day: '08:00',
        days_of_week: [0, 1, 2, 3, 4] // Weekdays
    });

    const [sunTrigger, setSunTrigger] = useState({
        sun_event: 'sunset',
        sun_offset: -30
    });

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
                <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
                    🧪 Test Time & Sun Triggers
                </Text>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Title title="⏰ Time Trigger" titleStyle={{ color: theme.text }} />
                    <Card.Content>
                        <TimeTriggerConfig
                            trigger={timeTrigger}
                            onChange={setTimeTrigger}
                        />

                        <Divider style={{ marginVertical: 16 }} />

                        <Text variant="labelSmall" style={{ color: theme.textSecondary }}>
                            Output:
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.text, fontFamily: 'monospace' }}>
                            {JSON.stringify(timeTrigger, null, 2)}
                        </Text>
                    </Card.Content>
                </Card>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Title title="🌞 Sun Trigger" titleStyle={{ color: theme.text }} />
                    <Card.Content>
                        <SunTriggerConfig
                            trigger={sunTrigger}
                            onChange={setSunTrigger}
                        />

                        <Divider style={{ marginVertical: 16 }} />

                        <Text variant="labelSmall" style={{ color: theme.textSecondary }}>
                            Output:
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.text, fontFamily: 'monospace' }}>
                            {JSON.stringify(sunTrigger, null, 2)}
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
});
