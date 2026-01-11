<template>
    <div v-if="hasIssues" class="validation-icons">
        <!-- Error icons -->
        <div v-for="i in counts.errors" :key="`error-${i}`" class="validation-icon error" :title="getErrorMessages()">
            🤨
        </div>
        <!-- Warning icons -->
        <div v-for="i in counts.warnings" :key="`warning-${i}`" class="validation-icon warning" :title="getWarningMessages()">
            !
        </div>
        <!-- Info icons -->
        <div v-for="i in counts.info" :key="`info-${i}`" class="validation-icon info" :title="getInfoMessages()">
            i
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ValidationIssue } from '@/composables/useGraphValidation'

const props = defineProps<{
    issues: ValidationIssue[]
}>()

const counts = computed(() => ({
    errors: props.issues.filter(i => i.type === 'error').length,
    warnings: props.issues.filter(i => i.type === 'warning').length,
    info: props.issues.filter(i => i.type === 'info').length
}))

const hasIssues = computed(() => props.issues.length > 0)

const getErrorMessages = () => {
    return props.issues
        .filter(i => i.type === 'error')
        .map(i => i.message)
        .join('\n')
}

const getWarningMessages = () => {
    return props.issues
        .filter(i => i.type === 'warning')
        .map(i => i.message)
        .join('\n')
}

const getInfoMessages = () => {
    return props.issues
        .filter(i => i.type === 'info')
        .map(i => i.message)
        .join('\n')
}
</script>

<style scoped>
.validation-icons {
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    z-index: 10;
}

.validation-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    cursor: help;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.validation-icon.error {
    background: #f14c4c;
    color: white;
}

.validation-icon.warning {
    background: #f59e0b;
    color: white;
}

.validation-icon.info {
    background: #3b82f6;
    color: white;
}
</style>
