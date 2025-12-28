import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { Text, Card, Button, Avatar, Divider, Switch, TextInput, List, IconButton, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useHomeStore } from '../store/homeStore';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { theme, mode, toggleTheme } = useTheme();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const updateProfile = useAuthStore((s) => s.updateProfile);
    const changePassword = useAuthStore((s) => s.changePassword);

    const { selectedHome, homes, setSelectedHome, setHomes } = useHomeStore();

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

    // Home selection state
    const [homeSelectModalVisible, setHomeSelectModalVisible] = useState(false);
    const [loadingHomes, setLoadingHomes] = useState(false);
    const [editingHomeName, setEditingHomeName] = useState(false);
    const [newHomeName, setNewHomeName] = useState('');
    const [savingHomeName, setSavingHomeName] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    // Load homes on mount
    useEffect(() => {
        loadHomes();
    }, []);

    const loadHomes = async () => {
        setLoadingHomes(true);
        try {
            const response = await apiClient.get('/homes/');
            setHomes(response.data);

            // Auto-select first home if none selected
            if (!selectedHome && response.data.length > 0) {
                await setSelectedHome(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to load homes:', error);
        } finally {
            setLoadingHomes(false);
        }
    };

    const handleSelectHome = async (home: any) => {
        await setSelectedHome(home);
        setHomeSelectModalVisible(false);
    };

    const handleUpdateHomeName = async () => {
        if (!selectedHome || !newHomeName.trim()) return;

        setSavingHomeName(true);
        try {
            await apiClient.patch(`/homes/${selectedHome.id}/`, {
                name: newHomeName.trim()
            });

            // Update local state
            const updatedHome = { ...selectedHome, name: newHomeName.trim() };
            await setSelectedHome(updatedHome);

            // Update homes list
            const updatedHomes = homes.map(h =>
                h.id === selectedHome.id ? updatedHome : h
            );
            setHomes(updatedHomes);

            Alert.alert('Success', 'Home name updated successfully!');
            setEditingHomeName(false);
            setNewHomeName('');
        } catch (error: any) {
            console.error('Failed to update home name:', error);
            Alert.alert('Error', 'Failed to update home name. Please try again.');
        } finally {
            setSavingHomeName(false);
        }
    };

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

                {/* User Profile Card - keeping existing code */}
                <Card style={[styles.profileCard, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    {/* ... existing profile code ... */}
                </Card>

                {/* Home Selection Card - NEW */}
                <Card style={[styles.card, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, fontWeight: 'bold', marginBottom: 16 }}>
                            🏠 Selected Home
                        </Text>

                        {editingHomeName ? (
                            <>
                                <TextInput
                                    value={newHomeName}
                                    onChangeText={setNewHomeName}
                                    mode="outlined"
                                    label="Home Name"
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
                                <View style={styles.editButtons}>
                                    <Button
                                        mode="outlined"
                                        onPress={() => {
                                            setEditingHomeName(false);
                                            setNewHomeName('');
                                        }}
                                        style={styles.editButton}
                                        textColor={theme.textSecondary}
                                        disabled={savingHomeName}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={handleUpdateHomeName}
                                        style={styles.editButton}
                                        buttonColor={theme.primary}
                                        loading={savingHomeName}
                                        disabled={savingHomeName || !newHomeName.trim()}
                                    >
                                        Save
                                    </Button>
                                </View>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity onPress={() => setHomeSelectModalVisible(true)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600' }}>
                                                {selectedHome?.name || 'No home selected'}
                                            </Text>
                                            {selectedHome && (
                                                <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                                    ID: {selectedHome.identifier}
                                                </Text>
                                            )}
                                        </View>
                                        <IconButton icon="chevron-down" size={24} iconColor={theme.textSecondary} />
                                    </View>
                                </TouchableOpacity>

                                {selectedHome && (
                                    <Button
                                        mode="outlined"
                                        onPress={() => {
                                            setNewHomeName(selectedHome.name);
                                            setEditingHomeName(true);
                                        }}
                                        icon="pencil"
                                        textColor={theme.primary}
                                        style={{ marginTop: 8 }}
                                    >
                                        Edit Name
                                    </Button>
                                )}
                            </>
                        )}
                    </Card.Content>
                </Card>

                {/* Rest of existing cards (password change, app settings, etc.) */}
                {/* ... */}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Home Selection Modal */}
            <Modal
                visible={homeSelectModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setHomeSelectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text variant="titleLarge" style={{ color: theme.text, fontWeight: 'bold' }}>
                                Select Home
                            </Text>
                            <IconButton
                                icon="close"
                                size={24}
                                onPress={() => setHomeSelectModalVisible(false)}
                                iconColor={theme.textSecondary}
                            />
                        </View>

                        {loadingHomes ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={theme.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={homes}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => handleSelectHome(item)}>
                                        <View style={[
                                            styles.homeItem,
                                            selectedHome?.id === item.id && { backgroundColor: `${theme.primary}15` }
                                        ]}>
                                            <View style={{ flex: 1 }}>
                                                <Text variant="bodyLarge" style={{ color: theme.text, fontWeight: '600' }}>
                                                    🏠 {item.name}
                                                </Text>
                                                <Text variant="bodySmall" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                                    {item.identifier}
                                                </Text>
                                            </View>
                                            {selectedHome?.id === item.id && (
                                                <IconButton icon="check-circle" size={24} iconColor={theme.primary} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={{ padding: 40, alignItems: 'center' }}>
                                        <Text style={{ color: theme.textSecondary }}>No homes found</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 12,
    },
    homeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
});
