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
import AddTriggerModal from '../components/AddTriggerModal';
import AutomationActionModal from '../components/AutomationActionModal';

interface Trigger {
    entity: number;
    entity_name: string;
    attribute: string;
    operator: string;
    value: string;
}

interface Action {
    entity?: number;
    entity_name?: string;
    scene?: number;
    scene_name?: string;
    command?: any;
}

export default function CreateAutomationScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const activeHome = useHomeStore((s) => s.activeHome);
    const devices = useDeviceStore((s) => s.devices);
    const scenes = useSceneStore((s) => s.scenes);
    const { createAutomation } = useAutomationStore();

    const [automationName, setAutomationName] = useState('');
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [showTriggerModal, setShowTriggerModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    // Get all entities
    const allEntities = devices.flatMap(device =>
        device.entities?.map(e => ({
            id: e.id,
            name: e.name,
            entity_type: e.entity_type
        })) || []
    );

    const addTrigger = (entityId: number, entityName: string, attribute: string, operator: string, value: string) => {
        const newTrigger: Trigger = {
            entity: entityId,
            entity_name: entityName,
            attribute,
            operator,
            value
        };
        setTriggers([...triggers, newTrigger]);
    };

    const removeTrigger = (index: number) => {
        setTriggers(triggers.filter((_, i) => i !== index));
    };

    const addAction = (type: 'entity' | 'scene', entityId?: number, entityName?: string, sceneId?: number, sceneName?: string, command?: any) => {
        const newAction: Action = type === 'scene'
            ? { scene: sceneId, scene_name: sceneName }
            : { entity: entityId, entity_name: entityName, command };

        setActions([...actions, newAction]);
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
            const triggersData = triggers.map(t => ({
                entity: t.entity,
                attribute: t.attribute,
                operator: t.operator,
                value: t.value
            }));

            // Prepare actions data
            const actionsData = actions.map(a => {
                if (a.scene) {
                    return { scene: a.scene };
                } else {
                    return { entity: a.entity, command: a.command };
                }
            });

            await createAutomation(activeHome.id, automationName, triggersData, actionsData);

            Alert.alert('Success', 'Automation created successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', `Failed to create automation: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const getTriggerSummary = (trigger: Trigger) => {
        return `${trigger.entity_name} ${trigger.attribute} ${trigger.operator} ${trigger.value}`;
    };

    const getActionSummary = (action: Action) => {
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
                                    <View key={index}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
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
                                        {index < actions.length - 1 && <Divider />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Modals */}
                <AddTriggerModal
                    visible={showTriggerModal}
                    entities={allEntities}
                    onClose={() => setShowTriggerModal(false)}
                    onAddTrigger={addTrigger}
                    theme={theme}
                    isDark={isDark}
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
