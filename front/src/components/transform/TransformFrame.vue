<template>
    <div class="transform-frame" ref="frame">
        <div class="shift" :style="{ transform: `translate(-50%, -50%) translate(${computedPivotX}px, ${computedPivotY}px)` }">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(defineProps<{
    pivotX?: number|'left'|'center'|'right';
    pivotY?: number|'top'|'center'|'bottom';
}>(), {
    pivotX: 'center',
    pivotY: 'center'
});

const frame = ref<HTMLDivElement>();

/* mouse position in the frame */
const getMousePosition = (event: MouseEvent) => {
    const rect = frame.value!.getBoundingClientRect();
    const scale = rect.width / frame.value!.offsetWidth;
    return {
        x: (event.clientX - rect.left + computedPivotX.value) / scale,
        y: (event.clientY - rect.top + computedPivotY.value) / scale,
    }
}

const computedPivotX = computed(() => {
    if (!frame.value) return 0;
    if (props.pivotX === 'left') return 0;
    if (props.pivotX === 'center') return frame.value!.offsetWidth / 2;
    if (props.pivotX === 'right') return frame.value!.offsetWidth;
    return props.pivotX;
});

const computedPivotY = computed(() => {
    if (!frame.value) return 0;
    if (props.pivotY === 'top') return 0;
    if (props.pivotY === 'center') return frame.value!.offsetHeight / 2;
    if (props.pivotY === 'bottom') return frame.value!.offsetHeight;
    return props.pivotY;
}); 

defineExpose({
    getMousePosition,
});
</script>

<style scoped>
.transform-frame {
    position: relative;
    border: 1px solid var(--debug-frame);
}

.shift {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>

