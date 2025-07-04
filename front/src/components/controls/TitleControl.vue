<template>
    <div class="title-control">
        <span class="title">{{ title }}</span>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Control } from '../../types/PGraph';

const props = defineProps<{
    controlProps: {
        title: string
    }
}>();


const title = ref(props.controlProps.title);
</script>

<style scoped>
.title-control {
    display: flex;
    position:relative;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #dfdfdf;
    font-size: 14px;
}

.title {
    height: 100%;
    line-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>