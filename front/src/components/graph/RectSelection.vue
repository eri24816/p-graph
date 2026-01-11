<template>
    <div
        v-if="visible && rect.width > 0 && rect.height > 0"
        class="rect-selection"
        :style="style"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Rectangle {
    x: number
    y: number
    width: number
    height: number
}

const props = defineProps<{
    rect: Rectangle
    visible: boolean
}>()

const style = computed(() => ({
    left: `${props.rect.x}px`,
    top: `${props.rect.y}px`,
    width: `${props.rect.width}px`,
    height: `${props.rect.height}px`
}))
</script>

<style scoped>
.rect-selection {
    position: absolute;
    border: 2px solid #4a9eff;
    background: rgba(74, 158, 255, 0.1);
    pointer-events: none;
    z-index: 1000;
    box-sizing: border-box;
}
</style>
