<template>
    <div v-if="isOpen" class="node-settings-overlay" @click.self="$emit('close')">
        <div class="node-settings-modal">
            <div class="header">
                <h3>{{ props.node.nodeName }}</h3>
                <button class="close-btn" @click="$emit('close')">×</button>
            </div>

            <div class="content">
                <div class="section">
                    <h4>Node Name</h4>
                    <input
                        v-model="nodeName"
                        placeholder="Enter node name..."
                        class="variable-input"
                        :class="{ 'name-conflict': hasError }"
                    />
                    <div v-if="hasNameConflict" class="error-msg">
                        Name conflict: Another node already uses this name
                    </div>
                    <div v-if="hasInvalidCharacters" class="error-msg">
                        Only letters, numbers, hyphens, and underscores are allowed
                    </div>
                </div>
                <div v-if="node.inputs.length > 0" class="section">
                    <h4>Inputs</h4>
                    <div v-for="input in node.inputs" :key="input.id" class="field-row">
                        <label>{{ input.name }} <span class="type" :style="{ color: getTypeColor(input.dataType) }">({{ input.dataType }})</span></label>
                        <div class="autocomplete-wrapper">
                            <input
                                v-model="inputVariables[input.name]"
                                placeholder="Enter variable name..."
                                class="variable-input"
                                @focus="showAutocomplete(input.name)"
                                @blur="hideAutocomplete(input.name)"
                                @input="filterSuggestions(input.name)"
                            />
                            <div
                                v-if="activeAutocomplete === input.name && filteredSuggestions.length > 0"
                                class="autocomplete-dropdown"
                            >
                                <div
                                    v-for="suggestion in filteredSuggestions"
                                    :key="suggestion"
                                    class="autocomplete-item"
                                    @mousedown.prevent="selectSuggestion(input.name, suggestion)"
                                >
                                    {{ suggestion }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="node.inputs.length === 0" class="empty-msg">
                        No inputs defined.
                    </div>
                </div>

                <div v-if="node.outputs.length > 0" class="section">
                    <h4>Outputs</h4>
                    <div v-for="output in node.outputs" :key="output.id" class="field-row">
                        <label>{{ output.name }} <span class="type" :style="{ color: getTypeColor(output.dataType) }">({{ output.dataType }})</span></label>
                        <div class="readonly-value">
                            {{ node.nodeName }}.{{ output.name }}
                        </div>
                    </div>
                     <div v-if="node.outputs.length === 0" class="empty-msg">
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
import { ref, watch, computed } from 'vue';

const props = defineProps<{
    node: NodeData,
    isOpen: boolean,
    allNodes: NodeData[]
}>();

const emit = defineEmits(['close', 'save']);

const nodeName = ref('');
const inputVariables = ref<Record<string, string>>({});
const saving = ref(false);
const activeAutocomplete = ref<string | null>(null);
const filteredSuggestions = ref<string[]>([]);

const hasNameConflict = computed(() => {
    return props.allNodes.some(n =>
        n.id !== props.node.id && n.nodeName === nodeName.value
    );
});

const hasInvalidCharacters = computed(() => {
    // Only allow a-z, A-Z, 0-9, -, _
    const validNameRegex = /^[a-zA-Z0-9_-]*$/;
    return !validNameRegex.test(nodeName.value);
});

const hasError = computed(() => hasNameConflict.value || hasInvalidCharacters.value);

watch(() => props.isOpen, (newVal) => {
    if (newVal && props.node) {
        // Initialize from existing settings
        nodeName.value = props.node.nodeName;
        inputVariables.value = { ...props.node.inputVariables };
    }
}, { immediate: true });

// Auto-save watch for node name
watch(nodeName, () => {
    if (!hasError.value) {
        saving.value = true;
        emit('save', {
            nodeName: nodeName.value,
            inputMappings: inputVariables.value
        });
        setTimeout(() => {
            saving.value = false;
        }, 500);
    }
});

// Auto-save watch for input variables
watch(inputVariables, () => {
    saving.value = true;
    emit('save', {
        nodeName: nodeName.value,
        inputMappings: inputVariables.value
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

// Generate all available variable suggestions from all nodes' outputs
const allSuggestions = computed(() => {
    const suggestions: string[] = [];
    props.allNodes.forEach(node => {
        node.outputs.forEach(output => {
            suggestions.push(`${node.nodeName}.${output.name}`);
        });
    });
    return suggestions;
});

const showAutocomplete = (inputName: string) => {
    activeAutocomplete.value = inputName;
    filterSuggestions(inputName);
};

const hideAutocomplete = (inputName: string) => {
    // Use setTimeout to allow click event to fire before hiding
    setTimeout(() => {
        if (activeAutocomplete.value === inputName) {
            activeAutocomplete.value = null;
            filteredSuggestions.value = [];
        }
    }, 150);
};

const filterSuggestions = (inputName: string) => {
    const currentValue = inputVariables.value[inputName] || '';
    if (!currentValue) {
        filteredSuggestions.value = allSuggestions.value;
    } else {
        filteredSuggestions.value = allSuggestions.value.filter(suggestion =>
            suggestion.toLowerCase().includes(currentValue.toLowerCase())
        );
    }
};

const selectSuggestion = (inputName: string, suggestion: string) => {
    inputVariables.value[inputName] = suggestion;
    activeAutocomplete.value = null;
    filteredSuggestions.value = [];
};

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

.variable-input.name-conflict {
    border-color: #f14c4c;
    background: #3d2020;
}

.variable-input.name-conflict:focus {
    border-color: #f14c4c;
}

.error-msg {
    color: #f14c4c;
    font-size: 12px;
    margin-top: 4px;
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

.autocomplete-wrapper {
    position: relative;
    width: 100%;
}

.autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #252526;
    border: 1px solid #007acc;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.autocomplete-item {
    padding: 8px;
    cursor: pointer;
    color: #ccc;
    font-family: monospace;
    font-size: 13px;
    transition: background 0.1s;
}

.autocomplete-item:hover {
    background: #094771;
    color: #fff;
}
</style>
