import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Chip, IconButton, Portal, Surface } from 'react-native-paper';
import { useState } from 'react';
import Slider from '@react-native-community/slider';

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
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    return (
        <Portal>
            <Modal
                visible={visible}
                onRequestClose={handleClose}
                animationType="slide"
                transparent={true}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Surface style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: borderColor }]}>
                            <IconButton
                                icon={step === 'type' ? 'close' : 'arrow-left'}
                                size={24}
                                iconColor={theme.text}
                                onPress={() => step === 'type' ? handleClose() : handleBack()}
                            />
                            <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                                Add Action
                            </Text>
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.content}>
                            {step === 'type' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Choose what should happen when triggered
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => handleTypeSelect('entity')}
                                        style={[styles.typeCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}
                                    >
                                        <Text style={{ fontSize: 32, marginBottom: 8 }}>💡</Text>
                                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4 }}>
                                            Control Device
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                            Turn on/off lights, fans, etc.
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleTypeSelect('scene')}
                                        style={[styles.typeCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}
                                    >
                                        <Text style={{ fontSize: 32, marginBottom: 8 }}>🎬</Text>
                                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4 }}>
                                            Run Scene
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                            Trigger a saved scene
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {step === 'select' && actionType === 'entity' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select device to control
                                    </Text>
                                    {entities.filter(e => e.entity_type !== 'sensor').map((entity) => (
                                        <TouchableOpacity
                                            key={entity.id}
                                            onPress={() => handleEntitySelect(entity)}
                                            style={[styles.listItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text variant="titleMedium" style={{ color: theme.text }}>
                                                    {entity.name}
                                                </Text>
                                                <Chip mode="outlined" compact textStyle={{ fontSize: 11 }} style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                                                    {entity.entity_type}
                                                </Chip>
                                            </View>
                                            <IconButton icon="chevron-right" size={24} iconColor={theme.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {step === 'select' && actionType === 'scene' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select scene to run
                                    </Text>
                                    {scenes.map((scene) => (
                                        <TouchableOpacity
                                            key={scene.id}
                                            onPress={() => handleSceneSelect(scene)}
                                            style={[styles.listItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}
                                        >
                                            <Text variant="titleMedium" style={{ color: theme.text, flex: 1 }}>
                                                {scene.name}
                                            </Text>
                                            <IconButton icon="chevron-right" size={24} iconColor={theme.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {step === 'configure' && selectedEntity && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Configure {selectedEntity.name}
                                    </Text>

                                    {/* Power Control */}
                                    <View style={styles.controlSection}>
                                        <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                                            POWER
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => updateCommand('power', true)}
                                                style={[
                                                    styles.powerButton,
                                                    {
                                                        backgroundColor: command.power ? theme.primary : 'transparent',
                                                        borderColor: command.power ? theme.primary : borderColor,
                                                    }
                                                ]}
                                            >
                                                <Text style={{
                                                    color: command.power ? '#FFFFFF' : theme.text,
                                                    fontWeight: '600',
                                                    fontSize: 16
                                                }}>
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
                                                    }
                                                ]}
                                            >
                                                <Text style={{
                                                    color: !command.power ? '#FFFFFF' : theme.text,
                                                    fontWeight: '600',
                                                    fontSize: 16
                                                }}>
                                                    OFF
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Brightness (for lights) */}
                                    {selectedEntity.entity_type === 'light' && command.brightness !== undefined && (
                                        <View style={styles.controlSection}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <Text variant="titleSmall" style={{ color: theme.text, fontWeight: '600' }}>
                                                    BRIGHTNESS
                                                </Text>
                                                <Text variant="titleMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                                    {command.brightness}%
                                                </Text>
                                            </View>
                                            <Slider
                                                value={command.brightness}
                                                onValueChange={(value) => updateCommand('brightness', Math.round(value))}
                                                minimumValue={0}
                                                maximumValue={100}
                                                step={1}
                                                minimumTrackTintColor={theme.primary}
                                                maximumTrackTintColor={borderColor}
                                                thumbTintColor={theme.primary}
                                                style={{ height: 40 }}
                                            />
                                        </View>
                                    )}

                                    {/* Speed (for fans) */}
                                    {selectedEntity.entity_type === 'fan' && command.speed !== undefined && (
                                        <View style={styles.controlSection}>
                                            <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                                                SPEED
                                            </Text>
                                            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                                                {[1, 2, 3, 4, 5].map((speed) => (
                                                    <TouchableOpacity
                                                        key={speed}
                                                        onPress={() => updateCommand('speed', speed)}
                                                        style={[
                                                            styles.speedButton,
                                                            {
                                                                backgroundColor: command.speed === speed ? theme.primary : 'transparent',
                                                                borderColor: command.speed === speed ? theme.primary : borderColor,
                                                            }
                                                        ]}
                                                    >
                                                        <Text style={{
                                                            color: command.speed === speed ? '#FFFFFF' : theme.text,
                                                            fontWeight: '600'
                                                        }}>
                                                            {speed}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        {step === 'configure' && (
                            <View style={[styles.footer, { borderTopColor: borderColor }]}>
                                <Button
                                    mode="outlined"
                                    onPress={handleBack}
                                    style={{ flex: 1 }}
                                    textColor={theme.text}
                                >
                                    Back
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleAddAction}
                                    style={{ flex: 1 }}
                                    buttonColor={theme.primary}
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
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    content: {
        padding: 20,
    },
    typeCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        alignItems: 'center',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    controlSection: {
        marginBottom: 24,
    },
    powerButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    speedButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
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
