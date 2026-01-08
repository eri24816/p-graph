<template>
    <div class="transform" :style="{ transform: `translate(${props.x}px, ${props.y}px) scale(${props.scale}) translate(${computedPivotX*-100}%, ${computedPivotY*-100}%)` }">
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    x?: number | string;
    y?: number | string;
    scale?: number;
    pivotX?: number|'left'|'center'|'right';
    pivotY?: number|'top'|'center'|'bottom';
}>(), {
    x: 0,
    y: 0,
    scale: 1,
    pivotX: 'center',
    pivotY: 'center'
});

const computedPivotX = computed(() => {
    if (props.pivotX === 'left') return 0;
    if (props.pivotX === 'center') return 0.5;
    if (props.pivotX === 'right') return 1;
    return props.pivotX;
});

const computedPivotY = computed(() => {
    if (props.pivotY === 'top') return 0;
    if (props.pivotY === 'center') return 0.5;
    if (props.pivotY === 'bottom') return 1;
    return props.pivotY;
});
</script>

<style scoped>
.transform {
    position: absolute;
    box-shadow:  0 0 0 1px var(--object-debug);
    min-width: 1px;
    min-height: 1px;
}
</style>