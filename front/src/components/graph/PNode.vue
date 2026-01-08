<template>
    <div class="p-node">
        <TransformFrame class="input-port-frame">
            <TransformObject v-for="(port, idx) in nodeData.inputs" :key="port.id" :x="10 + idx * 32" :y="6">
                <PPort :port-data="port" />
            </TransformObject>
        </TransformFrame>
        <div class="p-node-title">{{ nodeData.title }}</div>

        <div class="p-node-controls">
        </div>
        <TransformFrame class="output-port-frame">
            <TransformObject v-for="(port, idx) in nodeData.outputs" :key="port.id" :x="10 + idx * 32" :y="-4">
                <PPort :port-data="port" />
            </TransformObject>
        </TransformFrame>
    </div>
</template>

<script setup lang="ts">
import type { NodeData } from '@/types/PGraph';
import TransformFrame from '../transform/TransformFrame.vue';
import TransformObject from '../transform/TransformObject.vue';
import PPort from './PPort.vue';

defineProps<{
    nodeData: NodeData
}>()

</script>

<style scoped>
.p-node {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    flex-direction: column;
    background-color: #807a75;
    border-radius: 2px;
    padding: 0px;
    box-shadow: inset 0 0 0 1px #4b4b4b;
    user-select: none;
    width: 64px;
}

.p-node-title {
    font-size: 12px;
    font-weight: bold;
    color: #171717;
    height: 32px;
    text-align: center;
    line-height: 32px;
}

.input-port-frame {
    width: 100%;
    height: 10px;
    overflow: hidden;
    position: absolute;
    bottom: 100%;
}

.output-port-frame {
    width: 100%;
    height: 10px;
    overflow: hidden;
    position: absolute;
    top: 100%;
}
</style>