<template>
    <div class="p-graph-node">
        <component v-for="control in nodeData.controls" :key="control.id" :is="control.component" :control-props="control.props" class="control" :style="{ height: control.height * pxPerUnit + 'px' }" />
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { NodeData } from '../types/PGraph';

defineProps<{
    nodeData: NodeData
    pxPerUnit: number
}>();
</script>

<style scoped>
.p-graph-node {
    background-color: #995d36;
    border-radius: 4px;
    padding: 0px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 10px;
    border: 1px solid #433d33;
}


</style>