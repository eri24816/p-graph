<template>
    <div class="canvas-container" @wheel="handleWheel" @mousedown="handleMouseDown(null, $event)">
        <div class="canvas" ref="canvas" :style="{ transform: `scale(${scale})` }">
            <PGraphNode v-for="node in nodes" :key="node.id" :node-data="node" class="node"
                :style="{ left: blockToPixelX(node.x) + 'px', top: blockToPixelY(node.y) + 'px', width: getNodeSize(node).width + 'px', height: getNodeSize(node).height + 'px' }"
                :px-per-unit="pxPerUnit" 
                @mousedown.stop="handleMouseDown(node.id, $event)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import PGraphNode from './PGraphNode.vue'
import { ref, onMounted, markRaw, computed } from 'vue'
import type { NodeData } from '../types/PGraph'
import TitleControl from './controls/TitleControl.vue'

const canvas = ref<HTMLDivElement | null>(null)
const nodes = ref<NodeData[]>([
    {
        id: 1, title: "Node 1", x: 0, y: 0, width: 5, controls: [
            { id: 1, component: markRaw(TitleControl), height: 1, props: { title: "Node 1" } }
        ]
    },
    {
        id: 2, title: "Node 2", x: 1, y: 3, width: 5, controls: [
            { id: 1, component: markRaw(TitleControl), height: 1, props: { title: "Node 2" } }
        ]
    },
    {
        id: 3, title: "Node 3", x: 2, y: 5, width: 5, controls: [
            { id: 1, component: markRaw(TitleControl), height: 2, props: { title: "Node 3" } }
        ]
    },
])

const pxPerUnit = 24
const canvasWidth = ref(1000)
const canvasHeight = ref(1000)
const canvasShiftX = ref(0)
const canvasShiftY = ref(0)
const nodePadding = 0
const scale = ref(1)



const getNodeSize = (node: NodeData) => {
    return {
        width: node.width * pxPerUnit + nodePadding * 2,
        height: node.controls.reduce((acc, control) => acc + control.height, 0) * pxPerUnit + nodePadding * 2,
    }
}

const getNodeById = (nodeId: number) => {
    return nodes.value.find(node => node.id === nodeId)
}

const pixelToBlock = (pixel: number) => {
    return Math.round(pixel / pxPerUnit / scale.value)
}

const pixelToBlockX = (pixel: number) => {
    return pixelToBlock(pixel - canvasShiftX.value - canvasWidth.value / 2)
}

const pixelToBlockY = (pixel: number) => {
    return pixelToBlock(pixel - canvasShiftY.value - canvasHeight.value / 2)
}

const blockToPixel = (block: number) => {
    return block * pxPerUnit
}

const blockToPixelX = (block: number) => {
    return blockToPixel(block) + canvasShiftX.value + canvasWidth.value / 2
}

const blockToPixelY = (block: number) => {
    return blockToPixel(block) + canvasShiftY.value + canvasHeight.value / 2
}

class DragNodeHandler {
    private nodeId: number
    private startBlockX: number
    private startBlockY: number
    private startMouseX: number
    private startMouseY: number

    constructor(nodeId: number, startBlockX: number, startBlockY: number, startMouseX: number, startMouseY: number) {
        this.nodeId = nodeId
        this.startBlockX = startBlockX
        this.startBlockY = startBlockY
        this.startMouseX = startMouseX
        this.startMouseY = startMouseY
    }

    handleMouseMove(e: MouseEvent) {
        e.preventDefault()
        const deltaMouseX = e.clientX - this.startMouseX
        const deltaMouseY = e.clientY - this.startMouseY
        const deltaBlockX = pixelToBlock(deltaMouseX)
        const deltaBlockY = pixelToBlock(deltaMouseY)
        const node = getNodeById(this.nodeId)
        if (node) {
            node.x = this.startBlockX + deltaBlockX
            node.y = this.startBlockY + deltaBlockY
        }
    }

    handleMouseUp() {
    }
}

class DragCanvasHandler {
    private startMouseX: number
    private startMouseY: number
    private startCanvasShiftX: number
    private startCanvasShiftY: number

    constructor(startMouseX: number, startMouseY: number) {
        this.startMouseX = startMouseX
        this.startMouseY = startMouseY
        this.startCanvasShiftX = canvasShiftX.value
        this.startCanvasShiftY = canvasShiftY.value
    }

    handleMouseMove(e: MouseEvent) {
        e.preventDefault()
        const deltaMouseX = e.clientX - this.startMouseX
        const deltaMouseY = e.clientY - this.startMouseY
        canvasShiftX.value = this.startCanvasShiftX + deltaMouseX / scale.value
        canvasShiftY.value = this.startCanvasShiftY + deltaMouseY / scale.value
    }

    handleMouseUp() {
    }
}

const handleMouseDown = (nodeId: number | null, e: MouseEvent) => {
    canvas.value?.classList.add('no-select')
    let dragHandler: DragNodeHandler | DragCanvasHandler | null = null
    if (nodeId) {
        const node = getNodeById(nodeId)!
        const startMouseX = e.clientX
        const startMouseY = e.clientY
        const startBlockX = node.x
        const startBlockY = node.y
        dragHandler = new DragNodeHandler(nodeId, startBlockX, startBlockY, startMouseX, startMouseY)
    } else {
        const startMouseX = e.clientX
        const startMouseY = e.clientY
        dragHandler = new DragCanvasHandler(startMouseX, startMouseY)
    }

    if (!dragHandler) {
        return
    }

    const handleMouseMove = (e: MouseEvent) => {
        dragHandler.handleMouseMove(e)
    }

    const handleMouseUp = () => {
        dragHandler.handleMouseUp()
        canvas.value?.classList.remove('no-select')
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
}

const handleWheel = (e: WheelEvent) => {
    /* zoom and keep mouse position in the same place on the canvas */
    e.preventDefault()
    const preMouseX = (e.clientX - canvasWidth.value / 2) / scale.value
    const preMouseY = (e.clientY - canvasHeight.value / 2) / scale.value
    scale.value *= Math.exp(-e.deltaY / 1000)
    const postMouseX = (e.clientX - canvasWidth.value / 2) / scale.value
    const postMouseY = (e.clientY - canvasHeight.value / 2) / scale.value
    canvasShiftX.value += postMouseX - preMouseX
    canvasShiftY.value += postMouseY - preMouseY
}

onMounted(() => {
    const boundingBox = document.querySelector('.canvas')?.getBoundingClientRect()
    if (boundingBox) {
        canvasWidth.value = boundingBox.width
        canvasHeight.value = boundingBox.height
    }
})
</script>

<style scoped>
.no-select {
    user-select: none;
}

.canvas-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    background-color: #171717;
}

.canvas {
    width: 100%;
    height: 100%;
}

.node {
    position: absolute;
}
</style>