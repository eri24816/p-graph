<template>
    <TransformFrame class="p-graph" @wheel="handleWheel" @mousedown="handleGraphMouseDown" :style="backgroundStyle">
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
                    @mousedown.stop="handleNodeMouseDown(node, $event)"
                    @port-mousedown="handlePortMouseDown"   
                    @port-mouseup="handlePortMouseUp"
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

import { ref, computed, watch, nextTick } from 'vue';
import type { NodeData, EdgeData, PortData } from '../../types/PGraph';
import { v4 as uuid } from 'uuid';

const frame = ref<InstanceType<typeof TransformObject>>();
const nodeRefs = ref<Record<string | number, InstanceType<typeof PGraphNode>>>({})

const setNodeRef = (id: string | number) => (el: any) => {
    if (el) nodeRefs.value[id] = el
}

class DragNodeHandler {
    private node: NodeData;
    private startNodeX: number;
    private startNodeY: number;
    private startMouseX: number;
    private startMouseY: number;
    
    constructor(node: NodeData, event: MouseEvent) {
        this.node = node;
        this.startNodeX = node.x;
        this.startNodeY = node.y;
        this.startMouseX = frame.value!.getMousePosition(event).x;
        this.startMouseY = frame.value!.getMousePosition(event).y;
    }

    update = (event: MouseEvent) => {
        const mouseX = frame.value!.getMousePosition(event).x;
        const mouseY = frame.value!.getMousePosition(event).y;
        this.node.x = this.startNodeX + (mouseX - this.startMouseX);
        this.node.y = this.startNodeY + (mouseY - this.startMouseY);
    }
}

const nodes = ref<NodeData[]>([
    { id: 1, title: "Node 1", x: 0, y: 0, width: 5, inputs: [{ id: uuid(), type: "input", layer: "data"}], outputs: [{ id: uuid(), type: "output", layer: "data"}, { id: uuid(), type: "output", layer: "data"}], controlInput: {id: uuid(), type: "input", layer: "control"}, controlOutput: {id: uuid(), type: "output", layer: "control"} },
    { id: 2, title: "Node 2", x: 150, y: 150, width: 5, inputs: [{ id: uuid(), type: "input", layer: "data"}, { id: uuid(), type: "input", layer: "data"}], outputs: [{ id: uuid(), type: "output", layer: "data"}], controlInput: {id: uuid(), type: "input", layer: "control"}, controlOutput: {id: uuid(), type: "output", layer: "control"} },
]);


const edges = ref<EdgeData[]>([]);

const scale = ref(1);
const panX = ref(0);
const panY = ref(0);

const viewLayer = ref<'control' | 'data'>('control');

// tab to switch view layer

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
        event.preventDefault();
        viewLayer.value = viewLayer.value === 'control' ? 'data' : 'control';
    }
}
document.addEventListener('keydown', handleKeydown);

const handleWheel = (event: WheelEvent) => {
    const originalMX = frame.value!.getMousePosition(event).x;
    const originalMY = frame.value!.getMousePosition(event).y;
    const originalScale = scale.value;
    scale.value *= Math.exp(event.deltaY / -1000);
    panX.value = -(originalMX * scale.value - (originalMX * originalScale + panX.value));
    panY.value = -(originalMY * scale.value - (originalMY * originalScale + panY.value));
}

const handleNodeMouseDown = (node: NodeData, event: MouseEvent) => {
    const handler = new DragNodeHandler(node, event);
    window.addEventListener('mousemove', handler.update);
    window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', handler.update);
    });
}

class DragGraphHandler {
    private startMouseX: number;
    private startMouseY: number;

    constructor(event: MouseEvent) {
        this.startMouseX = frame.value!.getMousePosition(event).x;
        this.startMouseY = frame.value!.getMousePosition(event).y;
    }

    update = (event: MouseEvent) => {
        const mouseX = frame.value!.getMousePosition(event).x;
        const mouseY = frame.value!.getMousePosition(event).y;
        panX.value += (mouseX - this.startMouseX) * scale.value;
        panY.value += (mouseY - this.startMouseY) * scale.value;

    }
}

const handleGraphMouseDown = (event: MouseEvent) => {
    const handler = new DragGraphHandler(event);
    window.addEventListener('mousemove', handler.update);
    window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', handler.update);
    });
}


const drawingEdge = ref<{startNodeId: number | string, startPort: PortData, endX: number, endY: number, layer:string} | null>(null);

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


const handlePortMouseUp = (payload: {nodeId: number | string, port: PortData, event: MouseEvent}) => {
    if (drawingEdge.value) {
        // Prevent connecting to same node
        if (drawingEdge.value.startNodeId === payload.nodeId) return;
        
        // Prevent connecting same type (simple rule: input to output or vice-versa)
        if (drawingEdge.value.startPort.type == payload.port.type) {
            drawingEdge.value = null
            return
        }

        let newEdge: EdgeData;
        
        if (drawingEdge.value.startPort.type == 'output') {
            newEdge = {
                id: uuid(),
                sourceNodeId: drawingEdge.value.startNodeId,
                sourcePortId: drawingEdge.value.startPort.id,
                targetNodeId: payload.nodeId,
                targetPortId: payload.port.id,
                layer: payload.port.layer,
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
            };
        }
        else {
            newEdge = {
                id: uuid(),
                sourceNodeId: payload.nodeId,
                sourcePortId: payload.port.id,
                targetNodeId: drawingEdge.value.startNodeId,
                targetPortId: drawingEdge.value.startPort.id,
                layer: payload.port.layer,
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
            };
        }

        
        edges.value.push(newEdge);
        updateEdgePosition(newEdge);
        
        drawingEdge.value = null;
    }
};

const getPortPosition = (nodeId: number | string, port: PortData) => {
    const screenPos = nodeRefs.value[nodeId].getPortPosition(port)
    return frame.value!.screenToLocal(screenPos)
};

const drawingStart = computed(() => {
    if (!drawingEdge.value) return { x: 0, y: 0 };
    return getPortPosition(drawingEdge.value.startNodeId, drawingEdge.value.startPort);
});

const backgroundStyle = computed(() => ({
    '--scale': scale.value,
    '--pan-x': `${panX.value}px`,
    '--pan-y': `${panY.value}px`,
}));
const updateAllEdgePositions = () => {
    edges.value.forEach(edge => {
        updateEdgePosition(edge);
    });
};

const updateEdgePosition = (edge: EdgeData) => {
    const sourceNode = nodes.value.find(n => n.id === edge.sourceNodeId)!
    const targetNode = nodes.value.find(n => n.id === edge.targetNodeId)!
    
    
    // Find ports to pass to getPortPosition
    const sourcePort = [...sourceNode.inputs, ...sourceNode.outputs, sourceNode.controlInput, sourceNode.controlOutput].find(p => p.id === edge.sourcePortId)!
    const targetPort = [...targetNode.inputs, ...targetNode.outputs, targetNode.controlInput, targetNode.controlOutput].find(p => p.id === edge.targetPortId)!
    const pos1 = getPortPosition(edge.sourceNodeId, sourcePort);
    edge.x1 = pos1.x;
    edge.y1 = pos1.y;
    
    const pos2 = getPortPosition(edge.targetNodeId, targetPort);
    edge.x2 = pos2.x;
    edge.y2 = pos2.y;
    console.log(pos1, pos2)
}

// Sync edges when nodes move or edges are updated
watch(nodes, () => {
    nextTick(updateAllEdgePositions);
}, { deep: true });


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