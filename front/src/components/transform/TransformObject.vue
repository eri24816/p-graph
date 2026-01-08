<template>
    <div class="transform-object" ref="frame" :style="computedStyle">
        <div ref="scaleSensor" class="scale-sensor"></div>
        <slot />    
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(defineProps<{
    pivotX?: number|'left'|'center'|'right';
    pivotY?: number | 'top' | 'center' | 'bottom';
    anchorX?: number|'left'|'center'|'right';
    anchorY?: number|'top'|'center'|'bottom';
    x?: number;
    y?: number;
    scale?: number;
}>(), {
    pivotX: 'center',
    pivotY: 'center',
    anchorX: 'center',
    anchorY: 'center',
    x: 0,
    y: 0,
    scale: 1,
});

const frame = ref<HTMLDivElement>();
const scaleSensor = ref<HTMLDivElement>();

const computedStyle = computed(() => {

    const result: any = {
        transform: ` translate(${props.x}px, ${props.y}px) scale(${props.scale}) translate(${-computedPivotX.value}px, ${-computedPivotY.value}px)`,
    }

    if (props.anchorX == 'left') {
        result.left = 0;
    } else if (props.anchorX == 'right') {
        result.right = 0;
    } else if (props.anchorX == 'center') {
        result.left = '50%';
    }

    if (props.anchorY == 'top') {
        result.top = 0;
    } else if (props.anchorY == 'bottom') {
        result.bottom = 0;
    } else if (props.anchorY == 'center') {
        result.top = '50%';
    }
    return result
})

/* mouse position in the frame */
const getMousePosition = (event: MouseEvent) => {
    const rect = frame.value!.getBoundingClientRect();
    const scaleSensorRect = scaleSensor.value!.getBoundingClientRect();
    const scale = scaleSensorRect.width / scaleSensor.value!.offsetWidth;
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

const screenToLocal = (screenPos: { x: number, y: number }) => {
    const rect = frame.value!.getBoundingClientRect();
    const scaleSensorRect = scaleSensor.value!.getBoundingClientRect();
    const scale = scaleSensorRect.width / scaleSensor.value!.offsetWidth;
    return {
        x: (screenPos.x - rect.left + computedPivotX.value) / scale,
        y: (screenPos.y - rect.top + computedPivotY.value) / scale,
    }
}

defineExpose({
    getMousePosition,
    screenToLocal,
});
</script>

<style scoped>
.transform-object {
    position: absolute;
    border: 1px solid var(--debug-frame);
}

.scale-sensor {
    position: absolute;
    width: 1px;
    height: 1px;
}
</style>

