import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Avatar, Divider, Switch, TextInput, List, IconButton, Portal, RadioButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useHomeStore } from '../store/homeStore';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { smartApi } from '../api/smartClient';
import { getCloudModePreference, setCloudModePreference, getForceCloudPreference, setForceCloudPreference, getNetworkModeLabel, NetworkMode } from '../api/networkMode';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { theme, mode, toggleTheme } = useTheme();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const updateProfile = useAuthStore((s) => s.updateProfile);
    const changePassword = useAuthStore((s) => s.changePassword);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedEmail, setEditedEmail] = useState(user?.email || '');
    const [editedFirstName, setEditedFirstName] = useState(user?.first_name || '');
    const [editedLastName, setEditedLastName] = useState(user?.last_name || '');
    const [saving, setSaving] = useState(false);

    // Password change state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Home management state (single home - rename only)
    const selectedHome = useHomeStore((s) => s.selectedHome);
    const setSelectedHome = useHomeStore((s) => s.setSelectedHome);
    const loadHomes = useHomeStore((s) => s.loadHomes);
    const [isRenamingHome, setIsRenamingHome] = useState(false);
    const [newHomeName, setNewHomeName] = useState('');
    const [savingHomeName, setSavingHomeName] = useState(false);

    // Cloud access state
    const [cloudEnabled, setCloudEnabled] = useState(false);
    const [forceCloudOnly, setForceCloudOnly] = useState(false);
    const [togglingCloud, setTogglingCloud] = useState(false);
    const [currentNetworkMode, setCurrentNetworkMode] = useState<NetworkMode>('local');

    useEffect(() => {
        loadHomes();
        loadCloudSettings();
    }, []);

    const loadCloudSettings = async () => {
        // Load user's preferences
        const cloudPref = await getCloudModePreference();
        const forcePref = await getForceCloudPreference();
        setCloudEnabled(cloudPref);
        setForceCloudOnly(forcePref);
        // Get current actual mode
        const mode = smartApi.getMode();
        setCurrentNetworkMode(mode);
    };

    const handleRenameHome = async () => {
        if (!newHomeName.trim() || !selectedHome) return;
        setSavingHomeName(true);
        try {
            const { apiClient } = require('../api/client');
            await apiClient.patch(`/homes/${selectedHome.id}/`, { name: newHomeName.trim() });
            // Update the selected home with new name
            setSelectedHome({ ...selectedHome, name: newHomeName.trim() });
            setIsRenamingHome(false);
            setNewHomeName('');
            Alert.alert('Success', 'Home name updated!');
        } catch (error: any) {
            console.error('Failed to rename home:', error);
            Alert.alert('Error', 'Failed to rename home. Please try again.');
        } finally {
            setSavingHomeName(false);
        }
    };

    const handleCloudToggle = async (value: boolean) => {
        setTogglingCloud(true);
        try {
            // Save preference
            await setCloudModePreference(value);
            setCloudEnabled(value);

            // Set home ID and re-detect network mode
            if (selectedHome) {
                smartApi.setHomeId(selectedHome.id.toString());
            }
            const newMode = await smartApi.refresh();
            setCurrentNetworkMode(newMode);

            Alert.alert(
                'Cloud Access',
                value
                    ? `Cloud access enabled. Current connection: ${getNetworkModeLabel(newMode)}`
                    : `Cloud access disabled. Using local connection only.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Failed to toggle cloud:', error);
            Alert.alert('Error', 'Failed to update cloud settings.');
        } finally {
            setTogglingCloud(false);
        }
    };

    const handleForceCloudToggle = async (value: boolean) => {
        setTogglingCloud(true);
        try {
            await setForceCloudPreference(value);
            setForceCloudOnly(value);

            // Set home ID and re-detect network mode
            if (selectedHome) {
                smartApi.setHomeId(selectedHome.id.toString());
            }
            const newMode = await smartApi.refresh();
            setCurrentNetworkMode(newMode);

            Alert.alert(
                'Force Cloud Only',
                value
                    ? `Force Cloud mode enabled. All requests will use cloud server.`
                    : `Force Cloud disabled. Local server will be preferred when available.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Failed to toggle force cloud:', error);
            Alert.alert('Error', 'Failed to update cloud settings.');
        } finally {
            setTogglingCloud(false);
        }
    };

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => logout()
                }
            ]
        );
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateProfile(editedEmail, editedFirstName, editedLastName);
            Alert.alert('Success', 'Profile updated successfully!');
            setIsEditingProfile(false);
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedEmail(user?.email || '');
        setEditedFirstName(user?.first_name || '');
        setEditedLastName(user?.last_name || '');
        setIsEditingProfile(false);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password changed successfully!');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Failed to change password:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to change password. Please try again.');
        } finally {
            setChangingPassword(false);
        }
    };

    // Get initials for avatar
    const getInitials = (firstName: string, lastName: string, username: string) => {
        if (firstName && lastName) {
            return (firstName[0] + lastName[0]).toUpperCase();
        }
        return username
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayName = user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.username || 'User';

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                        Settings
                    </Text>
                </View>

                {/* User Profile Card */}
                <Card style={[styles.profileCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <View style={styles.profileHeader}>
                            <View style={styles.profileInfo}>
                                <Avatar.Text
                                    size={64}
                                    label={getInitials(user?.first_name || '', user?.last_name || '', user?.username || 'U')}
                                    style={{ backgroundColor: theme.primary }}
                                />
                                <View style={styles.profileText}>
                                    {isEditingProfile ? (
                                        <>
                                            <TextInput
                                                value={user?.username || ''}
                                                mode="outlined"
                                                label="Username"
                                                disabled={true}
                                                style={styles.input}
                                                theme={{
                                                    colors: {
                                                        onSurfaceVariant: theme.textDisabled,
                                                        onSurface: theme.textDisabled,
                                                        outline: theme.border,
                                                        primary: theme.primary,
                                                        background: cardBg,
                                                    }
                                                }}
                                                textColor={theme.textDisabled}
                                                outlineColor={theme.border}
                                                activeOutlineColor={theme.border}
                                                right={<TextInput.Icon icon="lock" color={theme.textDisabled} />}
                                            />
                                            <TextInput
                                                value={editedFirstName}
                                                onChangeText={setEditedFirstName}
                                                mode="outlined"
                                                label="First Name"
                                                style={styles.input}
                                                theme={{
                                                    colors: {
                                                        onSurfaceVariant: theme.textSecondary,
                                                        onSurface: theme.text,
                                                        outline: theme.border,
                                                        primary: theme.primary,
                                                        background: cardBg,
                                                    }
                                                }}
                                                textColor={theme.text}
                                                outlineColor={theme.border}
                                                activeOutlineColor={theme.primary}
                                            />
                                            <TextInput
                                                value={editedLastName}
                                                onChangeText={setEditedLastName}
                                                mode="outlined"
                                                label="Last Name"
                                                style={styles.input}
                                                theme={{
                                                    colors: {
                                                        onSurfaceVariant: theme.textSecondary,
                                                        onSurface: theme.text,
                                                        outline: theme.border,
                                                        primary: theme.primary,
                                                        background: cardBg,
                                                    }
                                                }}
                                                textColor={theme.text}
                                                outlineColor={theme.border}
                                                activeOutlineColor={theme.primary}
                                            />
                                            <TextInput
                                                value={editedEmail}
                                                onChangeText={setEditedEmail}
                                                mode="outlined"
                                                label="Email"
                                                keyboardType="email-address"
                                                style={styles.input}
                                                theme={{
                                                    colors: {
                                                        onSurfaceVariant: theme.textSecondary,
                                                        onSurface: theme.text,
                                                        outline: theme.border,
                                                        primary: theme.primary,
                                                        background: cardBg,
                                                    }
                                                }}
                                                textColor={theme.text}
                                                outlineColor={theme.border}
                                                activeOutlineColor={theme.primary}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold' }}>
                                                {displayName}
                                            </Text>
                                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 2 }}>
                                                @{user?.username || 'user'}
                                            </Text>
                                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                                {user?.email || 'No email set'}
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </View>

                            {isEditingProfile ? (
                                <View style={styles.editButtons}>
                                    <Button
                                        mode="outlined"
                                        onPress={handleCancelEdit}
                                        style={styles.editButton}
                                        textColor={theme.textSecondary}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={handleSaveProfile}
                                        style={styles.editButton}
                                        buttonColor={theme.primary}
                                        loading={saving}
                                        disabled={saving}
                                    >
                                        Save
                                    </Button>
                                </View>
                            ) : (
                                <Button
                                    mode="outlined"
                                    onPress={() => setIsEditingProfile(true)}
                                    icon="pencil"
                                    textColor={theme.primary}
                                >
                                    Edit
                                </Button>
                            )}
                        </View>
                    </Card.Content>
                </Card>

                {/* Change Password Card */}
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                                Change Password
                            </Text>
                            {!isChangingPassword && (
                                <Button
                                    mode="outlined"
                                    onPress={() => setIsChangingPassword(true)}
                                    icon="key"
                                    textColor={theme.primary}
                                    compact
                                >
                                    Change
                                </Button>
                            )}
                        </View>

                        {isChangingPassword && (
                            <>
                                <TextInput
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    mode="outlined"
                                    label="Current Password"
                                    secureTextEntry
                                    style={styles.input}
                                    theme={{
                                        colors: {
                                            onSurfaceVariant: theme.textSecondary,
                                            onSurface: theme.text,
                                            outline: theme.border,
                                            primary: theme.primary,
                                            background: cardBg,
                                        }
                                    }}
                                    textColor={theme.text}
                                    outlineColor={theme.border}
                                    activeOutlineColor={theme.primary}
                                    left={<TextInput.Icon icon="lock" color={theme.textSecondary} />}
                                />
                                <TextInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    mode="outlined"
                                    label="New Password"
                                    secureTextEntry
                                    style={styles.input}
                                    theme={{
                                        colors: {
                                            onSurfaceVariant: theme.textSecondary,
                                            onSurface: theme.text,
                                            outline: theme.border,
                                            primary: theme.primary,
                                            background: cardBg,
                                        }
                                    }}
                                    textColor={theme.text}
                                    outlineColor={theme.border}
                                    activeOutlineColor={theme.primary}
                                    left={<TextInput.Icon icon="lock-plus" color={theme.textSecondary} />}
                                />
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    mode="outlined"
                                    label="Confirm New Password"
                                    secureTextEntry
                                    style={styles.input}
                                    theme={{
                                        colors: {
                                            onSurfaceVariant: theme.textSecondary,
                                            onSurface: theme.text,
                                            outline: theme.border,
                                            primary: theme.primary,
                                            background: cardBg,
                                        }
                                    }}
                                    textColor={theme.text}
                                    outlineColor={theme.border}
                                    activeOutlineColor={theme.primary}
                                    left={<TextInput.Icon icon="lock-check" color={theme.textSecondary} />}
                                />

                                <View style={styles.editButtons}>
                                    <Button
                                        mode="outlined"
                                        onPress={() => {
                                            setIsChangingPassword(false);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                        }}
                                        style={styles.editButton}
                                        textColor={theme.textSecondary}
                                        disabled={changingPassword}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={handleChangePassword}
                                        style={styles.editButton}
                                        buttonColor={theme.primary}
                                        loading={changingPassword}
                                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                                    >
                                        Update Password
                                    </Button>
                                </View>
                            </>
                        )}
                    </Card.Content>
                </Card>

                {/* App Settings */}
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 16 }}>
                            App Settings
                        </Text>

                        <View style={styles.settingRow}>
                            <View>
                                <Text style={{ color: theme.text, fontSize: 16 }}>Dark Mode</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
                                    {isDark ? 'Enabled' : 'Disabled'}
                                </Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                color={theme.primary}
                            />
                        </View>

                        <Divider style={{ marginVertical: 12 }} />

                        {/* Home Name - Rename */}
                        <TouchableOpacity onPress={() => { setNewHomeName(selectedHome?.name || ''); setIsRenamingHome(true); }}>
                            <View style={styles.settingRow}>
                                <View>
                                    <Text style={{ color: theme.text, fontSize: 16 }}>Home Name</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
                                        {selectedHome?.name || 'My Home'}
                                    </Text>
                                </View>
                                <IconButton icon="pencil" size={24} iconColor={theme.textSecondary} />
                            </View>
                        </TouchableOpacity>

                        <Divider style={{ marginVertical: 12 }} />

                        {/* Cloud Access Toggle */}
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.text, fontSize: 16 }}>Cloud Access</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
                                    {cloudEnabled ? 'Enabled' : 'Disabled'} • {getNetworkModeLabel(currentNetworkMode)}
                                </Text>
                            </View>
                            {togglingCloud ? (
                                <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
                            ) : (
                                <Switch
                                    value={cloudEnabled}
                                    onValueChange={handleCloudToggle}
                                    color={theme.primary}
                                    disabled={togglingCloud}
                                />
                            )}
                        </View>

                        {/* Force Cloud Only Toggle - only show when cloud is enabled */}
                        {cloudEnabled && (
                            <>
                                <Divider style={{ marginVertical: 12 }} />
                                <View style={styles.settingRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.text, fontSize: 16 }}>Force Cloud Only</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
                                            Bypass local server, always use cloud
                                        </Text>
                                    </View>
                                    {togglingCloud ? (
                                        <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
                                    ) : (
                                        <Switch
                                            value={forceCloudOnly}
                                            onValueChange={handleForceCloudToggle}
                                            color={theme.primary}
                                            disabled={togglingCloud}
                                        />
                                    )}
                                </View>
                            </>
                        )}
                    </Card.Content>
                </Card>

                {/* Energy Monitor */}
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <TouchableOpacity onPress={() => navigation.navigate('EnergyDashboard' as never)}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Text style={{ fontSize: 28 }}>⚡</Text>
                                    <View>
                                        <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600' }}>
                                            Energy Monitor
                                        </Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
                                            Track power consumption
                                        </Text>
                                    </View>
                                </View>
                                <IconButton icon="chevron-right" size={24} iconColor={theme.textSecondary} />
                            </View>
                        </Card.Content>
                    </TouchableOpacity>
                </Card>

                {/* System Section */}
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 12 }}>
                            System
                        </Text>

                        <TouchableOpacity onPress={() => navigation.navigate('SystemStatus' as never)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Text style={{ fontSize: 24 }}>ℹ️</Text>
                                    <View>
                                        <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '500' }}>
                                            System Status
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }}>
                                            View system health and statistics
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
                            </View>
                        </TouchableOpacity>

                        <Divider style={{ marginVertical: 8 }} />

                        <TouchableOpacity onPress={() => navigation.navigate('Logs' as never)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Text style={{ fontSize: 24 }}>📝</Text>
                                    <View>
                                        <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '500' }}>
                                            View Logs
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 2 }}>
                                            Debug logs and error messages
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
                            </View>
                        </TouchableOpacity>
                    </Card.Content>
                </Card>

                {/* App Info */}
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 16 }}>
                            About
                        </Text>

                        <View style={styles.infoRow}>
                            <Text style={{ color: theme.textSecondary }}>Version</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>1.0.0</Text>
                        </View>
                        <Divider style={{ marginVertical: 12 }} />
                        <View style={styles.infoRow}>
                            <Text style={{ color: theme.textSecondary }}>Build</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>2024.1</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Logout */}
                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={[styles.logoutButton, { backgroundColor: theme.error }]}
                    icon="logout"
                    textColor="#fff"
                >
                    Logout
                </Button>

                <View style={{ height: 40 }} />

                {/* Home Rename Modal */}
                <Portal>
                    <Modal
                        visible={isRenamingHome}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setIsRenamingHome(false)}
                    >
                        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                                <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 16 }}>
                                    Rename Home
                                </Text>
                                <TextInput
                                    value={newHomeName}
                                    onChangeText={setNewHomeName}
                                    mode="outlined"
                                    label="Home Name"
                                    style={{ marginBottom: 16 }}
                                    theme={{
                                        colors: {
                                            onSurfaceVariant: theme.textSecondary,
                                            onSurface: theme.text,
                                            outline: theme.border,
                                            primary: theme.primary,
                                            background: cardBg,
                                        }
                                    }}
                                    textColor={theme.text}
                                />
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Button
                                        mode="outlined"
                                        onPress={() => setIsRenamingHome(false)}
                                        style={{ flex: 1 }}
                                        textColor={theme.textSecondary}
                                        disabled={savingHomeName}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={handleRenameHome}
                                        style={{ flex: 1 }}
                                        buttonColor={theme.primary}
                                        loading={savingHomeName}
                                        disabled={savingHomeName || !newHomeName.trim()}
                                    >
                                        Save
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </Portal>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    profileCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    profileHeader: {
        gap: 16,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    profileText: {
        flex: 1,
        gap: 4,
    },
    input: {
        backgroundColor: 'transparent',
        marginBottom: 8,
    },
    editButtons: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'flex-end',
    },
    editButton: {
        flex: 1,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoutButton: {
        marginHorizontal: 16,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: 24,
        borderRadius: 16,
    },
    homeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        paddingVertical: 6,
    },
});
