import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, SegmentedButtons, IconButton } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useDeviceStore } from '../store/deviceStore';
import TimeTriggerConfig from './TimeTriggerConfig';
import SunTriggerConfig from './SunTriggerConfig';
import AddTriggerModal from './AddTriggerModal'; // Original entity trigger modal

interface AddTriggerModalV2Props {
    visible: boolean;
    onDismiss: () => void;
    onAdd: (trigger: any) => void;
}

export default function AddTriggerModalV2({ visible, onDismiss, onAdd }: AddTriggerModalV2Props) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Safety check for theme
    if (!theme) {
        return null;
    }

    const [triggerType, setTriggerType] = useState<'state' | 'time' | 'sun'>('state');
    const [showStateTriggerModal, setShowStateTriggerModal] = useState(false);

    const [timeTrigger, setTimeTrigger] = useState({
        time_of_day: '08:00',
        days_of_week: [] as number[]
    });

    const [sunTrigger, setSunTrigger] = useState({
        sun_event: 'sunrise',
        sun_offset: 0
    });

    const handleAddTrigger = () => {
        if (triggerType === 'state') {
            // Show original entity trigger modal
            setShowStateTriggerModal(true);
            return;
        }

        if (triggerType === 'time') {
            if (!timeTrigger.time_of_day) {
                Alert.alert('Error', 'Please set a time');
                return;
            }

            onAdd({
                trigger_type: 'time',
                ...timeTrigger
            });
        } else if (triggerType === 'sun') {
            onAdd({
                trigger_type: 'sun',
                ...sunTrigger
            });
        }

        // Reset and close
        setTimeTrigger({ time_of_day: '08:00', days_of_week: [] });
        setSunTrigger({ sun_event: 'sunrise', sun_offset: 0 });
        onDismiss();
    };

    const handleStateTriggerAdd = (entityId: number, entityName: string, attribute: string, operator: string, value: string) => {
        onAdd({
            trigger_type: 'state',
            entity: entityId,
            entity_name: entityName,
            attribute,
            operator,
            value
        });
        setShowStateTriggerModal(false);
        onDismiss();
    };

    return (
        <>
            <Modal
                visible={visible}
                onRequestClose={onDismiss}
                animationType="slide"
                transparent={true}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                                Add Trigger
                            </Text>
                            <IconButton
                                icon="close"
                                size={24}
                                iconColor={theme.text}
                                onPress={onDismiss}
                            />
                        </View>

                        <ScrollView style={styles.content}>
                            {/* Trigger Type Selector */}
                            <Card style={[styles.card, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
                                <Card.Content>
                                    <Text variant="titleSmall" style={{ color: theme.text, marginBottom: 12 }}>
                                        Trigger Type
                                    </Text>
                                    <SegmentedButtons
                                        value={triggerType}
                                        onValueChange={(value) => setTriggerType(value as any)}
                                        buttons={[
                                            {
                                                value: 'state',
                                                label: 'State',
                                                icon: 'chart-line',
                                            },
                                            {
                                                value: 'time',
                                                label: 'Time',
                                                icon: 'clock-outline',
                                            },
                                            {
                                                value: 'sun',
                                                label: 'Sun',
                                                icon: 'weather-sunny',
                                            },
                                        ]}
                                        theme={{
                                            colors: {
                                                secondaryContainer: theme.primary,
                                                onSecondaryContainer: '#fff',
                                            }
                                        }}
                                    />
                                </Card.Content>
                            </Card>

                            {/* Conditional Content Based on Type */}
                            {triggerType === 'state' && (
                                <Card style={[styles.card, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
                                    <Card.Content>
                                        <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                                            Click "Add Trigger" to configure entity state conditions
                                        </Text>
                                    </Card.Content>
                                </Card>
                            )}

                            {triggerType === 'time' && (
                                <Card style={[styles.card, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
                                    <Card.Content>
                                        <TimeTriggerConfig
                                            trigger={timeTrigger}
                                            onChange={setTimeTrigger}
                                        />
                                    </Card.Content>
                                </Card>
                            )}

                            {triggerType === 'sun' && (
                                <Card style={[styles.card, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
                                    <Card.Content>
                                        <SunTriggerConfig
                                            trigger={sunTrigger}
                                            onChange={setSunTrigger}
                                        />
                                    </Card.Content>
                                </Card>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Button
                                mode="outlined"
                                onPress={onDismiss}
                                style={{ flex: 1, marginRight: 8 }}
                                textColor={theme.text}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleAddTrigger}
                                style={{ flex: 1 }}
                                buttonColor={theme.primary}
                            >
                                Add Trigger
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Original State Trigger Modal */}
            <AddTriggerModal
                visible={showStateTriggerModal}
                entities={useDeviceStore((state) => state.devices).flatMap(d => d.entities?.map(e => ({
                    id: e.id,
                    name: e.name,
                    entity_type: e.entity_type
                })) || [])}
                onClose={() => setShowStateTriggerModal(false)}
                onAddTrigger={handleStateTriggerAdd}
                theme={theme}
                isDark={isDark}
            />
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    content: {
        maxHeight: '70%',
    },
    card: {
        margin: 16,
        marginTop: 0,
        elevation: 2,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
});
