import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Chip, IconButton, Portal, Surface } from 'react-native-paper';
import { useState } from 'react';
import Slider from '@react-native-community/slider';

interface Entity {
    id: number;
    name: string;
    entity_type: string;
}

interface ActionValue {
    power?: boolean;
    brightness?: number;
    speed?: number;
    [key: string]: any;
}

interface AddActionModalProps {
    visible: boolean;
    entities: Entity[];
    onClose: () => void;
    onAddAction: (entityId: number, entityName: string, entityType: string, value: ActionValue) => void;
    theme: any;
    isDark: boolean;
}

export default function AddActionModal({ visible, entities, onClose, onAddAction, theme, isDark }: AddActionModalProps) {
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [actionValue, setActionValue] = useState<ActionValue>({});

    const handleEntitySelect = (entity: Entity) => {
        setSelectedEntity(entity);
        // Set default values based on entity type
        const defaultValue = getDefaultValue(entity.entity_type);
        setActionValue(defaultValue);
        setStep('configure');
    };

    const getDefaultValue = (entityType: string): ActionValue => {
        switch (entityType) {
            case 'light':
                return { power: true, brightness: 100 };
            case 'switch':
            case 'relay':
                return { power: true };
            case 'fan':
                return { power: true, speed: 3 };
            default:
                return { power: true };
        }
    };

    const handleAddAction = () => {
        if (selectedEntity) {
            onAddAction(selectedEntity.id, selectedEntity.name, selectedEntity.entity_type, actionValue);
            handleClose();
        }
    };

    const handleClose = () => {
        setStep('select');
        setSelectedEntity(null);
        setActionValue({});
        onClose();
    };

    const updateValue = (key: string, value: any) => {
        setActionValue(prev => ({ ...prev, [key]: value }));
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
                                icon={step === 'configure' ? 'arrow-left' : 'close'}
                                size={24}
                                iconColor={theme.text}
                                onPress={() => step === 'configure' ? setStep('select') : handleClose()}
                            />
                            <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                                {step === 'select' ? 'Select Device' : 'Configure Action'}
                            </Text>
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.content}>
                            {step === 'select' ? (
                                // Step 1: Entity Selection
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Choose which device to control in this scene
                                    </Text>
                                    {entities.length === 0 ? (
                                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔌</Text>
                                            <Text style={{ color: theme.textSecondary }}>No controllable devices found</Text>
                                        </View>
                                    ) : (
                                        entities.map((entity) => (
                                            <TouchableOpacity
                                                key={entity.id}
                                                onPress={() => handleEntitySelect(entity)}
                                                style={[styles.entityItem, {
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                                    borderColor: borderColor
                                                }]}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4 }}>
                                                        {entity.name}
                                                    </Text>
                                                    <Chip mode="outlined" compact textStyle={{ fontSize: 11 }}>
                                                        {entity.entity_type}
                                                    </Chip>
                                                </View>
                                                <IconButton icon="chevron-right" size={24} iconColor={theme.textSecondary} />
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            ) : (
                                // Step 2: Action Configuration
                                <View>
                                    {selectedEntity && (
                                        <>
                                            <View style={[styles.selectedEntityCard, {
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                                borderColor: theme.primary
                                            }]}>
                                                <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 4 }}>
                                                    {selectedEntity.name}
                                                </Text>
                                                <Chip mode="flat" compact>
                                                    {selectedEntity.entity_type}
                                                </Chip>
                                            </View>

                                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 20, marginTop: 8 }}>
                                                Configure what this device should do
                                            </Text>

                                            {/* Power Control */}
                                            <View style={styles.controlSection}>
                                                <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                                                    POWER
                                                </Text>
                                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                                    <TouchableOpacity
                                                        onPress={() => updateValue('power', true)}
                                                        style={[
                                                            styles.powerButton,
                                                            {
                                                                backgroundColor: actionValue.power ? theme.primary : 'transparent',
                                                                borderColor: actionValue.power ? theme.primary : borderColor,
                                                            }
                                                        ]}
                                                    >
                                                        <Text style={{
                                                            color: actionValue.power ? '#FFFFFF' : theme.text,
                                                            fontWeight: '600',
                                                            fontSize: 16
                                                        }}>
                                                            ON
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => updateValue('power', false)}
                                                        style={[
                                                            styles.powerButton,
                                                            {
                                                                backgroundColor: !actionValue.power ? theme.error : 'transparent',
                                                                borderColor: !actionValue.power ? theme.error : borderColor,
                                                            }
                                                        ]}
                                                    >
                                                        <Text style={{
                                                            color: !actionValue.power ? '#FFFFFF' : theme.text,
                                                            fontWeight: '600',
                                                            fontSize: 16
                                                        }}>
                                                            OFF
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {/* Brightness Control (Lights) */}
                                            {selectedEntity.entity_type === 'light' && actionValue.brightness !== undefined && (
                                                <View style={styles.controlSection}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <Text variant="titleSmall" style={{ color: theme.text, fontWeight: '600' }}>
                                                            BRIGHTNESS
                                                        </Text>
                                                        <Text variant="titleMedium" style={{ color: theme.primary, fontWeight: 'bold' }}>
                                                            {actionValue.brightness}%
                                                        </Text>
                                                    </View>
                                                    <Slider
                                                        value={actionValue.brightness}
                                                        onValueChange={(value) => updateValue('brightness', Math.round(value))}
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

                                            {/* Speed Control (Fans) */}
                                            {selectedEntity.entity_type === 'fan' && actionValue.speed !== undefined && (
                                                <View style={styles.controlSection}>
                                                    <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12, fontWeight: '600' }}>
                                                        SPEED
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                                                        {[1, 2, 3, 4, 5].map((speed) => (
                                                            <TouchableOpacity
                                                                key={speed}
                                                                onPress={() => updateValue('speed', speed)}
                                                                style={[
                                                                    styles.speedButton,
                                                                    {
                                                                        backgroundColor: actionValue.speed === speed ? theme.primary : 'transparent',
                                                                        borderColor: actionValue.speed === speed ? theme.primary : borderColor,
                                                                    }
                                                                ]}
                                                            >
                                                                <Text style={{
                                                                    color: actionValue.speed === speed ? '#FFFFFF' : theme.text,
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {speed}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        {step === 'configure' && (
                            <View style={[styles.footer, { borderTopColor: borderColor }]}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setStep('select')}
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
    entityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    selectedEntityCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 8,
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
