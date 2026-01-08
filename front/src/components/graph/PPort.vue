<template>
    <div class="p-port" :class="dim ? 'dim' :hide ? 'hide' : ''"
        @mousedown.stop="$emit('port-mousedown', $event)" @mouseup="$emit('port-mouseup', $event)">
    </div>
</template>

<script setup lang="ts">
import type { PortData } from '@/types/PGraph'

const props = withDefaults(defineProps<{
    portData: PortData,
    dim?: boolean,
    hide?: boolean,
}>(), {
    dim: false,
    hide: false,
})

defineEmits<{
    (e: 'port-mousedown', event: MouseEvent): void;
    (e: 'port-mouseup', event: MouseEvent): void
}>()
</script>


<style scoped>
.p-port {
    width: 10px;
    height: 10px;
    background-color: var(--port-bg);
    border: 2px solid var(--bg-color);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 0 1px var(--port-border);
}

.p-port:hover {
    background-color: var(--accent-blue);
    transform: scale(1.4);
    box-shadow: 0 0 8px var(--accent-blue);
}

.dim {
    opacity: 0.3;
    pointer-events: none;
}

.hide {
    opacity: 0;
    pointer-events: none;
}
</style>
