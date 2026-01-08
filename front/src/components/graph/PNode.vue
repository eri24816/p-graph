<template>
    <div class="p-node">
            <TransformObject  :anchor-x="'left'" class="port-frame ports">
                <PPort v-for="port in nodeData.inputs" :key="port.id" :port-data="port" :hide="viewLayer !== 'data'" />
            </TransformObject>

            <TransformObject :anchor-x="'right'" class="port-frame ports">
                <PPort v-for="port in nodeData.outputs" :key="port.id" :port-data="port" :hide="viewLayer !== 'data'" />
            </TransformObject>

            <TransformObject :anchor-x="'left'" class="port-frame ports">
                <PPort :port-data="{id: 1, type: 'control-input'}" :dim="viewLayer !== 'control'" />
            </TransformObject>

            <TransformObject :anchor-x="'right'" class="port-frame ports">
                <PPort :port-data="{id: 1, type: 'control-output'}" :dim="viewLayer !== 'control'" />
            </TransformObject>
        
        <div class="p-node-title">{{ nodeData.title }}</div>
    </div>
</template>

<script setup lang="ts">
import type { NodeData } from '@/types/PGraph'
import TransformObject from '../transform/TransformObject.vue'
import PPort from './PPort.vue'

withDefaults(defineProps<{
    nodeData: NodeData,
    viewLayer: 'control' | 'data'
}>(), {
    viewLayer: 'control'
})

</script>

<style scoped>
.p-node {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    flex-direction: column;
    background-color: var(--node-bg);
    border-radius: 6px;
    padding: 0;
    border: 1px solid var(--node-border);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
    user-select: none;
    width: 80px;
    transition: box-shadow 0.2s, border-color 0.2s;
}

.p-node:hover {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}

.p-node-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--node-title-color);
    height: 28px;
    text-align: center;
    line-height: 28px;
    letter-spacing: 0.025em;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px 6px 0 0;
}

.port-frame{
    width: 0px;
    height: 100%;
    position: absolute;
}

.ports {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    justify-content: center;
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