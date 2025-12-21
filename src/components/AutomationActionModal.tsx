import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Chip, IconButton, Portal, Surface } from 'react-native-paper';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Entity {
    id: number;
    name: string;
    entity_type: string;
}

interface Scene {
    id: number;
    name: string;
}

interface AutomationActionModalProps {
    visible: boolean;
    entities: Entity[];
    scenes: Scene[];
    onClose: () => void;
    onAddAction: (type: 'entity' | 'scene', entityId?: number, entityName?: string, sceneId?: number, sceneName?: string, command?: any) => void;
    theme: any;
    isDark: boolean;
}

// Helper function to get icon for entity type
const getEntityIcon = (entityType: string): string => {
    switch (entityType.toLowerCase()) {
        case 'light': return 'lightbulb';
        case 'fan': return 'fan';
        case 'switch': return 'light-switch';
        case 'sensor': return 'chart-line';
        default: return 'devices';
    }
};

// Helper function to get color for entity type
const getEntityColor = (entityType: string): string => {
    switch (entityType.toLowerCase()) {
        case 'light': return '#FFE66D';
        case 'fan': return '#4ECDC4';
        case 'switch': return '#95E1D3';
        default: return '#9C27B0';
    }
};

export default function AutomationActionModal({ visible, entities, scenes, onClose, onAddAction, theme, isDark }: AutomationActionModalProps) {
    const [step, setStep] = useState<'type' | 'select' | 'configure'>('type');
    const [actionType, setActionType] = useState<'entity' | 'scene'>('entity');
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
    const [command, setCommand] = useState<any>({});

    const handleTypeSelect = (type: 'entity' | 'scene') => {
        setActionType(type);
        setStep('select');
    };

    const handleEntitySelect = (entity: Entity) => {
        setSelectedEntity(entity);
        const defaultCmd = getDefaultCommand(entity.entity_type);
        setCommand(defaultCmd);
        setStep('configure');
    };

    const handleSceneSelect = (scene: Scene) => {
        setSelectedScene(scene);
        onAddAction('scene', undefined, undefined, scene.id, scene.name);
        handleClose();
    };

    const getDefaultCommand = (entityType: string) => {
        switch (entityType) {
            case 'light':
                return { power: true, brightness: 100 };
            case 'fan':
                return { power: true, speed: 3 };
            default:
                return { power: true };
        }
    };

    const handleAddAction = () => {
        if (selectedEntity) {
            onAddAction('entity', selectedEntity.id, selectedEntity.name, undefined, undefined, command);
            handleClose();
        }
    };

    const handleClose = () => {
        setStep('type');
        setActionType('entity');
        setSelectedEntity(null);
        setSelectedScene(null);
        setCommand({});
        onClose();
    };

    const handleBack = () => {
        if (step === 'select') setStep('type');
        else if (step === 'configure') setStep('select');
    };

    const updateCommand = (key: string, value: any) => {
        setCommand((prev: any) => ({ ...prev, [key]: value }));
    };

    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const selectedBg = isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)';

    const getStepTitle = () => {
        switch (step) {
            case 'type': return '⚡ Choose Action Type';
            case 'select': return actionType === 'entity' ? '📱 Select Device' : '🎬 Select Scene';
            case 'configure': return '⚙️ Configure Action';
            default: return '';
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onRequestClose={handleClose}
                animationType="slide"
                transparent={true}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Surface style={[styles.modalContent, { backgroundColor: theme.background }]} elevation={5}>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: borderColor }]}>
                            <IconButton
                                icon={step === 'type' ? 'close' : 'arrow-left'}
                                size={24}
                                iconColor={theme.text}
                                onPress={() => step === 'type' ? handleClose() : handleBack()}
                            />
                            <View style={{ flex: 1 }}>
                                <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold' }}>
                                    {getStepTitle()}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                    {step === 'type' && 'What should happen?'}
                                    {step === 'select' && actionType === 'entity' && 'Choose device to control'}
                                    {step === 'select' && actionType === 'scene' && 'Choose scene to activate'}
                                    {step === 'configure' && 'Set device parameters'}
                                </Text>
                            </View>
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {step === 'type' && (
                                <View>
                                    <TouchableOpacity
                                        onPress={() => handleTypeSelect('entity')}
                                        style={[styles.typeCard, { backgroundColor: cardBg, borderColor }]}
                                    >
                                        <View style={[styles.typeIconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
                                            <MaterialCommunityIcons name="devices" size={32} color="#4CAF50" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4, fontWeight: '600' }}>
                                                Control Device
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                Turn on/off lights, fans, switches
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleTypeSelect('scene')}
                                        style={[styles.typeCard, { backgroundColor: cardBg, borderColor }]}
                                    >
                                        <View style={[styles.typeIconContainer, { backgroundColor: '#9C27B0' + '20' }]}>
                                            <MaterialCommunityIcons name="movie-open" size={32} color="#9C27B0" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4, fontWeight: '600' }}>
                                                Run Scene
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                Activate a saved scene configuration
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {step === 'select' && actionType === 'entity' && (
                                <View>
                                    {entities.filter(e => e.entity_type !== 'sensor').map((entity) => (
                                        <TouchableOpacity
                                            key={entity.id}
                                            onPress={() => handleEntitySelect(entity)}
                                            style={[styles.entityCard, { backgroundColor: cardBg, borderColor }]}
                                        >
                                            <View
                                                style={[
                                                    styles.entityIconSmall,
                                                    { backgroundColor: getEntityColor(entity.entity_type) + '20' },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name={getEntityIcon(entity.entity_type) as any}
                                                    size={24}
                                                    color={getEntityColor(entity.entity_type)}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text variant="bodyLarge" style={{ color: theme.text }}>
                                                    {entity.name}
                                                </Text>
                                                <Chip
                                                    mode="outlined"
                                                    compact
                                                    textStyle={{ fontSize: 11 }}
                                                    style={{ marginTop: 4, alignSelf: 'flex-start' }}
                                                >
                                                    {entity.entity_type}
                                                </Chip>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {step === 'select' && actionType === 'scene' && (
                                <View>
                                    {scenes.map((scene) => (
                                        <TouchableOpacity
                                            key={scene.id}
                                            onPress={() => handleSceneSelect(scene)}
                                            style={[styles.sceneCard, { backgroundColor: cardBg, borderColor }]}
                                        >
                                            <View
                                                style={[
                                                    styles.sceneIcon,
                                                    { backgroundColor: '#9C27B0' + '20' },
                                                ]}
                                            >
                                                <MaterialCommunityIcons name="movie-open" size={24} color="#9C27B0" />
                                            </View>
                                            <Text variant="titleMedium" style={{ color: theme.text, flex: 1 }}>
                                                {scene.name}
                                            </Text>
                                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {step === 'configure' && selectedEntity && (
                                <View>
                                    <View style={[styles.selectionSummary, { backgroundColor: selectedBg, borderColor: '#4CAF50' }]}>
                                        <MaterialCommunityIcons
                                            name={getEntityIcon(selectedEntity.entity_type) as any}
                                            size={20}
                                            color="#4CAF50"
                                        />
                                        <Text variant="bodyMedium" style={{ color: '#4CAF50', flex: 1, marginLeft: 8 }}>
                                            {selectedEntity.name}
                                        </Text>
                                    </View>

                                    {/* Power Control */}
                                    <View style={styles.controlSection}>
                                        <Text variant="labelLarge" style={{ color: theme.text, marginBottom: 12, letterSpacing: 1 }}>
                                            POWER STATE
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => updateCommand('power', true)}
                                                style={[
                                                    styles.powerButton,
                                                    {
                                                        backgroundColor: command.power ? '#4CAF50' : 'transparent',
                                                        borderColor: command.power ? '#4CAF50' : borderColor,
                                                    },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name="power"
                                                    size={20}
                                                    color={command.power ? '#FFFFFF' : theme.text}
                                                />
                                                <Text
                                                    style={{
                                                        color: command.power ? '#FFFFFF' : theme.text,
                                                        fontWeight: '600',
                                                        fontSize: 16,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    ON
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => updateCommand('power', false)}
                                                style={[
                                                    styles.powerButton,
                                                    {
                                                        backgroundColor: !command.power ? theme.error : 'transparent',
                                                        borderColor: !command.power ? theme.error : borderColor,
                                                    },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name="power-off"
                                                    size={20}
                                                    color={!command.power ? '#FFFFFF' : theme.text}
                                                />
                                                <Text
                                                    style={{
                                                        color: !command.power ? '#FFFFFF' : theme.text,
                                                        fontWeight: '600',
                                                        fontSize: 16,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    OFF
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Brightness (for lights) */}
                                    {selectedEntity.entity_type === 'light' && command.brightness !== undefined && (
                                        <View style={styles.controlSection}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <MaterialCommunityIcons name="brightness-6" size={20} color={theme.text} />
                                                    <Text variant="labelLarge" style={{ color: theme.text, marginLeft: 8, letterSpacing: 1 }}>
                                                        BRIGHTNESS
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.valueBadge,
                                                        { backgroundColor: '#FFE66D' + '20', borderColor: '#FFE66D' },
                                                    ]}
                                                >
                                                    <Text variant="titleMedium" style={{ color: '#FFE66D', fontWeight: 'bold' }}>
                                                        {command.brightness}%
                                                    </Text>
                                                </View>
                                            </View>
                                            <Slider
                                                value={command.brightness}
                                                onValueChange={(value) => updateCommand('brightness', Math.round(value))}
                                                minimumValue={0}
                                                maximumValue={100}
                                                step={1}
                                                minimumTrackTintColor="#FFE66D"
                                                maximumTrackTintColor={borderColor}
                                                thumbTintColor="#FFE66D"
                                                style={{ height: 40 }}
                                            />
                                        </View>
                                    )}

                                    {/* Speed (for fans) */}
                                    {selectedEntity.entity_type === 'fan' && command.speed !== undefined && (
                                        <View style={styles.controlSection}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <MaterialCommunityIcons name="speedometer" size={20} color={theme.text} />
                                                <Text variant="labelLarge" style={{ color: theme.text, marginLeft: 8, letterSpacing: 1 }}>
                                                    FAN SPEED
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                                                {[1, 2, 3, 4, 5].map((speed) => (
                                                    <TouchableOpacity
                                                        key={speed}
                                                        onPress={() => updateCommand('speed', speed)}
                                                        style={[
                                                            styles.speedButton,
                                                            {
                                                                backgroundColor: command.speed === speed ? '#4ECDC4' : 'transparent',
                                                                borderColor: command.speed === speed ? '#4ECDC4' : borderColor,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={{
                                                                color: command.speed === speed ? '#FFFFFF' : theme.text,
                                                                fontWeight: '700',
                                                                fontSize: 18,
                                                            }}
                                                        >
                                                            {speed}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={{ height: 40 }} />
                        </ScrollView>

                        {/* Footer */}
                        {step === 'configure' && (
                            <View style={[styles.footer, { borderTopColor: borderColor }]}>
                                <Button
                                    mode="outlined"
                                    onPress={handleBack}
                                    style={{ flex: 1 }}
                                    textColor={theme.text}
                                    icon="arrow-left"
                                >
                                    Back
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleAddAction}
                                    style={{ flex: 1 }}
                                    buttonColor="#4CAF50"
                                    icon="check"
                                >
                                    Add Action
                                </Button>
                            </View>
                        )}
                    </Surface>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    content: {
        padding: 20,
    },
    selectionSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    typeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    entityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    entityIconSmall: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sceneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    sceneIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    controlSection: {
        marginBottom: 28,
    },
    powerButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    speedButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
    },
});
