<template>
    <div class="p-node">
        <TransformFrame class="port-frame input-data-port-frame">
            <TransformObject :x="0" :y="0" class="ports">
                <PPort v-for="port in nodeData.inputs" :key="port.id" :port-data="port" />
            </TransformObject>
        </TransformFrame>
        <div class="p-node-title">{{ nodeData.title }}</div>

        <TransformFrame class="port-frame output-data-port-frame">
            <TransformObject :x="0" :y="0" class="ports">
                <PPort v-for="port in nodeData.outputs" :key="port.id" :port-data="port" />
            </TransformObject>
        </TransformFrame>
    </div>
</template>

<script setup lang="ts">
import type { NodeData } from '@/types/PGraph'
import TransformFrame from '../transform/TransformFrame.vue'
import TransformObject from '../transform/TransformObject.vue'
import PPort from './PPort.vue'

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

.port-frame{
    width: 0px;
    height: 100%;
    position: absolute;
}

.ports {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.input-control-port-frame {
    left: 0;
}

.output-control-port-frame {
    right: 0;
}

.input-data-port-frame {
    left: 0;
}

.output-data-port-frame {
    right: 0;
}
</style>