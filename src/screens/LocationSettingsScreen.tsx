import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, HelperText, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useHomeStore } from '../store/homeStore';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';

export default function LocationSettingsScreen() {
    const navigation = useNavigation();
    const { theme, mode } = useTheme();
    const selectedHome = useHomeStore(s => s.selectedHome);

    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [timezone, setTimezone] = useState('');
    const [elevation, setElevation] = useState('0');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    useEffect(() => {
        loadLocation();
    }, [selectedHome]);

    const loadLocation = async () => {
        if (!selectedHome) return; // Changed activeHome to selectedHome

        setLoading(true);
        try {
            const { apiClient } = require('../api/client'); // Introduced apiClient here as per instruction
            // Fetch home details which now include location
            const response = await apiClient.get(`/homes/${selectedHome.id}/`); // Changed api to apiClient and activeHome to selectedHome
            const home = response.data;

            if (home.latitude) setLatitude(home.latitude.toString());
            if (home.longitude) setLongitude(home.longitude.toString());
            if (home.timezone) setTimezone(home.timezone);
            if (home.elevation) setElevation(home.elevation.toString());
        } catch (error) {
            console.error('Failed to load location:', error);
            // Don't alert on load error, just leave fields empty
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedHome) return;

        // Basic validation
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            Alert.alert('Invalid Latitude', 'Must be between -90 and 90');
            return;
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
            Alert.alert('Invalid Longitude', 'Must be between -180 and 180');
            return;
        }
        if (!timezone) {
            Alert.alert('Missing Timezone', 'Please enter a valid timezone (e.g. UTC, Asia/Kolkata)');
            return;
        }

        setSaving(true);
        try {
            const { apiClient } = require('../api/client');
            await apiClient.put(`/homes/${selectedHome.id}/location/`, {
                latitude: lat,
                longitude: lon,
                timezone: timezone.trim(),
                elevation: parseInt(elevation) || 0
            });
            Alert.alert('Success', 'Location settings updated successfully');
            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save location:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to update location');
        } finally {
            setSaving(false);
        }
    };

    const detectLocation = () => {
        // Placeholder for future geolocation implementation
        Alert.alert('Coming Soon', 'Automatic location detection will be available in a future update. Please enter coordinates manually for now.');
    };

    if (!selectedHome) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>No active home selected</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    iconColor={theme.text}
                    onPress={() => navigation.goBack()}
                />
                <Text variant="headlineSmall" style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                    Location Settings
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginBottom: 20 }}>
                            Configure your home's location to enable accurate sunrise/sunset automation triggers.
                        </Text>

                        {loading ? (
                            <ActivityIndicator animating={true} color={theme.primary} style={{ padding: 20 }} />
                        ) : (
                            <>
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <TextInput
                                            label="Latitude"
                                            value={latitude}
                                            onChangeText={setLatitude}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            textColor={theme.text}
                                            style={{ backgroundColor: cardBg }}
                                            theme={{ colors: { primary: theme.primary, outline: theme.border } }}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <TextInput
                                            label="Longitude"
                                            value={longitude}
                                            onChangeText={setLongitude}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            textColor={theme.text}
                                            style={{ backgroundColor: cardBg }}
                                            theme={{ colors: { primary: theme.primary, outline: theme.border } }}
                                        />
                                    </View>
                                </View>

                                <TextInput
                                    label="Timezone (e.g. Asia/Kolkata)"
                                    value={timezone}
                                    onChangeText={setTimezone}
                                    mode="outlined"
                                    textColor={theme.text}
                                    style={{ backgroundColor: cardBg, marginTop: 16 }}
                                    theme={{ colors: { primary: theme.primary, outline: theme.border } }}
                                />

                                <TextInput
                                    label="Elevation (meters)"
                                    value={elevation}
                                    onChangeText={setElevation}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    textColor={theme.text}
                                    style={{ backgroundColor: cardBg, marginTop: 16 }}
                                    theme={{ colors: { primary: theme.primary, outline: theme.border } }}
                                />

                                <Button
                                    mode="outlined"
                                    onPress={detectLocation}
                                    icon="crosshairs-gps"
                                    style={{ marginTop: 24, borderColor: theme.border }}
                                    textColor={theme.primary}
                                >
                                    Use Current Location
                                </Button>
                            </>
                        )}
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving || loading}
                    style={{ margin: 16, marginTop: 8 }}
                    buttonColor={theme.primary}
                    contentStyle={{ height: 50 }}
                >
                    Save Configuration
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingTop: 40,
    },
    content: {
        padding: 16,
    },
    card: {
        margin: 16,
        marginBottom: 8,
        borderRadius: 16,
        elevation: 0,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});
