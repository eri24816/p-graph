import { ref, computed, nextTick, watch } from 'vue'
import type { NodeData, EdgeData, PortData } from '@/types/PGraph'
import { v4 as uuid } from 'uuid'

export function useGraph() {
    const nodes = ref<NodeData[]>([])
    const edges = ref<EdgeData[]>([])

    const scale = ref(1)
    const panX = ref(0)
    const panY = ref(0)
    const viewLayer = ref<'control' | 'data'>('control')

    const backgroundStyle = computed(() => ({
        '--scale': scale.value,
        '--pan-x': `${panX.value}px`,
        '--pan-y': `${panY.value}px`
    }))

    const services = ref<any[]>([])

    // --- Selection State ---
    const selectedNodeIds = ref<Set<string | number>>(new Set())
    const selectedEdgeIds = ref<Set<string>>(new Set())

    const clearSelection = () => {
        selectedNodeIds.value.clear()
        selectedEdgeIds.value.clear()
    }

    const selectNode = (id: string | number, multi: boolean = false) => {
        if (!multi) clearSelection()
        selectedNodeIds.value.add(id)
    }

    const selectEdge = (id: string | number, multi: boolean = false) => {
        if (!multi) clearSelection()
        selectedEdgeIds.value.add(String(id))
    }

    const deleteSelection = () => {
        const nodesToDelete = new Set(selectedNodeIds.value)
        const edgesToDelete = new Set(selectedEdgeIds.value)

        // Remove nodes
        if (nodesToDelete.size > 0) {
            nodes.value = nodes.value.filter(n => !nodesToDelete.has(n.id))
            // Remove edges connected to deleted nodes
            edges.value = edges.value.filter(e =>
                !nodesToDelete.has(e.sourceNodeId) && !nodesToDelete.has(e.targetNodeId)
            )
            selectedNodeIds.value.clear()
        }

        // Remove edges
        if (edgesToDelete.size > 0) {
            edges.value = edges.value.filter(e => !edgesToDelete.has(String(e.id)))
            selectedEdgeIds.value.clear()
        }
    }

    // --- Clipboard ---
    const clipboard = ref<NodeData[]>([])

    const copySelection = () => {
        clipboard.value = nodes.value.filter(n => selectedNodeIds.value.has(n.id)).map(n => JSON.parse(JSON.stringify(n)))
    }

    const pasteSelection = () => {
        if (clipboard.value.length === 0) return

        clearSelection()
        clipboard.value.forEach(node => {
            const newNode = JSON.parse(JSON.stringify(node))
            newNode.id = uuid()
            newNode.x += 20
            newNode.y += 20

            // Regenerate port IDs
            if (newNode.inputs) newNode.inputs.forEach((p: any) => p.id = uuid())
            if (newNode.outputs) newNode.outputs.forEach((p: any) => p.id = uuid())
            if (newNode.controlInput) newNode.controlInput.id = uuid()
            if (newNode.controlOutput) newNode.controlOutput.id = uuid()

            nodes.value.push(newNode)
            selectNode(newNode.id, true)
        })
    };


    // --- Graph Interaction Logic ---

    const handleWheel = (event: WheelEvent, frameEl: any) => {
        if (!frameEl) return
        const originalMX = frameEl.getMousePosition(event).x
        const originalMY = frameEl.getMousePosition(event).y
        const originalScale = scale.value
        scale.value *= Math.exp(event.deltaY / -1000)
        panX.value = -(originalMX * scale.value - (originalMX * originalScale + panX.value))
        panY.value = -(originalMY * scale.value - (originalMY * originalScale + panY.value))
    }

    class DragGraphHandler {
        private startMouseX: number
        private startMouseY: number
        private isDragging: boolean = false

        constructor(event: MouseEvent, frameEl: any) {
            this.startMouseX = frameEl.getMousePosition(event).x
            this.startMouseY = frameEl.getMousePosition(event).y
        }

        update = (event: MouseEvent, frameEl: any) => {
            const mouseX = frameEl.getMousePosition(event).x
            const mouseY = frameEl.getMousePosition(event).y
            if (Math.abs(mouseX - this.startMouseX) > 2 || Math.abs(mouseY - this.startMouseY) > 2) {
                this.isDragging = true
            }
            panX.value += (mouseX - this.startMouseX) * scale.value
            panY.value += (mouseY - this.startMouseY) * scale.value
        }

        get dragged() { return this.isDragging }
    }

    const handleGraphMouseDown = (event: MouseEvent, frameEl: any) => {
        if (!frameEl) return

        // If clicking background/graph, clear selection unless shift is held?
        // Usually clicking background clears selection.
        const handler = new DragGraphHandler(event, frameEl)

        const onMouseMove = (e: MouseEvent) => handler.update(e, frameEl)
        const onMouseUp = () => {
            if (!handler.dragged) {
                clearSelection()
            }
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    // --- Node Dragging ---
    class DragNodeHandler {
        private node: NodeData
        private startNodeX: number
        private startNodeY: number
        private startMouseX: number
        private startMouseY: number

        constructor(node: NodeData, event: MouseEvent, frameEl: any) {
            this.node = node
            this.startNodeX = node.x
            this.startNodeY = node.y
            this.startMouseX = frameEl.getMousePosition(event).x
            this.startMouseY = frameEl.getMousePosition(event).y
        }

        update = (event: MouseEvent, frameEl: any) => {
            const mouseX = frameEl.getMousePosition(event).x
            const mouseY = frameEl.getMousePosition(event).y
            this.node.x = this.startNodeX + (mouseX - this.startMouseX)
            this.node.y = this.startNodeY + (mouseY - this.startMouseY)
        }
    }

    const handleNodeMouseDown = (node: NodeData, event: MouseEvent, frameEl: any) => {
        if (!frameEl) return

        // Selection Logic
        if (!selectedNodeIds.value.has(node.id)) {
            if (!event.shiftKey) clearSelection()
            selectNode(node.id, true)
        } else if (event.shiftKey) {
            // Deselect? Or just keep? For now keep simple
        }

        const handler = new DragNodeHandler(node, event, frameEl)
        const onMouseMove = (e: MouseEvent) => handler.update(e, frameEl)
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    // --- Services ---
    const fetchServices = async () => {
        try {
            const res = await fetch('http://localhost:8000/services')
            if (res.ok) {
                services.value = await res.json()
            }
        } catch (e) {
            console.error("Failed to fetch services", e)
        }
    }

    const addServiceNode = (service: any) => {
        const nodeId = uuid()
        const newNode: NodeData = {
            id: nodeId,
            title: service.name,
            x: 100 + Math.random() * 100,
            y: 100 + Math.random() * 100,
            width: 150,
            inputs: [],
            outputs: [],
            controlInput: { id: uuid(), type: 'input', layer: 'control' },
            controlOutput: { id: uuid(), type: 'output', layer: 'control' },
            isService: true,
            serviceSchema: service,
            settings: {
                inputMappings: {},
                outputMappings: {}
            }
        }

        if (service.input_fields) {
            Object.keys(service.input_fields).forEach(key => {
                newNode.inputs.push({ id: uuid(), type: 'input', layer: 'data', name: key } as any)
            })
        }
        if (service.output_fields) {
            Object.keys(service.output_fields).forEach(key => {
                newNode.outputs.push({ id: uuid(), type: 'output', layer: 'data', name: key } as any)
            })
        }

        nodes.value.push(newNode)
    }

    const addStartNode = () => {
        // Enforce single start node? For now, yes
        const existingStart = nodes.value.find(n => n.isStart)
        if (existingStart) {
            selectNode(existingStart.id)
            return
        }

        const newNode: NodeData = {
            id: uuid(),
            title: "Start",
            x: 50,
            y: 50,
            width: 100,
            inputs: [],
            outputs: [],
            controlInput: { id: uuid(), type: 'input', layer: 'control' }, // Maybe no input for start?
            controlOutput: { id: uuid(), type: 'output', layer: 'control' },
            isStart: true,
            settings: { inputMappings: {}, outputMappings: {} }
        }
        nodes.value.push(newNode)
    }

    // --- Serialization & Deployment ---

    const serializeGraph = () => {
        const serializedNodes = nodes.value.map(node => ({
            id: node.id,
            title: node.title,
            type: node.isService ? node.title : (node.isStart ? 'start' : 'Generic'),
            is_start: !!node.isStart,
            service_schema: node.serviceSchema ? node.serviceSchema : null,
            inputs: node.settings?.inputMappings || {},
            // Outputs are determined by service schema, not explicitly stored in settings usually,
            // but we can pass them if needed. For now, just inputs are enough for execution.
        }))

        const serializedEdges = edges.value.map(edge => ({
            source: edge.sourceNodeId,
            source_port: edge.sourcePortId, // In real execution we might need port names, but IDs are safer for internal linking
            target: edge.targetNodeId,
            target_port: edge.targetPortId
        }))

        return {
            nodes: serializedNodes,
            edges: serializedEdges
        }
    }

    const deployGraph = async () => {
        const graphData = serializeGraph()
        try {
            const res = await fetch('http://localhost:8000/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(graphData)
            })
            if (res.ok) {
                console.log("Graph deployed successfully")
                // Maybe trigger start immediately?
                await startGraph()
            } else {
                console.error("Failed to deploy graph")
            }
        } catch (e) {
            console.error("Error deploying graph", e)
        }
    }

    const startGraph = async () => {
        try {
            await fetch('http://localhost:8000/start', { method: 'POST' })
            startPolling()
        } catch (e) {
            console.error("Error starting graph", e)
        }
    }

    // --- Polling ---
    const activeNodeId = ref<string | null>(null)
    let pollingInterval: any = null

    const startPolling = () => {
        if (pollingInterval) clearInterval(pollingInterval)
        pollingInterval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:8000/state')
                if (res.ok) {
                    const state = await res.json()
                    activeNodeId.value = state.current_node_id
                    if (!state.running) {
                        stopPolling()
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
                stopPolling()
            }
        }, 500)
    }

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
        }
        activeNodeId.value = null
    };


    return {
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
        backgroundStyle,
        deployGraph,
        activeNodeId,
        selectedNodeIds,
        selectedEdgeIds,
        selectNode,
        selectEdge,
        clearSelection,
        deleteSelection,
        copySelection,
        pasteSelection,
        addStartNode
    }
}
