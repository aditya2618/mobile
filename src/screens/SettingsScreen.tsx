import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Divider, Switch, TextInput, List } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

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
                    </Card.Content>
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
        paddingVertical: 6,
    },
});
