<template>
    <div class="transform-frame" ref="frame">
        <div class="shift">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const frame = ref<HTMLDivElement>();

/* mouse position in the frame */
const getMousePosition = (event: MouseEvent) => {
    const rect = frame.value!.getBoundingClientRect();
    console.log(rect, frame.value!);
    const scale = rect.width / frame.value!.offsetWidth;
    return {
        x: (event.clientX - rect.left - rect.width / 2) / scale,
        y: (event.clientY - rect.top - rect.height / 2) / scale,
    }
}

defineExpose({
    getMousePosition,
});
</script>

<style scoped>
.transform-frame {
    position: relative;
    box-shadow: 0 0 0 1px #42d23b15;
}

.shift {
    width: 100%;
    height: 100%;
    /* transform: translate(50%, 50%); */
}
</style>

