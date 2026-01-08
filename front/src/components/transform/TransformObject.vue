<template>
    <div class="transform" :style="{ transform: `translate(${props.x}px, ${props.y}px) scale(${props.scale})` }">
        <slot />
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    x?: number;
    y?: number;
    scale?: number;
}>(), {
    x: 0,
    y: 0,
    scale: 1
});
</script>

<style scoped>
.transform {
    position: absolute;
    box-shadow:  0 0 0 1px #3575ff38;
    min-width: 1px;
    min-height: 1px;
}
</style>