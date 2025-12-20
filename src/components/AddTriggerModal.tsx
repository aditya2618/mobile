import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, Button, Chip, IconButton, Portal, Surface } from 'react-native-paper';
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

    // Common attributes for sensors
    const attributes = ['temperature', 'humidity', 'state', 'power', 'brightness'];
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

    const handleBack = () => {
        if (step === 'attribute') setStep('entity');
        else if (step === 'operator') setStep('attribute');
        else if (step === 'value') setStep('operator');
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
                                icon={step === 'entity' ? 'close' : 'arrow-left'}
                                size={24}
                                iconColor={theme.text}
                                onPress={() => step === 'entity' ? handleClose() : handleBack()}
                            />
                            <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                                Add Trigger
                            </Text>
                        </View>

                        {/* Progress */}
                        <View style={{ flexDirection: 'row', padding: 16, gap: 8 }}>
                            <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
                            <View style={[styles.progressDot, { backgroundColor: step !== 'entity' ? theme.primary : borderColor }]} />
                            <View style={[styles.progressDot, { backgroundColor: step === 'operator' || step === 'value' ? theme.primary : borderColor }]} />
                            <View style={[styles.progressDot, { backgroundColor: step === 'value' ? theme.primary : borderColor }]} />
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.content}>
                            {step === 'entity' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select which sensor or device to monitor
                                    </Text>
                                    {entities.length === 0 ? (
                                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                            <Text style={{ color: theme.textSecondary }}>No entities found</Text>
                                        </View>
                                    ) : (
                                        entities.map((entity) => (
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
                                        ))
                                    )}
                                </View>
                            )}

                            {step === 'attribute' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select which attribute to monitor on {selectedEntity?.name}
                                    </Text>
                                    {attributes.map((attr) => (
                                        <TouchableOpacity
                                            key={attr}
                                            onPress={() => handleAttributeSelect(attr)}
                                            style={[styles.listItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}
                                        >
                                            <Text variant="titleMedium" style={{ color: theme.text, flex: 1 }}>
                                                {attr}
                                            </Text>
                                            <IconButton icon="chevron-right" size={24} iconColor={theme.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {step === 'operator' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Select comparison operator
                                    </Text>
                                    {operators.map((op) => (
                                        <TouchableOpacity
                                            key={op.value}
                                            onPress={() => handleOperatorSelect(op.value)}
                                            style={[styles.listItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}
                                        >
                                            <Text variant="titleMedium" style={{ color: theme.text, flex: 1 }}>
                                                {op.label}
                                            </Text>
                                            <IconButton icon="chevron-right" size={24} iconColor={theme.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {step === 'value' && (
                                <View>
                                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        Enter the threshold value
                                    </Text>
                                    <View style={[styles.valueInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor }]}>
                                        <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                                            {selectedEntity?.name} {selectedAttribute} {selectedOperator}
                                        </Text>
                                        <TextInput
                                            value={value}
                                            onChangeText={setValue}
                                            placeholder="Enter value (e.g., 30)"
                                            placeholderTextColor={theme.textSecondary}
                                            keyboardType="numeric"
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: theme.text,
                                                fontSize: 24,
                                                fontWeight: 'bold',
                                                padding: 12,
                                            }}
                                        />
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        {step === 'value' && (
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
                                    onPress={handleAddTrigger}
                                    style={{ flex: 1 }}
                                    buttonColor={theme.primary}
                                    disabled={!value}
                                >
                                    Add Trigger
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
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flex: 1,
    },
    valueInput: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
    },
});
