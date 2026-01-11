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
    drawingLayer: 'data',
    isSelected: false,
});

const emit = defineEmits<{
    click: [edge: EdgeData, event: MouseEvent]
}>();

const handleClick = (event: MouseEvent) => {
    if (props.edge && !props.isDrawing) {
        emit('click', props.edge, event)
    }
};

const path = computed(() => {
    const start = { x: props.x1, y: props.y1 };
    const end = { x: props.x2, y: props.y2 };

    const dx = Math.abs(end.x - start.x) * 0.5;
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
});
</script>

<template>
    <g>
        <!-- Invisible wider path for easier clicking -->
        <path
            v-if="!isDrawing"
            :d="path"
            class="edge-hit-area"
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
                isControl: edge?.layer==='control' || drawingLayer==='control',
                selected: isSelected
            }"
            @click="handleClick"
        />
    </g>
</template>

<style scoped>
.edge-hit-area {
    fill: none;
    stroke: transparent;
    stroke-width: 16px;
    stroke-linecap: round;
    cursor: pointer;
}

.edge-path {
    fill: none;
    stroke: var(--data-flow-color);
    stroke-width: 2px;
    stroke-linecap: round;
    opacity: 0.8;
    cursor: pointer;
    transition: stroke-width 0.1s, opacity 0.1s;
}

.edge-path:hover {
    stroke-width: 3px;
    opacity: 1;
}

.edge-path.selected {
    stroke: #4a9eff;
    stroke-width: 3px;
    opacity: 1;
}

.edge-path.drawing {
    stroke-dasharray: 5, 5;
    opacity: 0.5;
    cursor: default;
}

.edge-path.dim {
    opacity: 0.3;
}

.edge-path.hide {
    opacity: 0;
}

.edge-path.isControl {
    stroke-width: 3px;
    stroke: var(--accent-blue);
}

.edge-path.isControl.selected {
    stroke: #6bb3ff;
    stroke-width: 4px;
}
</style>
