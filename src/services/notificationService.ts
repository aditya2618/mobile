import notifee, { AndroidImportance } from '@notifee/react-native';

/**
 * Notification Service
 * Handles displaying notifications for scene activation
 */

export interface NotificationOptions {
    title: string;
    body: string;
    icon?: 'scene' | 'success' | 'error';
}

/**
 * Show a notification
 */
export const showNotification = async ({
    title,
    body,
    icon = 'success',
}: NotificationOptions) => {
    try {
        // Request permission (Android 13+)
        await notifee.requestPermission();

        // Create notification channel
        const channelId = await notifee.createChannel({
            id: 'scene-activation',
            name: 'Scene Activation',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
        });

        // Display notification
        await notifee.displayNotification({
            title,
            body,
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
                sound: 'default',
                vibrationPattern: [300, 500],
            },
        });

        console.log('✅ Notification shown:', title);
    } catch (error) {
        console.error('❌ Notification error:', error);
    }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async () => {
    await notifee.cancelAllNotifications();
};

export default {
    showNotification,
    cancelAllNotifications,
};
