import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, IconButton, Switch, Card, Chip } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useHomeStore } from '../store/homeStore';
import { useAutomationStore } from '../store/automationStore';
import { Automation } from '../types/models';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function AutomationsScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const selectedHome = useHomeStore((s) => s.selectedHome);
    // Fix: Use separate selectors for reactive state updates
    const automations = useAutomationStore((s) => s.automations);
    const loadAutomations = useAutomationStore((s) => s.loadAutomations);
    const deleteAutomation = useAutomationStore((s) => s.deleteAutomation);
    const toggleAutomation = useAutomationStore((s) => s.toggleAutomation);
    const [loading, setLoading] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    useEffect(() => {
        if (selectedHome) {
            loadAutomations(selectedHome.id);
        }
    }, [selectedHome]);

    // Reload automations when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (selectedHome) {
                loadAutomations(selectedHome.id);
            }
        }, [selectedHome])
    );

    const handleToggle = async (id: number) => {
        try {
            await toggleAutomation(id);
        } catch (error: any) {
            Alert.alert('Error', `Failed to toggle automation: ${error.message}`);
        }
    };

    const handleDelete = (id: number, name: string) => {
        Alert.alert(
            'Delete Automation',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAutomation(id);
                            Alert.alert('Success', 'Automation deleted successfully');
                        } catch (error: any) {
                            Alert.alert('Error', `Failed to delete automation: ${error.message}`);
                        }
                    },
                },
            ]
        );
    };

    const handleCreate = () => {
        (navigation as any).navigate('CreateAutomation');
    };

    const getTriggerSummary = (automation: Automation) => {
        if (automation.triggers.length === 0) return 'No triggers';
        const trigger = automation.triggers[0];
        return `When ${trigger.entity_name || 'Entity'} ${trigger.attribute} ${trigger.operator} ${trigger.value}`;
    };

    const getActionSummary = (automation: Automation) => {
        if (automation.actions.length === 0) return 'No actions';
        const action = automation.actions[0];

        if (action.scene) {
            return `Run "${action.scene_name}" scene`;
        }

        if (action.entity && action.command) {
            const parts: string[] = [];
            if (action.command.power !== undefined) {
                parts.push(action.command.power ? 'Turn ON' : 'Turn OFF');
            }
            if (action.command.brightness !== undefined) {
                parts.push(`at ${action.command.brightness}%`);
            }
            if (action.command.speed !== undefined) {
                parts.push(`at speed ${action.command.speed}`);
            }
            return `${action.entity_name}: ${parts.join(' ')}`;
        }

        return 'Control device';
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Sticky Header */}
                <View style={[styles.header, { backgroundColor: theme.background }]}>
                    <View>
                        <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                            Automations
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                            {automations.length} automation{automations.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    {selectedHome && (
                        <Button
                            mode="contained"
                            onPress={handleCreate}
                            icon="plus"
                            buttonColor={theme.primary}
                        >
                            Create
                        </Button>
                    )}
                </View>

                {/* Content */}
                <ScrollView style={styles.content}>
                    {!selectedHome ? (
                        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏠</Text>
                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 8 }}>
                                No Home Selected
                            </Text>
                            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                                Please select a home to view automations
                            </Text>
                        </View>
                    ) : automations.length === 0 ? (
                        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 8 }}>
                                No Automations Yet
                            </Text>
                            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                                Create your first automation to{'\n'}automate your smart home
                            </Text>
                            <Button
                                mode="contained"
                                onPress={handleCreate}
                                icon="plus"
                                buttonColor={theme.primary}
                            >
                                Create Automation
                            </Button>
                        </View>
                    ) : (
                        automations.map((automation) => (
                            <Card
                                key={automation.id}
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: cardBg,
                                        borderColor,
                                        borderWidth: 1,
                                    }
                                ]}
                            >
                                <Card.Content style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                                    {/* Header */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <Text style={{ fontSize: 24 }}>🤖</Text>
                                                <Text variant="titleMedium" style={{ color: theme.text, fontWeight: '600', flex: 1 }}>
                                                    {automation.name}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Switch
                                                value={automation.enabled}
                                                onValueChange={() => handleToggle(automation.id)}
                                                color={theme.primary}
                                            />
                                        </View>
                                    </View>

                                    {/* Trigger Summary */}
                                    <View style={{ marginBottom: 8 }}>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                                            TRIGGER
                                        </Text>
                                        <Text variant="bodyMedium" style={{ color: theme.text }}>
                                            {getTriggerSummary(automation)}
                                        </Text>
                                    </View>

                                    {/* Action Summary */}
                                    <View style={{ marginBottom: 12 }}>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                                            ACTION
                                        </Text>
                                        <Text variant="bodyMedium" style={{ color: theme.primary }}>
                                            → {getActionSummary(automation)}
                                        </Text>
                                    </View>

                                    {/* Actions */}
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Button
                                            mode="outlined"
                                            onPress={() => {/* TODO: Navigate to edit */ }}
                                            icon="pencil"
                                            textColor={theme.primary}
                                            style={{ flex: 1 }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            mode="outlined"
                                            onPress={() => handleDelete(automation.id, automation.name)}
                                            icon="delete"
                                            textColor={theme.error}
                                            style={{ flex: 1 }}
                                        >
                                            Delete
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}

                    <View style={{ height: 100 }} />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
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
        elevation: 2,
    },
});
