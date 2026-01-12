<template>
    <div v-if="hasIssues" class="validation-icons">
        <!-- Error icons -->
        <div v-for="i in counts.errors" :key="`error-${i}`" class="validation-icon error" :title="getErrorMessages()">
            <XCircle :size="12" />
        </div>
        <!-- Warning icons -->
        <div v-for="i in counts.warnings" :key="`warning-${i}`" class="validation-icon warning" :title="getWarningMessages()">
            <AlertTriangle :size="12" />
        </div>
        <!-- Info icons -->
        <div v-for="i in counts.info" :key="`info-${i}`" class="validation-icon info" :title="getInfoMessages()">
            <Info :size="12" />
        </div>
        <!-- Static issue icons -->
        <div v-for="i in counts.staticIssues" :key="`static-issue-${i}`" class="validation-icon static-issue" :title="getStaticIssueMessages()">
            <FileWarning :size="12" />
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XCircle, AlertTriangle, Info, FileWarning } from 'lucide-vue-next'
import type { ValidationIssue } from '@/composables/useGraphValidation'

const props = defineProps<{
    issues: ValidationIssue[]
}>()

const counts = computed(() => ({
    errors: props.issues.filter(i => i.type === 'error').length,
    warnings: props.issues.filter(i => i.type === 'warning').length,
    info: props.issues.filter(i => i.type === 'info').length,
    staticIssues: props.issues.filter(i => i.type === 'static-issue').length
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

const getStaticIssueMessages = () => {
    return props.issues
        .filter(i => i.type === 'static-issue')
        .map(i => i.message)
        .join('\n')
}
</script>

<style scoped>
.validation-icons {
    position: absolute;
    top: -20px;
    width: 100%;
    display: flex;
    gap: 4px;
    z-index: 10;
    justify-content: center;
}

.validation-icon {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
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

.validation-icon.static-issue {
    background: #8b5cf6;
    color: white;
}
</style>
