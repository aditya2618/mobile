import { View, ScrollView, StyleSheet, StatusBar } from "react-native";
import { Text, Button, Card, List, Switch } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useAuthStore } from "../store/authStore";

export default function SettingsScreen() {
    const { theme, mode, toggleTheme } = useTheme();
    const logout = useAuthStore((s) => s.logout);

    return (
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.background }]}>
                    <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                        Settings
                    </Text>
                </View>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 16 }}>
                            Appearance
                        </Text>
                        <List.Item
                            title="Dark Mode"
                            titleStyle={{ color: theme.text }}
                            description={mode === 'dark' ? 'Enabled' : 'Disabled'}
                            descriptionStyle={{ color: theme.textSecondary }}
                            left={(props) => <List.Icon {...props} icon="theme-light-dark" color={theme.primary} />}
                            right={() => (
                                <Switch
                                    value={mode === 'dark'}
                                    onValueChange={toggleTheme}
                                    color={theme.primary}
                                />
                            )}
                        />
                    </Card.Content>
                </Card>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 16 }}>
                            Account
                        </Text>
                        <Button
                            mode="contained"
                            onPress={logout}
                            buttonColor={theme.error}
                            style={styles.logoutButton}
                        >
                            Logout
                        </Button>
                    </Card.Content>
                </Card>

                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 16 }}>
                            About
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                            Smart Home App
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.textDisabled, marginTop: 4 }}>
                            Version 1.0.0
                        </Text>
                    </Card.Content>
                </Card>
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
        paddingTop: 50,
        paddingBottom: 20,
    },
    card: {
        margin: 16,
        marginTop: 8,
        borderRadius: 16,
        elevation: 2,
    },
    logoutButton: {
        marginTop: 8,
    },
});
