<template>
    <div v-if="isOpen" class="node-settings-overlay" @click.self="$emit('close')">
        <div class="node-settings-modal">
            <div class="header">
                <h3>Settings: {{ node.title }}</h3>
                <button class="close-btn" @click="$emit('close')">×</button>
            </div>
            
            <div class="content">
                <div v-if="node.serviceSchema" class="section">
                    <h4>Inputs (Variable Mapping)</h4>
                    <div v-for="(type, fieldName) in node.serviceSchema.input_fields" :key="fieldName" class="field-row">
                        <label>{{ fieldName }} <span class="type" :style="{ color: getTypeColor(type) }">({{ type }})</span></label>
                        <input 
                            v-model="inputMappings[fieldName]" 
                            placeholder="Enter variable name..."
                            class="variable-input"
                        />
                    </div>
                    <div v-if="!node.serviceSchema.input_fields || Object.keys(node.serviceSchema.input_fields).length === 0" class="empty-msg">
                        No inputs defined.
                    </div>
                </div>

                <div v-if="node.serviceSchema" class="section">
                    <h4>Outputs (Variables)</h4>
                    <div v-for="(type, fieldName) in node.serviceSchema.output_fields" :key="fieldName" class="field-row">
                        <label>{{ fieldName }} <span class="type" :style="{ color: getTypeColor(type) }">({{ type }})</span></label>
                        <div class="readonly-value">
                            {{ node.title }}_{{ fieldName }}
                        </div>
                    </div>
                     <div v-if="!node.serviceSchema.output_fields || Object.keys(node.serviceSchema.output_fields).length === 0" class="empty-msg">
                        No outputs defined.
                    </div>
                </div>
            </div>

            <div class="footer">
                <span class="status-msg" v-if="saving">Saving...</span>
                <span class="status-msg done" v-else>Autosaved</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NodeData } from '@/types/PGraph';
import { ref, watch } from 'vue';

const props = defineProps<{
    node: NodeData,
    isOpen: boolean
}>();

const emit = defineEmits(['close', 'save']);

const inputMappings = ref<Record<string, string>>({});
const saving = ref(false);

watch(() => props.isOpen, (newVal) => {
    if (newVal && props.node) {
        // Initialize from existing settings
        inputMappings.value = { ...props.node.settings?.inputMappings };
    }
}, { immediate: true });

// Auto-save watch
watch(inputMappings, () => {
    saving.value = true;
    emit('save', {
        inputMappings: inputMappings.value
    });
    setTimeout(() => {
        saving.value = false;
    }, 500);
}, { deep: true });

const getTypeColor = (type: string) => {
    if (type === 'string') return '#ce9178';
    if (type === 'int' || type === 'double' || type === 'float') return '#b5cea8';
    if (type === 'bool') return '#569cd6';
    return '#4ec9b0';
}

</script>

<style scoped>
.node-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.node-settings-modal {
    background: #1e1e1e;
    width: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    display: flex;
    flex-direction: column;
}

.header {
    padding: 16px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h3 {
    margin: 0;
    color: #e0e0e0;
}

.close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 24px;
    cursor: pointer;
}

.close-btn:hover {
    color: #fff;
}

.content {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.section {
    margin-bottom: 20px;
}

.section h4 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #4daafc;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.field-row {
    margin-bottom: 12px;
}

.field-row label {
    display: block;
    margin-bottom: 4px;
    color: #ccc;
    font-size: 13px;
}

.type {
    color: #666;
    font-size: 0.9em;
    margin-left: 4px;
    font-family: monospace;
}

.variable-input {
    width: 100%;
    padding: 8px;
    background: #2d2d2d;
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;
    font-family: monospace;
}

.variable-input:focus {
    border-color: #007acc;
    outline: none;
}

.readonly-value {
    padding: 8px;
    background: #252526;
    border: 1px solid #333;
    border-radius: 4px;
    color: #e6ce31; /* Yellowish for output vars */
    font-family: monospace;
    font-size: 13px;
}

.empty-msg {
    color: #666;
    font-style: italic;
}

.footer {
    padding: 16px;
    border-top: 1px solid #333;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 30px;
}

.status-msg {
    font-size: 12px;
    color: #ccc;
    font-style: italic;
}

.status-msg.done {
    color: #4ec9b0;
}
</style>
