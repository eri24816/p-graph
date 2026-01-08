<template>
    <div class="p-node">
            <TransformObject :anchor-x="'left'" class="port-frame ports">
                <PPort v-for="port in nodeData.inputs" :ref="setPortRef(port.id)" :key="port.id" :port-data="port" :hide="viewLayer !== 'data'" 
                    @port-mousedown="$emit('port-mousedown', {nodeId: nodeData.id, port, event: $event})"
                    @port-mouseup="$emit('port-mouseup', {nodeId: nodeData.id, port, event: $event})"
                />
            </TransformObject>

            <TransformObject :anchor-x="'right'" class="port-frame ports">
                <PPort v-for="port in nodeData.outputs" :ref="setPortRef(port.id)" :key="port.id" :port-data="port" :hide="viewLayer !== 'data'"
                    @port-mousedown="$emit('port-mousedown', {nodeId: nodeData.id, port, event: $event})"
                    @port-mouseup="$emit('port-mouseup', {nodeId: nodeData.id, port, event: $event})"
                />
            </TransformObject>

            <TransformObject :anchor-x="'left'" class="port-frame ports">
                <PPort :ref="setPortRef(nodeData.controlInput.id)" :port-data="nodeData.controlInput" :dim="viewLayer !== 'control'" 
                    @port-mousedown="$emit('port-mousedown', {nodeId: nodeData.id, port: nodeData.controlInput, event: $event})"
                    @port-mouseup="$emit('port-mouseup', {nodeId: nodeData.id, port: nodeData.controlInput, event: $event})"
                />
            </TransformObject>

            <TransformObject :anchor-x="'right'" class="port-frame ports">
                <PPort :ref="setPortRef(nodeData.controlOutput.id)" :port-data="nodeData.controlOutput" :dim="viewLayer !== 'control'"
                    @port-mousedown="$emit('port-mousedown', {nodeId: nodeData.id, port: nodeData.controlOutput, event: $event})"
                    @port-mouseup="$emit('port-mouseup', {nodeId: nodeData.id, port: nodeData.controlOutput, event: $event})"
                />
            </TransformObject>
        
        <div class="p-node-title">
            <span>{{ nodeData.title }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NodeData, PortData } from '@/types/PGraph'
import TransformObject from '../transform/TransformObject.vue'
import PPort from './PPort.vue'

import { ref } from 'vue'

const portRefs = ref<Record<string | number, InstanceType<typeof PPort>>>({})

const setPortRef = (id: string | number) => (el: any) => {
    if (el) portRefs.value[id] = el
}

const getPortPosition = (port: PortData) => {
    const ref = portRefs.value[port.id]
    if (!ref) return { x: 0, y: 0 }
    const rect = ref.$el.getBoundingClientRect()
    const screenPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    }
    return screenPos
}

withDefaults(defineProps<{
    nodeData: NodeData,
    viewLayer: 'control' | 'data'
}>(), {
    viewLayer: 'control'
})

defineEmits<{
    (e: 'port-mousedown', payload: {nodeId: number | string, port: PortData, event: MouseEvent}): void;
    (e: 'port-mouseup', payload: {nodeId: number | string, port: PortData, event: MouseEvent}): void;
}>()

defineExpose({
    getPortPosition
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
    width: 70px;
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
    height: 70px;
    text-align: center;
    line-height: 70px;
    letter-spacing: 0.025em;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between; /* To space title and settings button */
    padding: 0 5px;
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