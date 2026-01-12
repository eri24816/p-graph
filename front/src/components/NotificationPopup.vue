<template>
    <div class="notification-container">
        <transition-group name="notification" tag="div">
            <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification"
                :class="notification.type"
            >
                <div class="notification-icon">
                    <span v-if="notification.type === 'success'">✓</span>
                    <span v-else-if="notification.type === 'error'">✕</span>
                    <span v-else-if="notification.type === 'warning'">⚠</span>
                    <span v-else>ℹ</span>
                </div>
                <div class="notification-message">{{ notification.message }}</div>
                <button class="notification-close" @click="remove(notification.id)">×</button>
            </div>
        </transition-group>
    </div>
</template>

<script setup lang="ts">
import { useNotification } from '@/composables/useNotification';

const { notifications, remove } = useNotification();
</script>

<style scoped>
.notification-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}

.notification {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 500px;
    padding: 12px 16px;
    background: #2d2d2d;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    backdrop-filter: blur(8px);
}

.notification-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: bold;
    font-size: 14px;
}

.notification-message {
    flex: 1;
    color: #e0e0e0;
    font-size: 14px;
    line-height: 1.4;
}

.notification-close {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #888;
    font-size: 20px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    padding: 0;
    line-height: 1;
}

.notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

/* Success */
.notification.success {
    border-left: 3px solid #4ec9b0;
}

.notification.success .notification-icon {
    background: rgba(78, 201, 176, 0.2);
    color: #4ec9b0;
}

/* Error */
.notification.error {
    border-left: 3px solid #f14c4c;
}

.notification.error .notification-icon {
    background: rgba(241, 76, 76, 0.2);
    color: #f14c4c;
}

/* Warning */
.notification.warning {
    border-left: 3px solid #f59e0b;
}

.notification.warning .notification-icon {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

/* Info */
.notification.info {
    border-left: 3px solid #3b82f6;
}

.notification.info .notification-icon {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

/* Animations */
.notification-enter-active {
    animation: notification-in 0.3s ease-out;
}

.notification-leave-active {
    animation: notification-out 0.3s ease-in;
}

@keyframes notification-in {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes notification-out {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(10px) scale(0.95);
    }
}
</style>
