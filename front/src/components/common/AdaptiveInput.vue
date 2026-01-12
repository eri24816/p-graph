<template>
    <input
        ref="inputRef"
        v-model="internalValue"
        :class="['adaptive-input', inputClass]"
        :style="{ width: inputWidth }"
        :placeholder="placeholder"
        @input="handleInput"
        @blur="$emit('blur')"
        @keydown.enter="handleEnter"
        v-bind="$attrs"
    />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
    inputClass?: string | Record<string, boolean>;
    minWidth?: number;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    'blur': [];
    'enter': [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputWidth = ref('100px');
const internalValue = ref(props.modelValue);

// Update input width based on text content
const updateInputWidth = () => {
    if (inputRef.value) {
        // Create a temporary span to measure text width
        const span = document.createElement('span');
        const computedStyle = getComputedStyle(inputRef.value);

        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.style.fontSize = computedStyle.fontSize;
        span.style.fontFamily = computedStyle.fontFamily;
        span.style.fontWeight = computedStyle.fontWeight;
        span.style.letterSpacing = computedStyle.letterSpacing;

        // Use actual text or a single character as minimum
        span.textContent = internalValue.value || props.placeholder || 'A';
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);

        // Add extra padding for comfortable editing (16px accounts for padding on hover/focus)
        const minWidth = props.minWidth ?? 100;
        inputWidth.value = `${Math.max(width + 16, minWidth)}px`;
    }
};

const handleInput = () => {
    emit('update:modelValue', internalValue.value);
    updateInputWidth();
};

const handleEnter = (event: KeyboardEvent) => {
    (event.target as HTMLInputElement).blur();
    emit('enter');
};

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
    internalValue.value = newValue;
    updateInputWidth();
});

// Update width on mount
onMounted(() => {
    updateInputWidth();
});
</script>

<style scoped>
.adaptive-input {
    background: transparent;
    border: none;
    color: #e0e0e0;
    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
    padding: 2px 6px;
    margin: -2px -6px;
    outline: none;
    max-width: 100%;
    transition: background 0.2s, border 0.2s;
    border-radius: 3px;
    box-sizing: border-box;
}

.adaptive-input:hover {
    background: rgba(255, 255, 255, 0.05);
}

.adaptive-input:focus {
    background: #2d2d2d;
    border: 1px solid #007acc;
    margin: -3px -7px;
}
</style>
