import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text, Button, Card, FAB, Chip, IconButton, Divider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useHomeStore } from '../store/homeStore';
import { useDeviceStore } from '../store/deviceStore';
import { useSceneStore } from '../store/sceneStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import AddActionModal from '../components/AddActionModal';

interface SceneAction {
    entity: number;
    entity_name?: string;
    entity_type?: string;
    value: any;
    order: number;
}

export default function CreateSceneScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme, mode } = useTheme();
    const selectedHome = useHomeStore((s) => s.selectedHome);
    const devices = useDeviceStore((s) => s.devices);
    const { scenes, createScene, updateScene } = useSceneStore();

    // Check if we're in edit mode
    const params = route.params as any;
    const sceneId = params?.sceneId;
    const duplicateFrom = params?.duplicateFrom;
    const isEditMode = !!sceneId;
    const isDuplicateMode = !!duplicateFrom;

    const [sceneName, setSceneName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('🎬');
    const [actions, setActions] = useState<SceneAction[]>([]);
    const [showActionModal, setShowActionModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    // Load scene data for edit or duplicate mode
    useEffect(() => {
        const loadSceneData = () => {
            const sourceId = sceneId || duplicateFrom;
            if (!sourceId) return;

            const scene = scenes.find(s => s.id === sourceId);
            if (!scene) return;

            // Extract icon and name
            const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])\s*/u;
            const match = scene.name.match(emojiRegex);

            if (match) {
                setSelectedIcon(match[1]);
                setSceneName(scene.name.replace(emojiRegex, ''));
            } else {
                setSceneName(scene.name);
            }

            // Load actions with entity details
            if (scene.actions && scene.actions.length > 0) {
                const loadedActions: SceneAction[] = scene.actions.map((action, index) => ({
                    entity: action.entity,
                    entity_name: action.entity_name,
                    entity_type: action.entity_type,
                    value: action.value,
                    order: index + 1
                }));
                setActions(loadedActions);
            }
        };

        loadSceneData();
    }, [sceneId, duplicateFrom, scenes]);

    // Available icons for scenes
    const icons = ['🎬', '🌙', '☀️', '🏠', '🌅', '🎵', '💡', '🔒', '🌃', '☕', '🛏️', '🎮'];

    // Get all controllable entities from devices in the active home
    // Note: devices store is already filtered by home via loadDevices(homeId)
    const controllableEntities = devices
        .flatMap(device =>
            device.entities?.filter(e => e.is_controllable).map(e => ({
                id: e.id,
                name: e.name,
                entity_type: e.entity_type
            })) || []
        );

    const addEntityAction = (entityId: number, entityName: string, entityType: string, value: any) => {
        const newAction: SceneAction = {
            entity: entityId,
            entity_name: entityName,
            entity_type: entityType,
            value: value,
            order: actions.length + 1
        };

        setActions([...actions, newAction]);
    };

    const updateActionValue = (index: number, newValue: any) => {
        const updated = [...actions];
        updated[index].value = { ...updated[index].value, ...newValue };
        setActions(updated);
    };

    const removeAction = (index: number) => {
        const updated = actions.filter((_, i) => i !== index);
        // Re-order
        updated.forEach((action, i) => {
            action.order = i + 1;
        });
        setActions(updated);
    };

    const moveAction = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === actions.length - 1)
        ) {
            return;
        }

        const updated = [...actions];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

        // Re-order
        updated.forEach((action, i) => {
            action.order = i + 1;
        });

        setActions(updated);
    };

    const handleSave = async () => {
        if (!sceneName.trim()) {
            Alert.alert('Error', 'Please enter a scene name');
            return;
        }

        if (actions.length === 0) {
            Alert.alert('Error', 'Please add at least one action');
            return;
        }

        if (!selectedHome) {
            Alert.alert('Error', 'No active home selected');
            return;
        }

        console.log('=== SAVE SCENE DEBUG ===');
        console.log('Mode:', isEditMode ? 'EDIT' : 'CREATE');
        console.log('Scene ID:', sceneId);
        console.log('Active Home ID:', selectedHome.id);
        console.log('Scene Name:', `${selectedIcon} ${sceneName}`);
        console.log('Actions Count:', actions.length);

        setSaving(true);
        try {
            const actionsData = actions.map(a => ({
                entity: a.entity,
                value: a.value,
                order: a.order
            }));

            console.log('Actions Data:', JSON.stringify(actionsData, null, 2));

            if (isEditMode && sceneId) {
                // Update existing scene
                await updateScene(sceneId, `${selectedIcon} ${sceneName}`, actionsData);
                console.log('✅ Scene updated successfully!');
                Alert.alert('Success', 'Scene updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // Create new scene
                await createScene(selectedHome.id, `${selectedIcon} ${sceneName}`, actionsData);
                console.log('✅ Scene created successfully!');
                Alert.alert('Success', 'Scene created successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            console.error('❌ SAVE SCENE ERROR:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} scene: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            iconColor={theme.text}
                            onPress={() => navigation.goBack()}
                        />
                        <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold' }}>
                            {isEditMode ? 'Edit Scene' : 'Create Scene'}
                        </Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving || !sceneName || actions.length === 0}
                        buttonColor={theme.primary}
                    >
                        Save
                    </Button>
                </View>

                <ScrollView style={styles.content}>
                    {/* Scene Name & Icon */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 16 }}>
                                Scene Details
                            </Text>

                            {/* Icon Selector */}
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                Choose an icon
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 16 }}
                            >
                                {icons.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        style={[
                                            styles.iconButton,
                                            {
                                                backgroundColor: selectedIcon === icon ? theme.primary : cardBg,
                                                borderColor: selectedIcon === icon ? theme.primary : borderColor,
                                            }
                                        ]}
                                    >
                                        <Text style={{ fontSize: 28 }}>{icon}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Scene Name Input */}
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                Scene name
                            </Text>
                            <TextInput
                                value={sceneName}
                                onChangeText={setSceneName}
                                placeholder="e.g., Good Night, Movie Time"
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

                    {/* Actions */}
                    <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                                    Actions ({actions.length})
                                </Text>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowActionModal(true)}
                                    icon="plus"
                                    textColor={theme.primary}
                                >
                                    Add Action
                                </Button>
                            </View>

                            {/* Action List */}
                            {actions.length === 0 ? (
                                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 40, marginBottom: 12 }}>✨</Text>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                                        No actions yet{'\n'}Add devices to control
                                    </Text>
                                </View>
                            ) : (
                                actions.map((action, index) => (
                                    <View key={index}>
                                        <ActionCard
                                            action={action}
                                            index={index}
                                            theme={theme}
                                            isDark={isDark}
                                            cardBg={cardBg}
                                            borderColor={borderColor}
                                            onUpdate={(newValue) => updateActionValue(index, newValue)}
                                            onRemove={() => removeAction(index)}
                                            onMoveUp={() => moveAction(index, 'up')}
                                            onMoveDown={() => moveAction(index, 'down')}
                                            canMoveUp={index > 0}
                                            canMoveDown={index < actions.length - 1}
                                        />
                                        {index < actions.length - 1 && <Divider style={{ marginVertical: 12 }} />}
                                    </View>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Add Action Modal */}
                <AddActionModal
                    visible={showActionModal}
                    entities={controllableEntities}
                    onClose={() => setShowActionModal(false)}
                    onAddAction={addEntityAction}
                    theme={theme}
                    isDark={isDark}
                />
            </View>
        </>
    );
}

// Action Card Component
interface ActionCardProps {
    action: SceneAction;
    index: number;
    theme: any;
    isDark: boolean;
    cardBg: string;
    borderColor: string;
    onUpdate: (newValue: any) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

function ActionCard({ action, index, theme, isDark, cardBg, borderColor, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: ActionCardProps) {
    // Generate action summary
    const getActionSummary = () => {
        const parts: string[] = [];

        if (action.value.power !== undefined) {
            parts.push(action.value.power ? 'Turn ON' : 'Turn OFF');
        }

        if (action.value.brightness !== undefined && action.value.power) {
            parts.push(`at ${action.value.brightness}% brightness`);
        }

        if (action.value.speed !== undefined && action.value.power) {
            parts.push(`at speed ${action.value.speed}`);
        }

        return parts.join(' ') || 'No action configured';
    };

    return (
        <View style={{ paddingVertical: 8 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                        <Text variant="titleSmall" style={{ color: theme.text, fontWeight: '600' }}>
                            {index + 1}. {action.entity_name}
                        </Text>
                        <Chip mode="flat" compact textStyle={{ fontSize: 11 }}>
                            {action.entity_type}
                        </Chip>
                    </View>
                    {/* Action Summary */}
                    <Text variant="bodySmall" style={{ color: theme.primary, marginLeft: 4 }}>
                        → {getActionSummary()}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2, flexShrink: 0 }}>
                    <IconButton
                        icon="arrow-up"
                        size={16}
                        iconColor={canMoveUp ? theme.primary : theme.textSecondary}
                        onPress={onMoveUp}
                        disabled={!canMoveUp}
                        style={{ margin: 0 }}
                    />
                    <IconButton
                        icon="arrow-down"
                        size={16}
                        iconColor={canMoveDown ? theme.primary : theme.textSecondary}
                        onPress={onMoveDown}
                        disabled={!canMoveDown}
                        style={{ margin: 0 }}
                    />
                    <IconButton
                        icon="delete"
                        size={16}
                        iconColor={theme.error}
                        onPress={onRemove}
                    />
                </View>
            </View>

            {/* Value Controls */}
            {action.entity_type === 'light' && (
                <View style={{ gap: 12 }}>
                    {/* Power Toggle */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.text }}>Power</Text>
                        <Chip
                            mode="outlined"
                            onPress={() => onUpdate({ power: !action.value.power })}
                            style={{ backgroundColor: action.value.power ? theme.primary : 'transparent' }}
                            textStyle={{ color: action.value.power ? '#FFF' : theme.text }}
                        >
                            {action.value.power ? 'ON' : 'OFF'}
                        </Chip>
                    </View>

                    {/* Brightness Slider */}
                    {action.value.brightness !== undefined && (
                        <View>
                            <Text style={{ color: theme.text, marginBottom: 8 }}>
                                Brightness: {action.value.brightness}%
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[25, 50, 75, 100].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => onUpdate({ brightness: val })}
                                        style={[
                                            styles.quickButton, {
                                                backgroundColor: action.value.brightness === val ? theme.primary : cardBg,
                                                borderColor: action.value.brightness === val ? theme.primary : borderColor,
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: action.value.brightness === val ? '#FFF' : theme.text, fontSize: 12 }}>
                                            {val}%
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {action.entity_type === 'switch' || action.entity_type === 'relay' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.text }}>Power</Text>
                    <Chip
                        mode="outlined"
                        onPress={() => onUpdate({ power: !action.value.power })}
                        style={{ backgroundColor: action.value.power ? theme.primary : 'transparent' }}
                        textStyle={{ color: action.value.power ? '#FFF' : theme.text }}
                    >
                        {action.value.power ? 'ON' : 'OFF'}
                    </Chip>
                </View>
            )}

            {action.entity_type === 'fan' && (
                <View style={{ gap: 12 }}>
                    {/* Power Toggle */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.text }}>Power</Text>
                        <Chip
                            mode="outlined"
                            onPress={() => onUpdate({ power: !action.value.power })}
                            style={{ backgroundColor: action.value.power ? theme.primary : 'transparent' }}
                            textStyle={{ color: action.value.power ? '#FFF' : theme.text }}
                        >
                            {action.value.power ? 'ON' : 'OFF'}
                        </Chip>
                    </View>

                    {/* Speed Selector */}
                    {action.value.speed !== undefined && (
                        <View>
                            <Text style={{ color: theme.text, marginBottom: 8 }}>
                                Speed: {action.value.speed}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => onUpdate({ speed: val })}
                                        style={[
                                            styles.quickButton,
                                            {
                                                backgroundColor: action.value.speed === val ? theme.primary : cardBg,
                                                borderColor: action.value.speed === val ? theme.primary : borderColor,
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: action.value.speed === val ? '#FFF' : theme.text, fontSize: 12 }}>
                                            {val}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
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
        padding: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    content: {
        flex: 1,
    },
    card: {
        margin: 16,
        marginTop: 0,
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    input: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        fontSize: 16,
    },
    iconButton: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        marginRight: 8,
    },
    entitySelector: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
    },
    entityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    quickButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
});
