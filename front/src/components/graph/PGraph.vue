<template>
    <TransformFrame class="p-graph" @wheel="handleWheel($event, frame)" @mousedown="handleGraphMouseDown($event, frame)" :style="backgroundStyle">
        <button class="add-btn" @click.stop="showServiceList = !showServiceList">
            {{ showServiceList ? 'Close' : 'Add Service' }}
        </button>
        <div v-if="showServiceList" class="service-list-container">
            <div v-for="service in services" :key="service.name" class="service-list-btn" @click="onAddServiceClick(service)">
                {{ service.name }}
            </div>
            <div v-if="services.length === 0" style="padding: 10px;">No services found</div>
        </div>

        <NodeSettings 
            v-if="selectedNode"
            :node="selectedNode" 
            :is-open="settingsOpen" 
            @close="handleCloseSettings" 
            @save="handleSaveSettings"
        />

        <TransformObject ref="frame" :scale="scale" :x="panX" :y="panY">
            <svg class="edges-layer">
                <PEdge 
                    v-for="edge in edges" 
                    :key="edge.id" 
                    :edge="edge"
                    :source-node="nodes.find(n => n.id === edge.sourceNodeId)"
                    :target-node="nodes.find(n => n.id === edge.targetNodeId)"
                    :dim = "edge.layer == 'control'? viewLayer == 'data': viewLayer == 'control'"
                    :hide = "edge.layer == 'control'? false: viewLayer == 'control'"
                    :x1="edge.x1"
                    :y1="edge.y1"
                    :x2="edge.x2"
                    :y2="edge.y2"
                />
                <PEdge 
                    v-if="drawingEdge" 
                    :drawingLayer="drawingEdge.layer"
                    is-drawing
                    :x1="drawingEdge.startPort.type == 'output' ? drawingStart.x : drawingEdge.endX"
                    :y1="drawingEdge.startPort.type == 'output' ? drawingStart.y : drawingEdge.endY"
                    :x2="drawingEdge.startPort.type == 'output' ? drawingEdge.endX : drawingStart.x"
                    :y2="drawingEdge.startPort.type == 'output' ? drawingEdge.endY : drawingStart.y"
                />
            </svg>
            <TransformObject v-for="node in nodes" :key="node.id" :x="node.x" :y="node.y">
                <PGraphNode 
                    :ref="setNodeRef(node.id)"
                    :node-data="node" 
                    :view-layer="viewLayer" 
                    class="node" 
                    @mousedown.stop="handleNodeMouseDown(node, $event, frame)"
                    @port-mousedown="handlePortMouseDown"   
                    @port-mouseup="handlePortMouseUp"
                    @dblclick.stop="handleOpenSettings(node)"
                />
            </TransformObject>
        </TransformObject>
    </TransformFrame>
</template>

<script setup lang="ts">
import TransformObject from '../transform/TransformObject.vue';
import TransformFrame from '../transform/TransformFrame.vue';
import PGraphNode from './PNode.vue';
import PEdge from './PEdge.vue';
import NodeSettings from './NodeSettings.vue';

import { ref, computed, watch, nextTick } from 'vue';
import type { NodeData, EdgeData, PortData } from '../../types/PGraph';
import { v4 as uuid } from 'uuid';
import { useGraph } from '@/composables/useGraph';

const frame = ref<InstanceType<typeof TransformObject>>();
const nodeRefs = ref<Record<string | number, InstanceType<typeof PGraphNode>>>({})

const setNodeRef = (id: string | number) => (el: any) => {
    if (el) nodeRefs.value[id] = el
}

// Use reusable graph logic
const {
    nodes,
    edges,
    scale,
    panX,
    panY,
    viewLayer,
    services,
    handleWheel,
    handleGraphMouseDown,
    handleNodeMouseDown,
    fetchServices,
    addServiceNode,
    backgroundStyle
} = useGraph();


// Initialize services
fetchServices();


// View Layer Switching
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
        event.preventDefault();
        viewLayer.value = viewLayer.value === 'control' ? 'data' : 'control';
    }
}
document.addEventListener('keydown', handleKeydown);


// --- Port / Edge Logic (Keep in component for now as it relies on refs heavily) ---
// This could be moved to composable if we pass refs or methods, but for now its fine here
// as it deals with specific UI element positions (ports).

const getPortPosition = (nodeId: number | string, port: PortData) => {
    // We need nodeRefs here which are component specific
    const nodeCmp = nodeRefs.value[nodeId];
    if (!nodeCmp || !frame.value) return { x: 0, y: 0 }
    
    // We can expose getPortPosition from PNode, and then transform it
    const screenPos = nodeCmp.getPortPosition(port)
    return frame.value.screenToLocal(screenPos)
};

const drawingEdge = ref<{startNodeId: number | string, startPort: PortData, endX: number, endY: number, layer:string} | null>(null);

const drawingStart = computed(() => {
    if (!drawingEdge.value) return { x: 0, y: 0 };
    return getPortPosition(drawingEdge.value.startNodeId, drawingEdge.value.startPort);
});


const handlePortMouseDown = (payload: { nodeId: number | string, port: PortData, event: MouseEvent }) => {
    const pos = getPortPosition(payload.nodeId, payload.port);
    drawingEdge.value = {
        startNodeId: payload.nodeId,
        startPort: payload.port,
        endX: pos.x,
        endY: pos.y,
        layer: payload.port.layer,
    };
    
    const onMouseMove = (e: MouseEvent) => {
        if (!drawingEdge.value) return;
        const mousePos = frame.value!.getMousePosition(e);
        drawingEdge.value.endX = mousePos.x;
        drawingEdge.value.endY = mousePos.y;
    };
    
    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        setTimeout(() => {
            drawingEdge.value = null;
        }, 10);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
};

const updateEdgePosition = (edge: EdgeData) => {
    const sourceNode = nodes.value.find(n => n.id === edge.sourceNodeId);
    const targetNode = nodes.value.find(n => n.id === edge.targetNodeId);
    
    if (!sourceNode || !targetNode) return;
    
    const sourcePort = [...sourceNode.inputs, ...sourceNode.outputs, sourceNode.controlInput, sourceNode.controlOutput].find(p => p.id === edge.sourcePortId);
    const targetPort = [...targetNode.inputs, ...targetNode.outputs, targetNode.controlInput, targetNode.controlOutput].find(p => p.id === edge.targetPortId);

    if (sourcePort && targetPort) {
        const pos1 = getPortPosition(edge.sourceNodeId, sourcePort);
        edge.x1 = pos1.x;
        edge.y1 = pos1.y;
        
        const pos2 = getPortPosition(edge.targetNodeId, targetPort);
        edge.x2 = pos2.x;
        edge.y2 = pos2.y;
    }
}

const updateAllEdgePositions = () => {
    edges.value.forEach(edge => {
        updateEdgePosition(edge);
    });
};

const handlePortMouseUp = (payload: {nodeId: number | string, port: PortData, event: MouseEvent}) => {
    if (drawingEdge.value) {
        if (drawingEdge.value.startNodeId === payload.nodeId) return;
        if (drawingEdge.value.startPort.type == payload.port.type) {
            drawingEdge.value = null
            return
        }

        let newEdge: EdgeData;
        const isOutput = drawingEdge.value.startPort.type == 'output';
        
        const sourceData = isOutput ? 
            { nid: drawingEdge.value.startNodeId, pid: drawingEdge.value.startPort.id } : 
            { nid: payload.nodeId, pid: payload.port.id };
            
        const targetData = isOutput ? 
            { nid: payload.nodeId, pid: payload.port.id } : 
            { nid: drawingEdge.value.startNodeId, pid: drawingEdge.value.startPort.id };

        newEdge = {
            id: uuid(),
            sourceNodeId: sourceData.nid,
            sourcePortId: sourceData.pid,
            targetNodeId: targetData.nid,
            targetPortId: targetData.pid,
            layer: payload.port.layer,
            x1: 0, y1: 0, x2: 0, y2: 0,
        };

        edges.value.push(newEdge);
        updateEdgePosition(newEdge);
        drawingEdge.value = null;
    }
};

// Sync edges when nodes move or edges are updated
watch(nodes, () => {
    nextTick(updateAllEdgePositions);
}, { deep: true });


// --- Settings Handling ---
const showServiceList = ref(false);
const settingsOpen = ref(false);
const selectedNode = ref<NodeData | null>(null);

const handleOpenSettings = (node: NodeData) => {
    selectedNode.value = node;
    settingsOpen.value = true;
};

// Autosave behavior implemented in NodeSettings but we still handle close/update
const handleSaveSettings = (payload: { inputMappings: Record<string, string> }) => {
    if (selectedNode.value && selectedNode.value.settings) {
        selectedNode.value.settings.inputMappings = payload.inputMappings;
    }
    // No explicit close on save if autosave, but we might want to keep it open?
    // User asked for autosave. 
};

const handleCloseSettings = () => {
    settingsOpen.value = false;
    selectedNode.value = null;
};

const onAddServiceClick = (service: any) => {
    addServiceNode(service);
    showServiceList.value = false;
}

</script>


<style scoped>
.p-graph {
    width: 100%;
    height: 100%;
    background-color: var(--bg-color);
    background-image: radial-gradient(var(--dot-color) 1.5px, transparent 1.5px);
    background-size: calc(32px * var(--scale, 1)) calc(32px * var(--scale, 1));
    background-position: 
        calc(50% + var(--pan-x, 0px)) 
        calc(50% + var(--pan-y, 0px));
}

.edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    overflow: visible;
}


</style>