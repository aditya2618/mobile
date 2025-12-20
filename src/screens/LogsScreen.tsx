import { View, StyleSheet, ScrollView, RefreshControl, Share } from 'react-native';
import { Text, Button, Card, Chip, FAB } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { logger, LogEntry } from '../utils/logger';

export default function LogsScreen() {
    const { theme, mode } = useTheme();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const isDark = mode === 'dark';
    const cardBg = isDark ? theme.cardBackground : '#FFFFFF';
    const borderColor = isDark ? 'transparent' : 'rgba(0,0,0,0.08)';

    useEffect(() => {
        loadLogs();
    }, [filter]);

    const loadLogs = async () => {
        setRefreshing(true);
        try {
            let loadedLogs: LogEntry[];
            if (filter === 'all') {
                loadedLogs = await logger.getLogs();
            } else {
                loadedLogs = await logger.getLogsByLevel(filter);
            }
            setLogs(loadedLogs.reverse()); // Show newest first
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
        setRefreshing(false);
    };

    const handleClearLogs = async () => {
        await logger.clearLogs();
        setLogs([]);
    };

    const handleExportLogs = async () => {
        try {
            const logsText = await logger.exportLogs();
            await Share.share({
                message: logsText,
                title: 'App Logs Export',
            });
        } catch (error) {
            console.error('Failed to export logs:', error);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return '#ef4444';
            case 'warn': return '#f59e0b';
            case 'debug': return '#8b5cf6';
            default: return theme.primary;
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error': return '❌';
            case 'warn': return '⚠️';
            case 'debug': return '🔍';
            default: return 'ℹ️';
        }
    };

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ color: theme.text, fontWeight: 'bold' }}>
                        App Logs
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.textSecondary, marginTop: 4 }}>
                        {logs.length} log entries
                    </Text>
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    <Chip
                        selected={filter === 'all'}
                        onPress={() => setFilter('all')}
                        style={{ backgroundColor: filter === 'all' ? theme.primary : cardBg }}
                        textStyle={{ color: filter === 'all' ? '#FFF' : theme.text }}
                    >
                        All
                    </Chip>
                    <Chip
                        selected={filter === 'info'}
                        onPress={() => setFilter('info')}
                        style={{ backgroundColor: filter === 'info' ? theme.primary : cardBg }}
                        textStyle={{ color: filter === 'info' ? '#FFF' : theme.text }}
                    >
                        Info
                    </Chip>
                    <Chip
                        selected={filter === 'warn'}
                        onPress={() => setFilter('warn')}
                        style={{ backgroundColor: filter === 'warn' ? '#f59e0b' : cardBg }}
                        textStyle={{ color: filter === 'warn' ? '#FFF' : theme.text }}
                    >
                        Warnings
                    </Chip>
                    <Chip
                        selected={filter === 'error'}
                        onPress={() => setFilter('error')}
                        style={{ backgroundColor: filter === 'error' ? '#ef4444' : cardBg }}
                        textStyle={{ color: filter === 'error' ? '#FFF' : theme.text }}
                    >
                        Errors
                    </Chip>
                    <Chip
                        selected={filter === 'debug'}
                        onPress={() => setFilter('debug')}
                        style={{ backgroundColor: filter === 'debug' ? '#8b5cf6' : cardBg }}
                        textStyle={{ color: filter === 'debug' ? '#FFF' : theme.text }}
                    >
                        Debug
                    </Chip>
                </ScrollView>

                {/* Logs List */}
                <ScrollView
                    style={styles.logsList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={loadLogs}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {logs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
                            <Text variant="titleMedium" style={{ color: theme.text, marginBottom: 8 }}>
                                No Logs
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                                Logs will appear here as the app runs
                            </Text>
                        </View>
                    ) : (
                        logs.map((log, index) => (
                            <Card
                                key={index}
                                style={[
                                    styles.logCard,
                                    {
                                        backgroundColor: cardBg,
                                        borderLeftWidth: 4,
                                        borderLeftColor: getLevelColor(log.level),
                                        borderColor,
                                        borderWidth: 1,
                                    }
                                ]}
                            >
                                <Card.Content>
                                    <View style={styles.logHeader}>
                                        <Text variant="labelSmall" style={{ color: getLevelColor(log.level), fontWeight: 'bold' }}>
                                            {getLevelIcon(log.level)} {log.level.toUpperCase()}
                                        </Text>
                                        <Text variant="labelSmall" style={{ color: theme.textSecondary }}>
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={{ color: theme.text, marginTop: 8 }}>
                                        {log.message}
                                    </Text>
                                    {log.data && (
                                        <Text
                                            variant="bodySmall"
                                            style={{
                                                color: theme.textSecondary,
                                                marginTop: 4,
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {JSON.stringify(log.data, null, 2)}
                                        </Text>
                                    )}
                                </Card.Content>
                            </Card>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Action Buttons */}
                <View style={[styles.actionBar, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
                    <Button
                        mode="outlined"
                        onPress={handleClearLogs}
                        icon="delete"
                        textColor={theme.error}
                        style={{ flex: 1 }}
                    >
                        Clear Logs
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleExportLogs}
                        icon="share"
                        buttonColor={theme.primary}
                        style={{ flex: 1 }}
                    >
                        Export
                    </Button>
                </View>

                {/* Refresh FAB */}
                <FAB
                    icon="refresh"
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={loadLogs}
                    color="#FFFFFF"
                    size="small"
                />
            </View>
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
    filterContainer: {
        maxHeight: 50,
        marginBottom: 12,
    },
    logsList: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    logCard: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionBar: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});
