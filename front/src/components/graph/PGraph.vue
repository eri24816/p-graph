<template>
    <div class="pgraph-container">
        <SidebarPalette :functions="functions" @addFunctionNode="addFunctionNode" @addStartNode="addStartNode" />
        <button class="run-btn" @click="deployGraph">Run</button>
        <div class="file-controls">
            <button class="file-btn" @click="handleSaveDisk">Save</button>
            <button class="file-btn" @click="handleLoadDisk">Load</button>
        </div>

        <div v-if="loadingOpen" class="load-overlay" @click.self="loadingOpen = false">
            <div class="load-modal">
                <h3>Load Graph</h3>
                <div class="file-list">
                    <div v-for="file in availableFiles" :key="file" class="file-item" @click="confirmLoad(file)">
                        {{ file }}
                    </div>
                    <div v-if="availableFiles.length === 0" style="padding: 10px; color: #888;">No saved graphs
                        found.</div>
                </div>
                <button class="close-load-btn" @click="loadingOpen = false">Cancel</button>
            </div>
        </div>

        <NodeSettings v-if="selectedNode" :node="selectedNode" :all-nodes="nodes" :is-open="settingsOpen"
            :validation-issues="getNodeIssues(selectedNode.id)"
            @close="handleCloseSettings" @save="handleSaveSettings" />

        <div class="graph-area">
            <TransformFrame class="p-graph" @wheel="onWheel($event)"
                @mousedown="onBackgroundMouseDown($event)" @contextmenu="onContextMenu($event)" :style="backgroundStyle">



                <TransformObject ref="frame" :scale="scale" :x="panX" :y="panY">
                    <RectSelection :rect="editor.selectionRect.value" :visible="editor.isRectSelecting.value" />
                    <svg class="edges-layer">
                        <PEdge v-for="edge in edges" :key="edge.id" :edge="edge"
                            :source-node="nodes.find(n => n.id === edge.sourceNodeId)"
                            :target-node="nodes.find(n => n.id === edge.targetNodeId)"
                            :hide="edge.layer != viewLayer"
                            :is-selected="editor.selectedEdgeIds.value.has(edge.id)" :x1="edge.x1" :y1="edge.y1"
                            :x2="edge.x2" :y2="edge.y2" @click="(e, event) => editor.handleEdgeClick(e, event)" />
                        <PEdge v-if="drawingEdge" :drawingLayer="drawingEdge.layer" is-drawing
                            :x1="drawingEdge.startPort.type == 'output' ? drawingStart.x : drawingEdge.endX"
                            :y1="drawingEdge.startPort.type == 'output' ? drawingStart.y : drawingEdge.endY"
                            :x2="drawingEdge.startPort.type == 'output' ? drawingEdge.endX : drawingStart.x"
                            :y2="drawingEdge.startPort.type == 'output' ? drawingEdge.endY : drawingStart.y" />
                    </svg>
                    <TransformObject v-for="node in nodes" :key="node.id" :x="node.x" :y="node.y">
                        <PGraphNode :ref="setNodeRef(node.id)" :node-data="node" :view-layer="viewLayer" class="node"
                            @mousedown.stop="editor.handleNodeMouseDown(node, $event, frame)"
                            @port-mousedown="handlePortMouseDown" @port-mouseup="handlePortMouseUp"
                            @dblclick.stop="handleOpenSettings(node)" :is-active="activeNodeId === node.id"
                            :is-selected="editor.selectedNodeIds.value.has(node.id)"
                            :validation-issues="getNodeIssues(node.id)" />
                    </TransformObject>
                </TransformObject>
            </TransformFrame>
        </div>
    </div>
</template>

<script setup lang="ts">
import TransformObject from '../transform/TransformObject.vue'
import TransformFrame from '../transform/TransformFrame.vue'
import PGraphNode from './PNode.vue'
import PEdge from './PEdge.vue'
import NodeSettings from './NodeSettings.vue'
import SidebarPalette from './SidebarPalette.vue'
import RectSelection from './RectSelection.vue'

import { ref, computed, watch, nextTick, onMounted } from 'vue'
import type { NodeData, EdgeData, PortData } from '../../types/PGraph'
import { v4 as uuid } from 'uuid'
import { useGraph } from '@/composables/useGraph'
import { useGraphValidation } from '@/composables/useGraphValidation'

const frame = ref<InstanceType<typeof TransformObject>>()
const nodeRefs = ref<Record<string | number, InstanceType<typeof PGraphNode>>>({})

const setNodeRef = (id: string | number) => (el: any) => {
    if (el) nodeRefs.value[id] = el
}

// Setup getNodeBounds callback for editor (defined before useGraph)
const getNodeBounds = (nodeId: string | number): DOMRect | null => {
    const nodeRef = nodeRefs.value[nodeId]
    if (!nodeRef) return null
    return nodeRef.getBoundingRect()
}

// --- Settings Handling (defined before useGraph) ---
const settingsOpen = ref(false)
const selectedNode = ref<NodeData | null>(null)

// Use reusable graph logic
const graph = useGraph(getNodeBounds, settingsOpen)
const {
    nodes,
    edges,
    scale,
    panX,
    panY,
    viewLayer,
    functions,
    handleWheel,
    handleGraphMouseDown,
    fetchFunctions,
    addFunctionNode,
    backgroundStyle,
    deployGraph,
    activeNodeId,
    addStartNode,
    loadFromLocalStorage,
    saveGraphToDisk,
    loadGraphFromDisk,
    listGraphs,
    editor
} = graph

// Use validation logic
const validation = useGraphValidation(nodes, edges)
const { getNodeIssues } = validation

// Initialize services
fetchFunctions()

// Initialize Autosave
onMounted(() => {
    loadFromLocalStorage()
})

// --- Persistence UI ---
const loadingOpen = ref(false)
const availableFiles = ref<string[]>([])

const handleSaveDisk = async () => {
    const name = prompt("Enter filename to save:", "my_graph")
    if (name) {
        const success = await saveGraphToDisk(name)
    }
}

const handleLoadDisk = async () => {
    availableFiles.value = await listGraphs()
    loadingOpen.value = true
}

const confirmLoad = async (filename: string) => {
    if (confirm(`Load ${filename}? Unsaved changes will be lost.`)) {
        await loadGraphFromDisk(filename)
        loadingOpen.value = false
    }
}


// Background click handler
const onBackgroundMouseDown = (event: MouseEvent) => {
    if (!frame.value) return
    // Ignore if settings modal is open
    if (settingsOpen.value) return

    event.preventDefault();

    // Middle mouse button (button 1) always pans
    if (event.button === 1) {
        handleGraphMouseDown(event, frame.value)
        return
    }

    // Use editor's background handler for selection
    if (event.button === 0) {
        editor.handleBackgroundMouseDown(event, frame.value)
    } else {
        // Fall back to pan handler
        handleGraphMouseDown(event, frame.value)
    }
}

// Wheel handler (for zooming)
const onWheel = (event: WheelEvent) => {
    // Ignore if settings modal is open
    if (settingsOpen.value) return
    handleWheel(event, frame.value)
}

// Context menu handler (prevent right-click menu)
const onContextMenu = (event: MouseEvent) => {
    event.preventDefault() // Always prevent context menu on the graph area
}

// View Layer Switching & Shortcuts
const handleKeydown = (event: KeyboardEvent) => {
    // Ignore if settings modal is open
    if (settingsOpen.value) return

    // Ignore if input is focused
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

    if (event.key === 'Tab') {
        event.preventDefault()
        viewLayer.value = viewLayer.value === 'control' ? 'data' : 'control'
        return
    }

    // Let editor handle other keyboard shortcuts
    editor.handleKeyDown(event)
}
document.addEventListener('keydown', handleKeydown)


// --- Port / Edge Logic (Keep in component for now as it relies on refs heavily) ---
// This could be moved to composable if we pass refs or methods, but for now its fine here
// as it deals with specific UI element positions (ports).

const getPortPosition = (nodeId: number | string, port: PortData) => {
    // We need nodeRefs here which are component specific
    const nodeCmp = nodeRefs.value[nodeId]
    if (!nodeCmp || !frame.value) return { x: 0, y: 0 }

    // We can expose getPortPosition from PNode, and then transform it
    const screenPos = nodeCmp.getPortPosition(port)
    return frame.value.screenToLocal(screenPos)
}

const drawingEdge = ref<{ startNodeId: number | string, startPort: PortData, endX: number, endY: number, layer: string } | null>(null)

const drawingStart = computed(() => {
    if (!drawingEdge.value) return { x: 0, y: 0 }
    return getPortPosition(drawingEdge.value.startNodeId, drawingEdge.value.startPort)
})


const handlePortMouseDown = (payload: { nodeId: number | string, port: PortData, event: MouseEvent }) => {
    const pos = getPortPosition(payload.nodeId, payload.port)
    drawingEdge.value = {
        startNodeId: payload.nodeId,
        startPort: payload.port,
        endX: pos.x,
        endY: pos.y,
        layer: payload.port.layer,
    }

    const onMouseMove = (e: MouseEvent) => {
        if (!drawingEdge.value) return
        const mousePos = frame.value!.getMousePosition(e)
        drawingEdge.value.endX = mousePos.x
        drawingEdge.value.endY = mousePos.y
    }

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        setTimeout(() => {
            drawingEdge.value = null
        }, 10)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
}

const updateEdgePosition = (edge: EdgeData) => {
    const sourceNode = nodes.value.find(n => n.id === edge.sourceNodeId)
    const targetNode = nodes.value.find(n => n.id === edge.targetNodeId)

    if (!sourceNode || !targetNode) return

    const sourcePort = [...sourceNode.inputs, ...sourceNode.outputs, sourceNode.controlInput, sourceNode.controlOutput].find(p => p.id === edge.sourcePortId)
    const targetPort = [...targetNode.inputs, ...targetNode.outputs, targetNode.controlInput, targetNode.controlOutput].find(p => p.id === edge.targetPortId)

    if (sourcePort && targetPort) {
        const pos1 = getPortPosition(edge.sourceNodeId, sourcePort)
        edge.x1 = pos1.x
        edge.y1 = pos1.y

        const pos2 = getPortPosition(edge.targetNodeId, targetPort)
        edge.x2 = pos2.x
        edge.y2 = pos2.y
    }
}

const updateAllEdgePositions = () => {
    edges.value.forEach(edge => {
        updateEdgePosition(edge)
    })
}

const handlePortMouseUp = (payload: { nodeId: number | string, port: PortData, event: MouseEvent }) => {
    if (drawingEdge.value) {
        if (drawingEdge.value.startNodeId === payload.nodeId) return
        if (drawingEdge.value.startPort.type == payload.port.type) {
            drawingEdge.value = null
            return
        }

        let newEdge: EdgeData
        const isOutput = drawingEdge.value.startPort.type == 'output'

        const sourceData = isOutput ?
            { nid: drawingEdge.value.startNodeId, pid: drawingEdge.value.startPort.id } :
            { nid: payload.nodeId, pid: payload.port.id }

        const targetData = isOutput ?
            { nid: payload.nodeId, pid: payload.port.id } :
            { nid: drawingEdge.value.startNodeId, pid: drawingEdge.value.startPort.id }

        newEdge = {
            id: uuid(),
            sourceNodeId: sourceData.nid,
            sourcePortId: sourceData.pid,
            targetNodeId: targetData.nid,
            targetPortId: targetData.pid,
            layer: payload.port.layer,
            x1: 0, y1: 0, x2: 0, y2: 0,
        }

        edges.value.push(newEdge)
        updateEdgePosition(newEdge)
        drawingEdge.value = null
    }
}

// Sync edges when nodes move or edges are updated
watch(nodes, () => {
    nextTick(updateAllEdgePositions)
}, { deep: true })


// --- Settings Handling ---
const handleOpenSettings = (node: NodeData) => {
    selectedNode.value = node
    settingsOpen.value = true
}

// Autosave behavior implemented in NodeSettings but we still handle close/update
const handleSaveSettings = (payload: { nodeName?: string, inputMappings: Record<string, string> }) => {
    if (selectedNode.value) {
        if (payload.nodeName !== undefined) {
            selectedNode.value.nodeName = payload.nodeName
        }
        if (selectedNode.value.inputVariables) {
            selectedNode.value.inputVariables = payload.inputMappings
        }
    }
}

const handleCloseSettings = () => {
    settingsOpen.value = false
    selectedNode.value = null
};


</script>




<style scoped>
.pgraph-container {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.graph-area {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.p-graph {
    width: 100%;
    height: 100%;
    background-color: var(--bg-color);
    background-image: radial-gradient(var(--dot-color) 1.5px, transparent 1.5px);
    background-size: calc(32px * var(--scale, 1)) calc(32px * var(--scale, 1));
    background-position:
        calc(50% + var(--pan-x, 0px)) calc(50% + var(--pan-y, 0px));
}

.edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    overflow: visible;
}

.run-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    /* Moved to right */
    left: auto;
    z-index: 100;
    padding: 8px 24px;
    background: #2ea043;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.run-btn:hover {
    background: #238636;
}

.file-controls {
    position: absolute;
    top: 10px;
    right: 90px;
    z-index: 100;
    display: flex;
    gap: 8px;
}

.file-btn {
    padding: 8px 16px;
    background: #252526;
    color: #ccc;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.file-btn:hover {
    background: #333333;
    color: white;
    border-color: #555;
}

.load-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.load-modal {
    background: #1e1e1e;
    width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    padding: 20px;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
}

.load-modal h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #e0e0e0;
}

.file-list {
    flex: 1;
    overflow-y: auto;
    background: #252526;
    border: 1px solid #333;
    border-radius: 4px;
    margin-bottom: 15px;
    max-height: 300px;
}

.file-item {
    padding: 8px 12px;
    cursor: pointer;
    color: #ccc;
    border-bottom: 1px solid #2d2d2d;
}

.file-item:hover {
    background: #2a2d2e;
    color: white;
}

.close-load-btn {
    align-self: flex-end;
    padding: 6px 12px;
    background: none;
    border: 1px solid #444;
    color: #ccc;
    border-radius: 3px;
    cursor: pointer;
}

.close-load-btn:hover {
    background: #333;
    color: white;
}
</style>