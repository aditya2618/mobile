import { useState } from "react";
import { View, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useHomeStore } from "../store/homeStore";

export default function AddHomeScreen({ onHomeCreated }: { onHomeCreated: () => void }) {
    const createHome = useHomeStore((s) => s.createHome);
    const [homeName, setHomeName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        if (!homeName.trim()) {
            setError("Please enter a home name");
            return;
        }

        setLoading(true);
        setError("");

        try {
            console.log("Creating home:", homeName);
            await createHome(homeName.trim());
            console.log("✅ Home created successfully!");
            onHomeCreated();
        } catch (error: any) {
            console.error("❌ Failed to create home:", error);
            setError(error.response?.data?.error || error.message || "Failed to create home. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor="#0f172a"
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.content}>
                    {/* Icon and Welcome */}
                    <View style={styles.header}>
                        <Text variant="displaySmall" style={styles.icon}>
                            🏡
                        </Text>
                        <Text variant="displaySmall" style={styles.title}>
                            Welcome!
                        </Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>
                            Let's create your first smart home
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <TextInput
                            label="Home Name"
                            value={homeName}
                            onChangeText={(text) => {
                                setHomeName(text);
                                setError("");
                            }}
                            mode="outlined"
                            placeholder="My Smart Home"
                            theme={{
                                colors: {
                                    onSurfaceVariant: '#94a3b8',
                                    outline: '#334155',
                                    primary: '#3b82f6',
                                }
                            }}
                            textColor="#e2e8f0"
                            style={styles.input}
                            left={<TextInput.Icon icon="home" color="#94a3b8" />}
                            autoFocus
                        />

                        {error ? (
                            <Text variant="bodySmall" style={styles.errorText}>
                                {error}
                            </Text>
                        ) : null}

                        <Text variant="bodySmall" style={styles.hint}>
                            💡 You can add rooms and devices after creating your home
                        </Text>

                        <Button
                            mode="contained"
                            onPress={handleCreate}
                            style={styles.button}
                            buttonColor="#3b82f6"
                            loading={loading}
                            disabled={loading || !homeName.trim()}
                            icon="plus-circle"
                        >
                            Create My Home
                        </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        justifyContent: "center",
        maxWidth: 400,
        width: "100%",
        alignSelf: "center",
        padding: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 48,
    },
    icon: {
        fontSize: 72,
        marginBottom: 16,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
        color: '#f1f5f9',
    },
    subtitle: {
        textAlign: "center",
        color: '#94a3b8',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#1e293b',
    },
    button: {
        marginTop: 16,
        paddingVertical: 8,
    },
    errorText: {
        color: '#ef4444',
        textAlign: "center",
        backgroundColor: '#7f1d1d',
        padding: 12,
        borderRadius: 8,
    },
    hint: {
        textAlign: "center",
        color: '#64748b',
        marginTop: 8,
    },
});
