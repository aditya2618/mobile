import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, Button, IconButton, Portal, Surface } from 'react-native-paper';
import { useState } from 'react';

interface Entity {
    id: number;
    name: string;
    entity_type: string;
}

interface AddTriggerModalProps {
    visible: boolean;
    entities: Entity[];
    onClose: () => void;
    onAddTrigger: (entityId: number, entityName: string, attribute: string, operator: string, value: string) => void;
    theme: any;
    isDark: boolean;
}

export default function AddTriggerModal({ visible, entities, onClose, onAddTrigger, theme, isDark }: AddTriggerModalProps) {
    const [step, setStep] = useState<'entity' | 'attribute' | 'operator' | 'value'>('entity');
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [selectedAttribute, setSelectedAttribute] = useState<string>('');
    const [selectedOperator, setSelectedOperator] = useState<string>('');
    const [value, setValue] = useState<string>('');

    // Dynamic attributes based on entity type and name
    const getAvailableAttributes = (entity: Entity): string[] => {
        const entityType = entity.entity_type.toLowerCase();
        const entityName = entity.name.toLowerCase();

        // For sensors, check the name to determine specific attributes
        if (entityType === 'sensor') {
            if (entityName.includes('temperature') || entityName.includes('temp')) {
                return ['temperature'];
            }
            if (entityName.includes('humidity') || entityName.includes('hum')) {
                return ['humidity'];
            }
            if (entityName.includes('motion') || entityName.includes('pir')) {
                return ['state'];
            }
            // Generic sensor
            return ['state', 'value'];
        }

        // For switches
        if (entityType === 'switch') {
            return ['state'];
        }

        // For lights
        if (entityType === 'light') {
            return ['state', 'brightness'];
        }

        // For fans
        if (entityType === 'fan') {
            return ['state', 'speed'];
        }

        // Default fallback
        return ['state'];
    };

    const operators = [
        { label: 'Greater than (>)', value: '>' },
        { label: 'Less than (<)', value: '<' },
        { label: 'Equals (==)', value: '==' },
    ];

    const handleEntitySelect = (entity: Entity) => {
        setSelectedEntity(entity);
        setStep('attribute');
    };

    const handleAttributeSelect = (attr: string) => {
        setSelectedAttribute(attr);
        setStep('operator');
    };

    const handleOperatorSelect = (op: string) => {
        setSelectedOperator(op);
        setStep('value');
    };

    const handleAddTrigger = () => {
        if (selectedEntity && selectedAttribute && selectedOperator && value) {
            onAddTrigger(selectedEntity.id, selectedEntity.name, selectedAttribute, selectedOperator, value);
            handleClose();
        }
    };

    const handleClose = () => {
        setStep('entity');
        setSelectedEntity(null);
        setSelectedAttribute('');
        setSelectedOperator('');
        setValue('');
        onClose();
    };

    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    return (
        <Portal>
            <Modal visible={visible} onRequestClose={handleClose} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <Surface style={[styles.modalContainer, { backgroundColor: theme.background }]} elevation={5}>
                        <View style={[styles.header, { borderBottomColor: borderColor }]}>
                            <IconButton icon="close" size={24} onPress={handleClose} iconColor={theme.text} />
                            <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                                Add Trigger - Step {step === 'entity' ? 1 : step === 'attribute' ? 2 : step === 'operator' ? 3 : 4}
                            </Text>
                        </View>

                        <ScrollView style={styles.content}>
                            {/* Step 1: Select Entity */}
                            {step === 'entity' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select entity to monitor
                                    </Text>
                                    {entities.map((entity) => (
                                        <TouchableOpacity
                                            key={entity.id}
                                            onPress={() => handleEntitySelect(entity)}
                                            style={[styles.listItem, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text variant="bodyLarge" style={{ color: theme.text }}>
                                                    {entity.name}
                                                </Text>
                                                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                                    {entity.entity_type}
                                                </Text>
                                            </View>
                                            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Step 2: Select Attribute (Dynamic based on entity type) */}
                            {step === 'attribute' && selectedEntity && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                        Select attribute for
                                    </Text>
                                    <Text variant="titleMedium" style={{ color: theme.primary, marginBottom: 16, fontWeight: 'bold' }}>
                                        {selectedEntity.name}
                                    </Text>
                                    {getAvailableAttributes(selectedEntity).map((attr) => (
                                        <TouchableOpacity
                                            key={attr}
                                            onPress={() => handleAttributeSelect(attr)}
                                            style={[styles.listItem, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}
                                        >
                                            <Text variant="bodyLarge" style={{ color: theme.text, flex: 1, textTransform: 'capitalize' }}>
                                                {attr}
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Step 3: Select Operator */}
                            {step === 'operator' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select comparison operator
                                    </Text>
                                    {operators.map((op) => (
                                        <TouchableOpacity
                                            key={op.value}
                                            onPress={() => handleOperatorSelect(op.value)}
                                            style={[styles.listItem, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}
                                        >
                                            <Text variant="bodyLarge" style={{ color: theme.text, flex: 1 }}>
                                                {op.label}
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Step 4: Enter Value */}
                            {step === 'value' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                        Enter value for
                                    </Text>
                                    <Text variant="titleMedium" style={{ color: theme.primary, marginBottom: 16, fontWeight: 'bold' }}>
                                        {selectedEntity?.name} → {selectedAttribute} {selectedOperator}
                                    </Text>
                                    <TextInput
                                        value={value}
                                        onChangeText={setValue}
                                        placeholder={selectedAttribute === 'temperature' ? 'e.g., 25' : selectedAttribute === 'humidity' ? 'e.g., 60' : 'e.g., ON'}
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType={selectedAttribute === 'state' ? 'default' : 'numeric'}
                                        style={[
                                            styles.valueInput,
                                            {
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                                color: theme.text,
                                                borderColor: theme.primary,
                                            },
                                        ]}
                                        autoFocus
                                    />
                                    <Button mode="contained" onPress={handleAddTrigger} disabled={!value} style={{ marginTop: 20 }} buttonColor={theme.primary}>
                                        Add Trigger
                                    </Button>
                                </View>
                            )}
                        </ScrollView>

                        {step !== 'entity' && (
                            <View style={[styles.footer, { borderTopColor: borderColor }]}>
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        if (step === 'attribute') setStep('entity');
                                        else if (step === 'operator') setStep('attribute');
                                        else if (step === 'value') setStep('operator');
                                    }}
                                    textColor={theme.text}
                                >
                                    Back
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    content: {
        padding: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    valueInput: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
});
