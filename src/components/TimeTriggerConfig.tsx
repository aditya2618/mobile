import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

interface TimeTriggerConfigProps {
    trigger: {
        time_of_day?: string;
        days_of_week?: number[];
    };
    onChange: (trigger: any) => void;
}

export default function TimeTriggerConfig({ trigger, onChange }: TimeTriggerConfigProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Safety check
    if (!theme) {
        return null;
    }

    const [time, setTime] = useState(trigger.time_of_day || '08:00');
    const [selectedDays, setSelectedDays] = useState<number[]>(trigger.days_of_week || []);

    const days = [
        { label: 'Mon', value: 0 },
        { label: 'Tue', value: 1 },
        { label: 'Wed', value: 2 },
        { label: 'Thu', value: 3 },
        { label: 'Fri', value: 4 },
        { label: 'Sat', value: 5 },
        { label: 'Sun', value: 6 },
    ];

    const handleTimeChange = (newTime: string) => {
        setTime(newTime);
        onChange({
            ...trigger,
            trigger_type: 'time',
            time_of_day: newTime,
            days_of_week: selectedDays.length > 0 ? selectedDays : null,
        });
    };

    const toggleDay = (dayValue: number) => {
        const newDays = selectedDays.includes(dayValue)
            ? selectedDays.filter(d => d !== dayValue)
            : [...selectedDays, dayValue].sort();

        setSelectedDays(newDays);
        onChange({
            ...trigger,
            trigger_type: 'time',
            time_of_day: time,
            days_of_week: newDays.length > 0 ? newDays : null,
        });
    };

    return (
        <View style={styles.container}>
            <Text variant="labelLarge" style={[styles.label, { color: theme.text }]}>
                ⏰ Time of Day
            </Text>
            <TextInput
                mode="outlined"
                value={time}
                onChangeText={handleTimeChange}
                placeholder="HH:MM (e.g., 08:00, 18:30)"
                style={[styles.input, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}
                theme={{
                    colors: {
                        onSurfaceVariant: theme.textSecondary,
                        outline: isDark ? theme.border : 'rgba(0,0,0,0.2)',
                        primary: theme.primary,
                    }
                }}
                textColor={theme.text}
                left={<TextInput.Icon icon="clock-outline" color={theme.primary} />}
            />
            <Text variant="bodySmall" style={[styles.hint, { color: theme.textSecondary }]}>
                24-hour format (e.g., 08:00 for 8 AM, 18:30 for 6:30 PM)
            </Text>

            <Text variant="labelLarge" style={[styles.label, { color: theme.text, marginTop: 16 }]}>
                📅 Days of Week
            </Text>
            <View style={styles.daysContainer}>
                {days.map((day) => (
                    <Chip
                        key={day.value}
                        selected={selectedDays.includes(day.value)}
                        onPress={() => toggleDay(day.value)}
                        style={[
                            styles.dayChip,
                            selectedDays.includes(day.value) && { backgroundColor: theme.primary }
                        ]}
                        textStyle={{
                            color: selectedDays.includes(day.value) ? '#fff' : theme.text
                        }}
                    >
                        {day.label}
                    </Chip>
                ))}
            </View>
            <Text variant="bodySmall" style={[styles.hint, { color: theme.textSecondary }]}>
                {selectedDays.length === 0
                    ? 'No days selected = Every day'
                    : selectedDays.length === 7
                        ? 'All days selected'
                        : `Selected: ${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        marginBottom: 4,
    },
    hint: {
        marginTop: 4,
        fontStyle: 'italic',
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    dayChip: {
        marginRight: 4,
        marginBottom: 4,
    },
});
