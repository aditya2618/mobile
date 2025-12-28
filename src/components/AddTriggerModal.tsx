import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput as NativeTextInput, FlatList } from 'react-native';
import { Text, Button, IconButton, Portal, Surface, Searchbar, List, Divider, Chip } from 'react-native-paper';
import { useState, useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    const [searchQuery, setSearchQuery] = useState('');

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
        { label: 'Greater than', symbol: '>', value: '>' },
        { label: 'Less than', symbol: '<', value: '<' },
        { label: 'Equals', symbol: '==', value: '==' },
    ];

    const filteredEntities = useMemo(() => {
        return entities.filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [entities, searchQuery]);

    const handleEntitySelect = (entity: Entity) => {
        setSelectedEntity(entity);
        setStep('attribute');
        setSearchQuery('');
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
        setSearchQuery('');
        onClose();
    };

    const getIconForEntity = (type: string) => {
        switch (type.toLowerCase()) {
            case 'light': return 'lightbulb';
            case 'switch': return 'toggle-switch';
            case 'sensor': return 'access-point';
            case 'fan': return 'fan';
            default: return 'help-circle';
        }
    };

    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    return (
        <Portal>
            <Modal visible={visible} onRequestClose={handleClose} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <Surface style={[styles.modalContainer, { backgroundColor: theme.background }]} elevation={5}>
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: borderColor }]}>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold' }}>
                                    {step === 'entity' ? 'Select Entity' :
                                        step === 'attribute' ? 'Select Attribute' :
                                            step === 'operator' ? 'Condition' : 'Target Value'}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.textSecondary }}>
                                    Step {step === 'entity' ? 1 : step === 'attribute' ? 2 : step === 'operator' ? 3 : 4} of 4
                                </Text>
                            </View>
                            <IconButton icon="close" size={24} onPress={handleClose} iconColor={theme.text} />
                        </View>

                        <View style={styles.content}>
                            {/* Step 1: Select Entity */}
                            {step === 'entity' && (
                                <View style={{ flex: 1 }}>
                                    <Searchbar
                                        placeholder="Search devices..."
                                        onChangeText={setSearchQuery}
                                        value={searchQuery}
                                        style={[styles.searchBar, { backgroundColor: isDark ? theme.cardBackground : '#f0f0f0' }]}
                                        inputStyle={{ color: theme.text }}
                                        iconColor={theme.textSecondary}
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                    <FlatList
                                        data={filteredEntities}
                                        keyExtractor={item => item.id.toString()}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                        renderItem={({ item }) => (
                                            <List.Item
                                                title={item.name}
                                                description={item.entity_type}
                                                left={props => <List.Icon {...props} icon={getIconForEntity(item.entity_type)} color={theme.primary} />}
                                                right={props => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
                                                onPress={() => handleEntitySelect(item)}
                                                style={[styles.listItem, { backgroundColor: isDark ? theme.cardBackground : '#fff', borderColor, borderWidth: 1 }]}
                                                titleStyle={{ color: theme.text, fontWeight: '600' }}
                                                descriptionStyle={{ color: theme.textSecondary }}
                                                rippleColor={theme.primary + '20'}
                                            />
                                        )}
                                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                    />
                                </View>
                            )}

                            {/* Step 2: Select Attribute */}
                            {step === 'attribute' && selectedEntity && (
                                <ScrollView>
                                    <View style={[styles.summaryCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
                                        <MaterialCommunityIcons name={getIconForEntity(selectedEntity.entity_type)} size={24} color={theme.primary} />
                                        <Text style={{ marginLeft: 12, color: theme.text, fontWeight: 'bold', fontSize: 16 }}>
                                            {selectedEntity.name}
                                        </Text>
                                    </View>

                                    <Text variant="labelLarge" style={{ color: theme.textSecondary, marginBottom: 16, marginTop: 8 }}>
                                        Which property to track?
                                    </Text>

                                    {getAvailableAttributes(selectedEntity).map((attr) => (
                                        <List.Item
                                            key={attr}
                                            title={attr.charAt(0).toUpperCase() + attr.slice(1)}
                                            left={props => <List.Icon {...props} icon="chart-timeline-variant" color={theme.primary} />}
                                            right={props => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
                                            onPress={() => handleAttributeSelect(attr)}
                                            style={[styles.listItem, { backgroundColor: isDark ? theme.cardBackground : '#fff', borderColor, borderWidth: 1, marginBottom: 8 }]}
                                            titleStyle={{ color: theme.text, fontWeight: '600' }}
                                        />
                                    ))}
                                </ScrollView>
                            )}

                            {/* Step 3: Select Operator */}
                            {step === 'operator' && (
                                <ScrollView>
                                    <View style={styles.breadcrumb}>
                                        <Chip style={{ backgroundColor: theme.cardBackground }} textStyle={{ color: theme.text }}>{selectedEntity?.name}</Chip>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                        <Chip style={{ backgroundColor: theme.cardBackground }} textStyle={{ color: theme.text }}>{selectedAttribute}</Chip>
                                    </View>

                                    <Text variant="labelLarge" style={{ color: theme.textSecondary, marginBottom: 16 }}>
                                        When value is...
                                    </Text>

                                    {operators.map((op) => (
                                        <List.Item
                                            key={op.value}
                                            title={op.label}
                                            description={`Example: x ${op.symbol} y`}
                                            left={props => (
                                                <View style={[styles.symbolBox, { backgroundColor: theme.primary + '20' }]}>
                                                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 18 }}>{op.symbol}</Text>
                                                </View>
                                            )}
                                            right={props => <List.Icon {...props} icon="chevron-right" color={theme.textSecondary} />}
                                            onPress={() => handleOperatorSelect(op.value)}
                                            style={[styles.listItem, { backgroundColor: isDark ? theme.cardBackground : '#fff', borderColor, borderWidth: 1, marginBottom: 8 }]}
                                            titleStyle={{ color: theme.text, fontWeight: '600' }}
                                            descriptionStyle={{ color: theme.textSecondary }}
                                        />
                                    ))}
                                </ScrollView>
                            )}

                            {/* Step 4: Enter Value */}
                            {step === 'value' && (
                                <View>
                                    <View style={styles.breadcrumb}>
                                        <Chip style={{ backgroundColor: theme.cardBackground }} textStyle={{ color: theme.text }} compact>{selectedEntity?.name}</Chip>
                                        <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                                        <Chip style={{ backgroundColor: theme.cardBackground }} textStyle={{ color: theme.text }} compact>{selectedAttribute}</Chip>
                                        <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textSecondary} />
                                        <Chip style={{ backgroundColor: theme.cardBackground }} textStyle={{ color: theme.text }} compact>{operators.find(o => o.value === selectedOperator)?.symbol}</Chip>
                                    </View>

                                    <Text variant="headlineMedium" style={{ color: theme.primary, marginVertical: 24, textAlign: 'center', fontWeight: 'bold' }}>
                                        Target Value
                                    </Text>

                                    <NativeTextInput
                                        value={value}
                                        onChangeText={setValue}
                                        placeholder={selectedAttribute === 'temperature' ? 'e.g., 25' : selectedAttribute === 'humidity' ? 'e.g., 60' : 'e.g., ON'}
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType={selectedAttribute === 'state' ? 'default' : 'numeric'}
                                        style={[
                                            styles.valueInput,
                                            {
                                                backgroundColor: isDark ? theme.cardBackground : '#f0f0f0',
                                                color: theme.text,
                                                borderColor: theme.primary,
                                            },
                                        ]}
                                        autoFocus
                                    />

                                    <View style={styles.helperText}>
                                        <MaterialCommunityIcons name="information-outline" size={16} color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary, marginLeft: 6, fontSize: 13 }}>
                                            Trigger fires when condition becomes true
                                        </Text>
                                    </View>

                                    <Button
                                        mode="contained"
                                        onPress={handleAddTrigger}
                                        disabled={!value}
                                        style={{ marginTop: 32 }}
                                        buttonColor={theme.primary}
                                        contentStyle={{ height: 50 }}
                                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                                    >
                                        Create Trigger
                                    </Button>
                                </View>
                            )}
                        </View>

                        {/* Footer Navigation */}
                        {step !== 'entity' && (
                            <View style={[styles.footer, { borderTopColor: borderColor }]}>
                                <Button
                                    mode="text"
                                    icon="arrow-left"
                                    onPress={() => {
                                        if (step === 'attribute') setStep('entity');
                                        else if (step === 'operator') setStep('attribute');
                                        else if (step === 'value') setStep('operator');
                                    }}
                                    textColor={theme.textSecondary}
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: '92%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    searchBar: {
        marginBottom: 16,
        elevation: 0,
        borderRadius: 12,
    },
    listItem: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    symbolBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    valueInput: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    helperText: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'flex-start',
    },
});
