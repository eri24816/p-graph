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
                        @blur="handleInputBlur"
                    />
                    <div v-if="hasNameConflict" class="error-msg">
                        Name conflict: Another node already uses this name
                    </div>
                    <div v-if="hasInvalidCharacters" class="error-msg">
                        Only letters, numbers, hyphens, and underscores are allowed
                    </div>
                </div>

                <div v-if="validationIssues && validationIssues.length > 0" class="section">
                    <h4>Validation Issues</h4>
                    <div class="validation-list">
                        <div
                            v-for="(issue, index) in validationIssues"
                            :key="index"
                            class="validation-item"
                            :class="issue.type"
                        >
                            <span class="validation-icon-inline">
                                <span v-if="issue.type === 'error'">✕</span>
                                <span v-else-if="issue.type === 'warning'">⚠</span>
                                <span v-else>ℹ</span>
                            </span>
                            <span class="validation-message">{{ issue.message }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="node.inputs.length > 0" class="section">
                    <h4>Inputs</h4>
                    <div v-for="input in node.inputs" :key="input.id" class="field-row">
                        <label>{{ input.name }} <span class="type" :style="{ color: getTypeColor(input.dataType) }">({{ input.dataType }})</span></label>
                        <div class="autocomplete-wrapper">
                            <input
                                v-model="inputVariables[input.name]"
                                placeholder="Enter variable or literal value..."
                                class="variable-input"
                                :class="{ 'input-error': inputErrors[input.name] }"
                                @focus="showAutocomplete(input.name, $event);"
                                @blur="hideAutocomplete(input.name); handleInputBlur()"
                                @input="filterSuggestionsForInput(input.name)"
                            />
                            <div
                                v-if="activeAutocomplete === input.name && filteredSuggestions.length > 0"
                                class="autocomplete-dropdown"
                            >
                                <div
                                    v-for="suggestion in filteredSuggestions"
                                    :key="suggestion.name"
                                    class="autocomplete-item"
                                    @mousedown.prevent="selectSuggestion(input.name, suggestion.name)"
                                >
                                    {{ suggestion.name }} <span class="type" :style="{ color: getTypeColor(suggestion.type) }">({{ suggestion.type }})</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="inputErrors[input.name]" class="error-msg">
                            {{ inputErrors[input.name] }}
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
import { isValidLiteral, isValidVariableReference } from '@/utils/validation';

const props = defineProps<{
    node: NodeData,
    isOpen: boolean,
    allNodes: NodeData[],
    validationIssues?: Array<{ type: 'error' | 'warning' | 'info', message: string }>
}>();

const emit = defineEmits(['close', 'save']);

const nodeName = ref('');
const inputVariables = ref<Record<string, string>>({});
const saving = ref(false);
const activeAutocomplete = ref<string | null>(null);
const filteredSuggestions = ref<Array<{ name: string; type: string }>>([]);
const inputErrors = ref<Record<string, string>>({});
const pendingSave = ref(false);

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
        // Reset pending save flag after initialization
        pendingSave.value = false;
    }
}, { immediate: true });

// Track changes to node name but don't auto-save
watch(nodeName, () => {
    pendingSave.value = true;
});

// Track changes to input variables but don't auto-save
watch(inputVariables, () => {
    pendingSave.value = true;
}, { deep: true });

// Save handler for input blur
const handleInputBlur = () => {
    if (pendingSave.value && !hasError.value) {
        saving.value = true;
        emit('save', {
            nodeName: nodeName.value,
            inputMappings: {...inputVariables.value}
        });
        setTimeout(() => {
            saving.value = false;
        }, 300);
        pendingSave.value = false;
    }
};

const getTypeColor = (type: string) => {
    if (type === 'string') return '#ce9178';
    if (type === 'int' || type === 'double' || type === 'float') return '#b5cea8';
    if (type === 'bool') return '#569cd6';
    return '#4ec9b0';
}

// Validate input value (must be either a valid literal or a valid variable reference)
const validateInputValue = (inputName: string, value: string): string | null => {
    if (!value || !value.trim()) {
        return null; // Empty is okay
    }

    const input = props.node.inputs.find(i => i.name === inputName);
    if (!input) return null;

    const trimmed = value.trim();

    // Check if it's a valid literal for this type
    if (isValidLiteral(trimmed, input.dataType)) {
        return null; // Valid literal
    }

    // Check if it's a valid variable reference
    if (isValidVariableReference(trimmed)) {
        // Check if the variable exists in available suggestions
        const matchingSuggestion = allSuggestions.value.find(s => s.name === trimmed);
        if (matchingSuggestion) {
            if (matchingSuggestion.type === input.dataType) {
                return null; // Valid variable reference with matching type
            } else {
                return `Type mismatch: expected ${input.dataType}, but ${trimmed} is ${matchingSuggestion.type}`;
            }
        } else {
            return `Variable ${trimmed} does not exist`;
        }
    }

    // Invalid format
    return `Invalid value: must be a ${input.dataType} literal or a valid variable reference`;
}

// Watch for input changes and validate
watch(inputVariables, (newValues) => {
    const errors: Record<string, string> = {};
    Object.keys(newValues).forEach(inputName => {
        const error = validateInputValue(inputName, newValues[inputName]);
        if (error) {
            errors[inputName] = error;
        }
    });
    inputErrors.value = errors;
}, { deep: true });

// Generate all available variable suggestions from all nodes' outputs with type info
const allSuggestions = computed(() => {
    const suggestions: Array<{ name: string; type: string }> = [];
    props.allNodes.forEach(node => {
        node.outputs.forEach(output => {
            suggestions.push({
                name: `${node.nodeName}.${output.name}`,
                type: output.dataType
            });
        });
    });
    return suggestions;
});

const showAutocomplete = (inputName: string, event?: Event) => {
    activeAutocomplete.value = inputName;
    filterSuggestions('', props.node.inputs.find(i => i.name === inputName)!.dataType);

    // Select all text in the input when focused
    if (event) {
        const target = event.target as HTMLInputElement;
        target.select();
    }
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

const filterSuggestions = (currentValue: string, type: string) => {
    // Filter by type first
    let filtered = allSuggestions.value.filter(suggestion =>
        suggestion.type === type
    );
    
    // Then filter by text match if there's input
    if (currentValue) {
        filtered = filtered.filter(suggestion =>
            suggestion.name.toLowerCase().includes(currentValue.toLowerCase())
        );
    }
    
    filteredSuggestions.value = filtered;
};

const filterSuggestionsForInput = (inputName: string) => {
    filterSuggestions(
        inputVariables.value[inputName],
        props.node.inputs.find(i => i.name === inputName)!.dataType
    );
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

.variable-input.input-error {
    border-color: #f14c4c;
    background: #3d2020;
}

.variable-input.input-error:focus {
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

.validation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.validation-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    border-left: 3px solid;
}

.validation-item.error {
    background: rgba(241, 76, 76, 0.1);
    border-left-color: #f14c4c;
}

.validation-item.warning {
    background: rgba(245, 158, 11, 0.1);
    border-left-color: #f59e0b;
}

.validation-item.info {
    background: rgba(59, 130, 246, 0.1);
    border-left-color: #3b82f6;
}

.validation-icon-inline {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.validation-item.error .validation-icon-inline {
    color: #f14c4c;
}

.validation-item.warning .validation-icon-inline {
    color: #f59e0b;
}

.validation-item.info .validation-icon-inline {
    color: #3b82f6;
}

.validation-message {
    flex: 1;
    color: #e0e0e0;
    line-height: 1.4;
}
</style>
