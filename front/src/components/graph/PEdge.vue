<template>
    <path :d="path" class="edge-path" :class="{ drawing: isDrawing, dim: dim, hide: hide, isControl: edge?.layer==='control' || drawingLayer==='control'}" />
</template>

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
}>(), {
    dim: false,
    hide: false,
    drawingLayer: 'data',
});


const path = computed(() => {
    const start = { x: props.x1, y: props.y1 };
    const end = { x: props.x2, y: props.y2 };


    const dx = Math.abs(end.x - start.x) * 0.5;
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
});
</script>

<style scoped>
.edge-path {
    fill: none;
    stroke: var(--data-flow-color);
    stroke-width: 2px;
    stroke-linecap: round;
    opacity: 0.8;
}

.edge-path.drawing {
    stroke-dasharray: 5, 5;
    opacity: 0.5;
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
</style>
