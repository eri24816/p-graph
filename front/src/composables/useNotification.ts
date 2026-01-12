import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
}

const notifications = ref<Notification[]>([]);

export function useNotification() {
    const show = (message: string, type: NotificationType = 'info', duration: number = 3000) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const notification: Notification = {
            id,
            message,
            type,
            duration
        };

        notifications.value.push(notification);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                remove(id);
            }, duration);
        }

        return id;
    };

    const remove = (id: string) => {
        const index = notifications.value.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications.value.splice(index, 1);
        }
    };

    const success = (message: string, duration?: number) => show(message, 'success', duration);
    const error = (message: string, duration?: number) => show(message, 'error', duration);
    const info = (message: string, duration?: number) => show(message, 'info', duration);
    const warning = (message: string, duration?: number) => show(message, 'warning', duration);

    return {
        notifications,
        show,
        remove,
        success,
        error,
        info,
        warning
    };
}
