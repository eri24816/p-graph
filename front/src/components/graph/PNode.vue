<template>
    <div ref="nodeEl" class="p-node" :class="{ 'active-node': isActive, 'selected-node': isSelected, 'start-node': nodeData.type === 'start' }">
            <ValidationIcons :issues="validationIssues" />
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
                <PPort :ref="setPortRef(nodeData.controlInput.id)" :port-data="nodeData.controlInput" :hide="viewLayer !== 'control'" 
                    @port-mousedown="$emit('port-mousedown', {nodeId: nodeData.id, port: nodeData.controlInput, event: $event})"
                    @port-mouseup="$emit('port-mouseup', {nodeId: nodeData.id, port: nodeData.controlInput, event: $event})"
                />
            </TransformObject>

            <TransformObject :anchor-x="'right'" class="port-frame ports">
                <PPort :ref="setPortRef(nodeData.controlOutput.id)" :port-data="nodeData.controlOutput" :hide="viewLayer !== 'control'"
                    @port-mousedown="$emit('port-mousedown', {nodeId: nodeData.id, port: nodeData.controlOutput, event: $event})"
                    @port-mouseup="$emit('port-mouseup', {nodeId: nodeData.id, port: nodeData.controlOutput, event: $event})"
                />
            </TransformObject>
        
        <div class="p-node-title" :class="{'start-node-title': nodeData.type === 'start'}">
            <svg v-if="nodeData.type === 'start'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span>{{ nodeData.nodeName }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NodeData, PortData } from '@/types/PGraph'
import type { ValidationIssue } from '@/composables/useGraphValidation'
import TransformObject from '../transform/TransformObject.vue'
import PPort from './PPort.vue'
import ValidationIcons from './ValidationIcons.vue'

import { ref } from 'vue'

const nodeEl = ref<HTMLElement>()
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

const getBoundingRect = () => {
    if (!nodeEl.value) return null
    return nodeEl.value.getBoundingClientRect()
}

withDefaults(defineProps<{
    nodeData: NodeData,
    viewLayer: 'control' | 'data',
    isActive?: boolean,
    isSelected?: boolean,
    validationIssues?: ValidationIssue[]
}>(), {
    viewLayer: 'control',
    isActive: false,
    isSelected: false,
    validationIssues: () => []
})

defineEmits<{
    (e: 'port-mousedown', payload: {nodeId: number | string, port: PortData, event: MouseEvent}): void;
    (e: 'port-mouseup', payload: {nodeId: number | string, port: PortData, event: MouseEvent}): void;
}>()

defineExpose({
    getPortPosition,
    getBoundingRect
})

</script>


<style scoped>
.p-node {
    position: relative;
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
    height: 70px;
    transition: box-shadow 0.2s, border-color 0.2s;
}

.p-node:hover {
    border-color: var(--hover-color);
}

.start-node .p-node-title {
    color: #2adc4b;
}

.p-node-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--node-title-color);
    text-align: center;
    letter-spacing: 0.025em;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between; /* To space title and settings button */
    padding: 0 5px;
    margin: auto;
}

.start-node {
    background: rgb(38, 65, 32);
}

.active-node {
    border: 2px solid #2ea043;
}

.selected-node {
    border: 1px solid var(--node-border);
    box-shadow: 0 0 0 2px var(--selected-color), 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}

.active-node.selected-node {
     border: 2px solid #2ea043;
     box-shadow: 0 0 0 1px #007acc, 0 0 10px #2ea043;
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