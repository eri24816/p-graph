<template>
    <TransformFrame class="p-graph" @wheel="handleWheel" @mousedown="handleGraphMouseDown">
        <TransformObject ref="transform" :scale="scale" :x="panX" :y="panY">
            <TransformFrame class="transform-frame" ref="frame">
                <TransformObject v-for="node in nodes" :x="node.x" :y="node.y">
                    <PGraphNode :key="node.id" :node-data="node" class="node" @mousedown.stop="handleNodeMouseDown(node, $event)">
                    </PGraphNode>
                </TransformObject>
            </TransformFrame>
        </TransformObject>
    </TransformFrame>
</template>

<script setup lang="ts">
import TransformObject from '../transform/TransformObject.vue';
import TransformFrame from '../transform/TransformFrame.vue';
import PGraphNode from './PNode.vue';

import { ref } from 'vue';
import type { NodeData } from '../../types/PGraph';

const frame = ref<InstanceType<typeof TransformFrame>>();

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
    { id: 1, title: "Node 1", x: 0, y: 0, width: 5, controls: [], inputs: [{ id: 1, type: "input", x: 0, y: 0 }], outputs: [{ id: 1, type: "output", x: 0, y: 0 }, { id: 2, type: "output", x: 0, y: 0 }] },
    { id: 2, title: "Node 2", x: 150, y: 150, width: 5, controls: [], inputs: [{ id: 1, type: "input", x: 0, y: 0 }, { id: 2, type: "input", x: 0, y: 10 }], outputs: [{ id: 1, type: "output", x: 0, y: 0 }] },
]);

const transform = ref<InstanceType<typeof TransformObject>>();
const scale = ref(1);
const panX = ref(0);
const panY = ref(0);

const handleWheel = (event: WheelEvent) => {
    const originalMX = frame.value!.getMousePosition(event).x;
    const originalMY = frame.value!.getMousePosition(event).y;
    const originalScale = scale.value;
    scale.value *= Math.exp(event.deltaY / -1000);
    panX.value = -(originalMX * scale.value - (originalMX * originalScale + panX.value));
    panY.value = -(originalMY * scale.value - (originalMY * originalScale + panY.value));
}

const handleNodeMouseDown = (node: NodeData, event: MouseEvent) => {
    console.log(node);
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
    console.log(event);
    const handler = new DragGraphHandler(event);
    window.addEventListener('mousemove', handler.update);
    window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', handler.update);
    });
}
</script>       

<style scoped>
.p-graph {
    width: 100%;
    height: 100%;
}
.transform-frame {
    width: 100%;
    height: 100%;
}
</style>