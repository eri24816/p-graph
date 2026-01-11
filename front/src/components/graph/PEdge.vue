<script setup lang="ts">
import { computed } from 'vue';
import type { NodeData, EdgeData } from '../../types/PGraph';

const props = withDefaults(defineProps<{
    edge?: EdgeData;
    sourceNode?: NodeData;
    targetNode?: NodeData;
    // For drawing mode
    isDrawing?: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dim?: boolean;
    hide?: boolean;
    drawingLayer?: string;
    isSelected?: boolean;
}>(), {
    dim: false,
    hide: false,
    drawingLayer: '',
    isSelected: false,
});

const emit = defineEmits<{
    click: [edge: EdgeData, event: MouseEvent]
}>();

const layer = computed(()=>props.edge?.layer || props.drawingLayer)

const handleClick = (event: MouseEvent) => {
    console.log('handleClick called');
    if (props.edge && !props.isDrawing) {
        emit('click', props.edge, event)
    }
};

const path = computed(() => {
    const start = { x: props.x1, y: props.y1 };
    const end = { x: props.x2, y: props.y2 };

    const dx = Math.abs(end.x - start.x) * (layer.value == 'data' ? 0.5 : 0.5);
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
});
</script>

<template>
    <g class="p-edge-g">
        <!-- Invisible wider path for easier clicking -->
        <path
            v-if="!isDrawing"
            :d="path"
            class="edge-hit-area"
            :class="{ hide: hide }"
            @click="handleClick"
        />
        <!-- Visible edge path -->
        <path
            :d="path"
            class="edge-path"
            :class="{
                drawing: isDrawing,
                dim: dim,
                hide: hide,
                isDataFlow: layer === 'data',
                selected: isSelected
            }"
            @click="handleClick"
        />
    </g>
</template>

<style scoped>
/* Base styles - default control flow color */
.edge-path {
    fill: none;
    stroke: var(--control-flow-color);
    stroke-width: 3px;
    stroke-linecap: round;
    opacity: 0.8;
    cursor: pointer;
    transition: stroke 0.1s, opacity 0.1s;
}

/* Modifiers */
.edge-path.dim {
    opacity: 0.3;
}

.edge-path.hide {
    opacity: 0;
    pointer-events: none;
}

.edge-hit-area.hide{
    pointer-events: none;
}

/* Priority 4 (lowest): Data flow color */
.edge-path.isDataFlow {
    stroke: var(--data-flow-color);
    stroke-width: 2px;
}

/* Selection underlay */
.edge-selection-underlay.dim {
    opacity: 0.15;
}

.edge-selection-underlay.hide {
    opacity: 0;
}

/* Priority 3: Hover - must come before selected */
.p-edge-g:hover .edge-path:not(.selected):not(.drawing) {
    stroke: var(--hover-color);
}

/* Priority 2: Selected - higher priority than hover */
.edge-path.selected:not(.drawing) {
    stroke: var(--selected-color);
}

/* Priority 1 (highest): Drawing */
.edge-path.drawing {
    stroke: var(--selected-color);
    stroke-dasharray: 5, 5;
    opacity: 0.5;
    cursor: default;
}

.edge-hit-area {
    fill: none;
    stroke: transparent;
    stroke-width: 16px;
    stroke-linecap: round;
    cursor: pointer;
}
</style>
