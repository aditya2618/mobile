import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Text, Button, Card, IconButton, Divider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useHomeStore } from '../store/homeStore';
import { useDeviceStore } from '../store/deviceStore';
import { useSceneStore } from '../store/sceneStore';
import { useAutomationStore } from '../store/automationStore';
import { useNavigation } from '@react-navigation/native';
import AddTriggerModalV2 from '../components/AddTriggerModalV2';
import AutomationActionModal from '../components/AutomationActionModal';

interface Trigger {
    trigger_type: 'state' | 'time' | 'sun';

    // State trigger fields
    entity?: number;
    entity_name?: string;
    attribute?: string;
    operator?: string;
    value?: string;

    // Time trigger fields
    time_of_day?: string;
    days_of_week?: number[];

    // Sun trigger fields
    sun_event?: string;
    sun_offset?: number;
}

interface Action {
    entity?: number;
    entity_name?: string;
    scene?: number;
    scene_name?: string;
    command?: any;
    delay_seconds?: number; // New field for delayed actions
}

export default function CreateAutomationScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const activeHome = useHomeStore((s) => s.activeHome);
    const devices = useDeviceStore((s) => s.devices);
    const loadDevices = useDeviceStore((s) => s.loadDevices);
    const scenes = useSceneStore((s) => s.scenes);
    const { createAutomation } = useAutomationStore();

    const [automationName, setAutomationName] = useState('');
    const [triggerLogic, setTriggerLogic] = useState<'AND' | 'OR'>('AND'); // New state
    const [cooldownSeconds, setCooldownSeconds] = useState(60); // New state
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [showTriggerModal, setShowTriggerModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    // Load devices when component mounts
    useEffect(() => {
        if (activeHome) {
            loadDevices(activeHome.id);
        }
    }, [activeHome]);

    // Get all entities
    const allEntities = devices.flatMap(device =>
        device.entities?.map(e => ({
            id: e.id,
            name: e.name,
            entity_type: e.entity_type
        })) || []
    );

    const addTrigger = (trigger: Trigger) => {
        setTriggers([...triggers, trigger]);
    };

    const removeTrigger = (index: number) => {
        setTriggers(triggers.filter((_, i) => i !== index));
    };

    const addAction = (type: 'entity' | 'scene', entityId?: number, entityName?: string, sceneId?: number, sceneName?: string, command?: any) => {
        const newAction: Action = type === 'scene'
            ? { scene: sceneId, scene_name: sceneName, delay_seconds: 0 }
            : { entity: entityId, entity_name: entityName, command, delay_seconds: 0 };

        setActions([...actions, newAction]);
    };

    const updateActionDelay = (index: number, delay: number) => {
        const updated = [...actions];
        updated[index].delay_seconds = delay;
        setActions(updated);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!automationName.trim()) {
            Alert.alert('Error', 'Please enter an automation name');
            return;
        }

        if (triggers.length === 0) {
            Alert.alert('Error', 'Please add at least one trigger');
            return;
        }

        if (actions.length === 0) {
            Alert.alert('Error', 'Please add at least one action');
            return;
        }

        if (!activeHome) {
            Alert.alert('Error', 'No active home selected');
            return;
        }

        try {
            setSaving(true);

            // Prepare triggers data
            const triggersData = triggers.map(t => {
                const base: any = { trigger_type: t.trigger_type };

                if (t.trigger_type === 'time') {
                    return {
                        ...base,
                        time_of_day: t.time_of_day,
                        days_of_week: t.days_of_week && t.days_of_week.length > 0 ? t.days_of_week : null
                    };
                }

                if (t.trigger_type === 'sun') {
                    return {
                        ...base,
                        sun_event: t.sun_event,
                        sun_offset: t.sun_offset || 0
                    };
                }

                // State trigger
                return {
                    ...base,
                    entity: t.entity,
                    attribute: t.attribute,
                    operator: t.operator,
                    value: t.value
                };
            });

            // Prepare actions data
            const actionsData = actions.map(a => {
                if (a.scene) {
                    return { scene: a.scene };
                } else {
                    return { entity: a.entity, command: a.command };
                }
            });

            await createAutomation(
                activeHome.id,
                automationName,
                triggersData,
                actionsData,
                triggerLogic,
                cooldownSeconds
            );

            Alert.alert('Success', 'Automation created successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', `Failed to create automation: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const getTriggerSummary = (trigger: Trigger) => {
        if (trigger.trigger_type === 'time') {
            const days = trigger.days_of_week && trigger.days_of_week.length > 0
                ? ` on ${formatDays(trigger.days_of_week)}`
                : ' daily';
            return `⏰ ${trigger.time_of_day}${days}`;
        }

        if (trigger.trigger_type === 'sun') {
            const offset = trigger.sun_offset && trigger.sun_offset !== 0
                ? ` ${trigger.sun_offset > 0 ? '+' : ''}${trigger.sun_offset}m`
                : '';
            return `🌞 ${trigger.sun_event}${offset}`;
        }

        // State trigger
        return `${trigger.entity_name} ${trigger.attribute} ${trigger.operator} ${trigger.value}`;
    };

    const formatDays = (days: number[]) => {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && days.every(d => d < 5)) return 'Weekdays';
        if (days.length === 2 && days.includes(5) && days.includes(6)) return 'Weekends';
        return days.map(d => dayNames[d]).join(', ');
    };

    const getActionSummary = (action: Action) => {
        if (action.scene) {
            const delay = action.delay_seconds && action.delay_seconds > 0 ? ` (after ${action.delay_seconds}s)` : '';
            return `Run "${action.scene_name}" scene${delay}`;
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
            const delay = action.delay_seconds && action.delay_seconds > 0 ? ` (after ${action.delay_seconds}s)` : '';
            return `${action.entity_name}: ${parts.join(' ')}${delay}`;
        }

        return 'Control device';
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.background }]}>
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        iconColor={theme.text}
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                        Create Automation
                    </Text>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving}
                        buttonColor={theme.primary}
                    >
                        Save
                    </Button>
                </View>

                {/* Content */}
                <ScrollView style={styles.content}>
                    {/* Name Input */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 8 }}>
                                Automation Name
                            </Text>
                            <TextInput
                                value={automationName}
                                onChangeText={setAutomationName}
                                placeholder="e.g., Auto Fan ON"
                                placeholderTextColor={theme.textSecondary}
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                        color: theme.text,
                                        borderColor,
                                    }
                                ]}
                            />
                        </Card.Content>
                    </Card>

                    {/* Advanced Settings Card */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                                Advanced Settings
                            </Text>

                            {/* Trigger Logic Toggle */}
                            <View style={{ marginBottom: 16 }}>
                                <Text variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                    Trigger Logic (for multiple conditions)
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <Button
                                        mode={triggerLogic === 'AND' ? 'contained' : 'outlined'}
                                        onPress={() => setTriggerLogic('AND')}
                                        buttonColor={triggerLogic === 'AND' ? theme.primary : 'transparent'}
                                        textColor={triggerLogic === 'AND' ? '#FFF' : theme.text}
                                        style={{ flex: 1 }}
                                        compact
                                    >
                                        AND (All must match)
                                    </Button>
                                    <Button
                                        mode={triggerLogic === 'OR' ? 'contained' : 'outlined'}
                                        onPress={() => setTriggerLogic('OR')}
                                        buttonColor={triggerLogic === 'OR' ? theme.primary : 'transparent'}
                                        textColor={triggerLogic === 'OR' ? '#FFF' : theme.text}
                                        style={{ flex: 1 }}
                                        compact
                                    >
                                        OR (Any can match)
                                    </Button>
                                </View>
                            </View>

                            {/* Cooldown Input */}
                            <View>
                                <Text variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                    Cooldown (seconds)
                                </Text>
                                <TextInput
                                    value={cooldownSeconds.toString()}
                                    onChangeText={(v) => setCooldownSeconds(parseInt(v) || 60)}
                                    keyboardType="number-pad"
                                    placeholder="60"
                                    placeholderTextColor={theme.textSecondary}
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                            color: theme.text,
                                            borderColor,
                                        }
                                    ]}
                                />
                                <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                    Minimum time between executions (prevents rapid re-triggering)
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Triggers Section */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text variant="titleMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                    Triggers ({triggers.length})
                                </Text>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowTriggerModal(true)}
                                    icon="plus"
                                    textColor={theme.primary}
                                >
                                    Add
                                </Button>
                            </View>

                            {triggers.length === 0 ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <Text style={{ color: theme.textSecondary }}>
                                        No triggers added yet
                                    </Text>
                                </View>
                            ) : (
                                triggers.map((trigger, index) => (
                                    <View key={index}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text variant="bodyMedium" style={{ color: theme.text }}>
                                                    {getTriggerSummary(trigger)}
                                                </Text>
                                            </View>
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                iconColor={theme.error}
                                                onPress={() => removeTrigger(index)}
                                            />
                                        </View>
                                        {index < triggers.length - 1 && <Divider />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    {/* Actions Section */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text variant="titleMedium" style={{ color: theme.text, fontWeight: '600' }}>
                                    Actions ({actions.length})
                                </Text>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowActionModal(true)}
                                    icon="plus"
                                    textColor={theme.primary}
                                >
                                    Add
                                </Button>
                            </View>

                            {actions.length === 0 ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <Text style={{ color: theme.textSecondary }}>
                                        No actions added yet
                                    </Text>
                                </View>
                            ) : (
                                actions.map((action, index) => (
                                    <View key={index} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text variant="bodyMedium" style={{ color: theme.primary }}>
                                                    → {getActionSummary(action)}
                                                </Text>
                                            </View>
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                iconColor={theme.error}
                                                onPress={() => removeAction(index)}
                                            />
                                        </View>

                                        {/* Delay Input */}
                                        <View style={{ marginTop: 8, marginLeft: 20 }}>
                                            <Text variant="bodySmall" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                                                Delay (seconds)
                                            </Text>
                                            <TextInput
                                                value={(action.delay_seconds || 0).toString()}
                                                onChangeText={(v) => updateActionDelay(index, parseInt(v) || 0)}
                                                keyboardType="number-pad"
                                                placeholder="0"
                                                placeholderTextColor={theme.textSecondary}
                                                style={[
                                                    styles.input,
                                                    {
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                                        color: theme.text,
                                                        borderColor,
                                                        paddingVertical: 8,
                                                    }
                                                ]}
                                            />
                                        </View>

                                        {index < actions.length - 1 && <Divider style={{ marginTop: 12 }} />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Modals */}
                <AddTriggerModalV2
                    visible={showTriggerModal}
                    onDismiss={() => setShowTriggerModal(false)}
                    onAdd={addTrigger}
                />

                <AutomationActionModal
                    visible={showActionModal}
                    entities={allEntities}
                    scenes={scenes}
                    onClose={() => setShowActionModal(false)}
                    onAddAction={addAction}
                    theme={theme}
                    isDark={isDark}
                />
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
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
});
