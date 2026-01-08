import { ref, computed, nextTick, watch } from 'vue'
import type { NodeData, EdgeData, PortData } from '@/types/PGraph'
import { v4 as uuid } from 'uuid'

export function useGraph() {
    const nodes = ref<NodeData[]>([
        { id: 1, title: "Node 1", x: 0, y: 0, width: 5, inputs: [{ id: uuid(), type: "input", layer: "data" }], outputs: [{ id: uuid(), type: "output", layer: "data" }, { id: uuid(), type: "output", layer: "data" }], controlInput: { id: uuid(), type: "input", layer: "control" }, controlOutput: { id: uuid(), type: "output", layer: "control" } },
        { id: 2, title: "Node 2", x: 150, y: 150, width: 5, inputs: [{ id: uuid(), type: "input", layer: "data" }, { id: uuid(), type: "input", layer: "data" }], outputs: [{ id: uuid(), type: "output", layer: "data" }], controlInput: { id: uuid(), type: "input", layer: "control" }, controlOutput: { id: uuid(), type: "output", layer: "control" } },
    ])
    const edges = ref<EdgeData[]>([])

    const scale = ref(1)
    const panX = ref(0)
    const panY = ref(0)
    const viewLayer = ref<'control' | 'data'>('control')

    const services = ref<any[]>([])

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

        constructor(event: MouseEvent, frameEl: any) {
            this.startMouseX = frameEl.getMousePosition(event).x
            this.startMouseY = frameEl.getMousePosition(event).y
        }

        update = (event: MouseEvent, frameEl: any) => {
            const mouseX = frameEl.getMousePosition(event).x
            const mouseY = frameEl.getMousePosition(event).y
            panX.value += (mouseX - this.startMouseX) * scale.value
            panY.value += (mouseY - this.startMouseY) * scale.value
        }
    }

    const handleGraphMouseDown = (event: MouseEvent, frameEl: any) => {
        if (!frameEl) return
        const handler = new DragGraphHandler(event, frameEl)

        const onMouseMove = (e: MouseEvent) => handler.update(e, frameEl)
        const onMouseUp = () => {
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

    // --- Utils ---
    const backgroundStyle = computed(() => ({
        '--scale': scale.value,
        '--pan-x': `${panX.value}px`,
        '--pan-y': `${panY.value}px`,
    }))

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
        backgroundStyle
    }
}
