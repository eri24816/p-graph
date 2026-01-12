import { ref, computed, type Ref } from 'vue'
import type { NodeData, EdgeData } from '@/types/PGraph'
import { v4 as uuid } from 'uuid'

export interface GraphEditorOptions {
    nodes: Ref<NodeData[]>
    edges: Ref<EdgeData[]>
    onSelectionChange?: (nodeIds: Set<string | number>, edgeIds: Set<string | number>) => void
    getNewNodeName?: (prefix: string, existingNodes: NodeData[]) => string
    getNodeBounds?: (nodeId: string | number) => DOMRect | null
    isModalOpen?: Ref<boolean>
}

export interface Rectangle {
    x: number
    y: number
    width: number
    height: number
}

export { type Rectangle as RectangleType }

export function useGraphEditor(options: GraphEditorOptions) {
    const { nodes, edges, onSelectionChange, getNewNodeName, getNodeBounds, isModalOpen } = options

    // ==================== SELECTION STATE ====================
    const selectedNodeIds = ref<Set<string | number>>(new Set())
    const selectedEdgeIds = ref<Set<string | number>>(new Set())
    const isRectSelecting = ref(false)
    const rectSelectStart = ref({ x: 0, y: 0 })
    const rectSelectEnd = ref({ x: 0, y: 0 })

    const selectionRect = computed<Rectangle>(() => {
        const x1 = Math.min(rectSelectStart.value.x, rectSelectEnd.value.x)
        const y1 = Math.min(rectSelectStart.value.y, rectSelectEnd.value.y)
        const x2 = Math.max(rectSelectStart.value.x, rectSelectEnd.value.x)
        const y2 = Math.max(rectSelectStart.value.y, rectSelectEnd.value.y)
        return {
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1
        }
    })

    const hasSelection = computed(() =>
        selectedNodeIds.value.size > 0 || selectedEdgeIds.value.size > 0
    )

    const selectedNodes = computed(() =>
        nodes.value.filter(n => selectedNodeIds.value.has(n.id))
    )

    const selectedEdges = computed(() =>
        edges.value.filter(e => selectedEdgeIds.value.has(e.id))
    )

    // ==================== SELECTION OPERATIONS ====================

    const clearSelection = () => {
        selectedNodeIds.value.clear()
        selectedEdgeIds.value.clear()
        notifySelectionChange()
    }

    const selectNode = (id: string | number, multi: boolean = false) => {
        if (!multi) {
            selectedNodeIds.value.clear()
            selectedEdgeIds.value.clear()
        }
        selectedNodeIds.value.add(id)
        notifySelectionChange()
    }

    const deselectNode = (id: string | number) => {
        selectedNodeIds.value.delete(id)
        notifySelectionChange()
    }

    const toggleNodeSelection = (id: string | number) => {
        if (selectedNodeIds.value.has(id)) {
            selectedNodeIds.value.delete(id)
        } else {
            selectedNodeIds.value.add(id)
        }
        notifySelectionChange()
    }

    const selectEdge = (id: string | number, multi: boolean = false) => {
        if (!multi) {
            selectedNodeIds.value.clear()
            selectedEdgeIds.value.clear()
        }
        selectedEdgeIds.value.add(id)
        notifySelectionChange()
    }

    const deselectEdge = (id: string | number) => {
        selectedEdgeIds.value.delete(id)
        notifySelectionChange()
    }

    const toggleEdgeSelection = (id: string | number) => {
        if (selectedEdgeIds.value.has(id)) {
            selectedEdgeIds.value.delete(id)
        } else {
            selectedEdgeIds.value.add(id)
        }
        notifySelectionChange()
    }

    const selectAll = () => {
        nodes.value.forEach(n => selectedNodeIds.value.add(n.id))
        edges.value.forEach(e => selectedEdgeIds.value.add(e.id))
        notifySelectionChange()
    }

    const selectNodes = (ids: (string | number)[], multi: boolean = false) => {
        if (!multi) {
            selectedNodeIds.value.clear()
            selectedEdgeIds.value.clear()
        }
        ids.forEach(id => selectedNodeIds.value.add(id))
        notifySelectionChange()
    }

    const selectEdges = (ids: (string | number)[], multi: boolean = false) => {
        if (!multi) {
            selectedNodeIds.value.clear()
            selectedEdgeIds.value.clear()
        }
        ids.forEach(id => selectedEdgeIds.value.add(id))
        notifySelectionChange()
    }

    const notifySelectionChange = () => {
        onSelectionChange?.(selectedNodeIds.value, selectedEdgeIds.value)
    }

    // ==================== RECTANGLE SELECTION ====================

    const startRectSelection = (x: number, y: number) => {
        isRectSelecting.value = true
        rectSelectStart.value = { x, y }
        rectSelectEnd.value = { x, y }
    }

    const updateRectSelection = (x: number, y: number) => {
        if (!isRectSelecting.value) return
        rectSelectEnd.value = { x, y }
    }

    const finishRectSelection = (multi: boolean = false, frameEl?: any) => {
        if (!isRectSelecting.value) return

        const rect = selectionRect.value
        const nodesInRect = nodes.value.filter(node =>
            isNodeInRect(node, rect, frameEl)
        )
        const edgesInRect = edges.value.filter(edge =>
            isEdgeInRect(edge, rect)
        )

        if (!multi) {
            selectedNodeIds.value.clear()
            selectedEdgeIds.value.clear()
        }

        nodesInRect.forEach(node => selectedNodeIds.value.add(node.id))
        edgesInRect.forEach(edge => selectedEdgeIds.value.add(edge.id))

        isRectSelecting.value = false
        notifySelectionChange()
    }

    const cancelRectSelection = () => {
        isRectSelecting.value = false
    }

    const isEdgeInRect = (edge: EdgeData, rect: Rectangle): boolean => {
        const rectRight = rect.x + rect.width
        const rectBottom = rect.y + rect.height

        // Check if both edge endpoints are completely inside the rectangle
        return edge.x1 >= rect.x &&
               edge.x1 <= rectRight &&
               edge.y1 >= rect.y &&
               edge.y1 <= rectBottom &&
               edge.x2 >= rect.x &&
               edge.x2 <= rectRight &&
               edge.y2 >= rect.y &&
               edge.y2 <= rectBottom
    }

    const isNodeInRect = (node: NodeData, rect: Rectangle, frameEl?: any): boolean => {
        // Use DOM bounding rect if available
        if (getNodeBounds && frameEl) {
            const nodeBounds = getNodeBounds(node.id)
            if (nodeBounds) {
                // Convert screen rect to local coordinates
                const topLeft = frameEl.screenToLocal({ x: nodeBounds.left, y: nodeBounds.top })
                const bottomRight = frameEl.screenToLocal({ x: nodeBounds.right, y: nodeBounds.bottom })

                const nodeRect = {
                    x: topLeft.x,
                    y: topLeft.y,
                    right: bottomRight.x,
                    bottom: bottomRight.y
                }

                const rectRight = rect.x + rect.width
                const rectBottom = rect.y + rect.height

                // Check if node is completely inside the rectangle
                return nodeRect.x >= rect.x &&
                       nodeRect.right <= rectRight &&
                       nodeRect.y >= rect.y &&
                       nodeRect.bottom <= rectBottom
            }
        }

        // Fallback to node data coordinates
        const nodeRight = node.x + node.width
        const nodeBottom = node.y + 60 // Approximate node height
        const rectRight = rect.x + rect.width
        const rectBottom = rect.y + rect.height

        // Check if node is completely inside the rectangle
        return node.x >= rect.x &&
               nodeRight <= rectRight &&
               node.y >= rect.y &&
               nodeBottom <= rectBottom
    }

    // ==================== CLIPBOARD OPERATIONS ====================

    const clipboard = ref<{
        nodes: NodeData[]
        edges: EdgeData[]
    }>({ nodes: [], edges: [] })

    const copySelection = () => {
        const nodesToCopy = nodes.value.filter(n => selectedNodeIds.value.has(n.id))
        const edgesToCopy = edges.value.filter(e => {
            // Include edges if either explicitly selected OR if both nodes are selected
            if (selectedEdgeIds.value.has(e.id)) return true
            return selectedNodeIds.value.has(e.sourceNodeId) &&
                   selectedNodeIds.value.has(e.targetNodeId)
        })

        clipboard.value = {
            nodes: JSON.parse(JSON.stringify(nodesToCopy)),
            edges: JSON.parse(JSON.stringify(edgesToCopy))
        }
    }

    const cutSelection = () => {
        copySelection()
        deleteSelection()
    }

    const pasteSelection = (offsetX: number = 20, offsetY: number = 20) => {
        if (clipboard.value.nodes.length === 0) return

        clearSelection()

        // Create mapping from old IDs to new IDs
        const idMap = new Map<string | number, string | number>()

        // Paste nodes
        clipboard.value.nodes.forEach(node => {
            const newNode = JSON.parse(JSON.stringify(node))
            const newId = uuid()
            idMap.set(node.id, newId)

            newNode.id = newId
            newNode.x += offsetX
            newNode.y += offsetY

            // Generate unique node name to prevent conflicts
            if (getNewNodeName) {
                newNode.nodeName = getNewNodeName(newNode.nodeName, nodes.value)
            }

            // Regenerate port IDs
            if (newNode.inputs) newNode.inputs.forEach((p: any) => p.id = uuid())
            if (newNode.outputs) newNode.outputs.forEach((p: any) => p.id = uuid())
            if (newNode.controlInput) newNode.controlInput.id = uuid()
            if (newNode.controlOutput) newNode.controlOutput.id = uuid()

            nodes.value.push(newNode)
            selectedNodeIds.value.add(newId)
        })

        // Paste edges (only those between pasted nodes)
        clipboard.value.edges.forEach(edge => {
            const newSourceId = idMap.get(edge.sourceNodeId)
            const newTargetId = idMap.get(edge.targetNodeId)

            if (newSourceId && newTargetId) {
                const sourceNode = nodes.value.find(n => n.id === newSourceId)
                const targetNode = nodes.value.find(n => n.id === newTargetId)

                if (sourceNode && targetNode) {
                    // Find corresponding ports by index
                    const sourcePortIndex = getPortIndex(
                        clipboard.value.nodes.find(n => n.id === edge.sourceNodeId)!,
                        edge.sourcePortId
                    )
                    const targetPortIndex = getPortIndex(
                        clipboard.value.nodes.find(n => n.id === edge.targetNodeId)!,
                        edge.targetPortId
                    )

                    const newSourcePort = getPortByIndex(sourceNode, sourcePortIndex)
                    const newTargetPort = getPortByIndex(targetNode, targetPortIndex)

                    if (newSourcePort && newTargetPort) {
                        const newEdge: EdgeData = {
                            id: uuid(),
                            sourceNodeId: newSourceId,
                            sourcePortId: newSourcePort.id,
                            targetNodeId: newTargetId,
                            targetPortId: newTargetPort.id,
                            layer: edge.layer,
                            x1: 0, y1: 0, x2: 0, y2: 0
                        }
                        edges.value.push(newEdge)
                        selectedEdgeIds.value.add(newEdge.id)
                    }
                }
            }
        })

        notifySelectionChange()
    }

    const getPortIndex = (node: NodeData, portId: string | number): number => {
        const allPorts = [
            node.controlInput,
            ...node.inputs,
            node.controlOutput,
            ...node.outputs
        ]
        return allPorts.findIndex(p => p.id === portId)
    }

    const getPortByIndex = (node: NodeData, index: number) => {
        const allPorts = [
            node.controlInput,
            ...node.inputs,
            node.controlOutput,
            ...node.outputs
        ]
        return allPorts[index]
    }

    // ==================== DELETE OPERATIONS ====================

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
        }

        // Remove explicitly selected edges
        if (edgesToDelete.size > 0) {
            edges.value = edges.value.filter(e => !edgesToDelete.has(e.id))
        }

        clearSelection()
    }

    const deleteNode = (id: string | number) => {
        nodes.value = nodes.value.filter(n => n.id !== id)
        edges.value = edges.value.filter(e =>
            e.sourceNodeId !== id && e.targetNodeId !== id
        )
        selectedNodeIds.value.delete(id)
        notifySelectionChange()
    }

    const deleteEdge = (id: string | number) => {
        edges.value = edges.value.filter(e => e.id !== id)
        selectedEdgeIds.value.delete(id)
        notifySelectionChange()
    }

    // ==================== MOVE OPERATIONS ====================

    class MultiNodeDragHandler {
        private nodeDeltas: Map<string | number, { startX: number, startY: number }>
        private startMouseX: number
        private startMouseY: number
        private hasMoved: boolean = false

        constructor(event: MouseEvent, frameEl: any, nodeIds: Set<string | number>) {
            this.nodeDeltas = new Map()
            const mousePos = frameEl.getMousePosition(event)
            this.startMouseX = mousePos.x
            this.startMouseY = mousePos.y

            // Store initial positions of all selected nodes
            nodeIds.forEach(id => {
                const node = nodes.value.find(n => n.id === id)
                if (node) {
                    this.nodeDeltas.set(id, { startX: node.x, startY: node.y })
                }
            })
        }

        update = (event: MouseEvent, frameEl: any) => {
            const mousePos = frameEl.getMousePosition(event)
            const dx = mousePos.x - this.startMouseX
            const dy = mousePos.y - this.startMouseY

            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                this.hasMoved = true
            }

            // Update all selected nodes
            this.nodeDeltas.forEach((startPos, nodeId) => {
                const node = nodes.value.find(n => n.id === nodeId)
                if (node) {
                    node.x = startPos.startX + dx
                    node.y = startPos.startY + dy
                }
            })
        }

        get moved() {
            return this.hasMoved
        }
    }

    const createMultiNodeDragHandler = (event: MouseEvent, frameEl: any) => {
        return new MultiNodeDragHandler(event, frameEl, selectedNodeIds.value)
    }

    // ==================== NODE INTERACTION ====================

    const handleNodeClick = (node: NodeData, event: MouseEvent) => {
        if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd: toggle selection
            toggleNodeSelection(node.id)
        } else if (event.shiftKey) {
            // Shift: add to selection
            selectNode(node.id, true)
        } else {
            // Regular click: select only this node (if not already selected)
            if (!selectedNodeIds.value.has(node.id)) {
                selectNode(node.id, false)
            }
        }
    }

    const handleNodeMouseDown = (node: NodeData, event: MouseEvent, frameEl: any) => {
        // Ignore if modal is open
        if (isModalOpen?.value) return

        event.preventDefault() // Prevent text selection during drag

        // Handle selection
        handleNodeClick(node, event)

        // If this node is not in selection, just select it
        if (!selectedNodeIds.value.has(node.id)) {
            selectNode(node.id, !event.shiftKey && !event.ctrlKey && !event.metaKey)
        }

        // Start dragging all selected nodes
        const dragHandler = createMultiNodeDragHandler(event, frameEl)

        const onMouseMove = (e: MouseEvent) => dragHandler.update(e, frameEl)
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    // ==================== EDGE INTERACTION ====================

    const handleEdgeClick = (edge: EdgeData, event: MouseEvent) => {
        // Ignore if modal is open
        if (isModalOpen?.value) return

        event.stopPropagation()

        if (event.ctrlKey || event.metaKey) {
            toggleEdgeSelection(edge.id)
        } else if (event.shiftKey) {
            selectEdge(edge.id, true)
        } else {
            selectEdge(edge.id, false)
        }
    }

    // ==================== BACKGROUND INTERACTION ====================

    const handleBackgroundMouseDown = (event: MouseEvent, frameEl: any) => {
        // Ignore if modal is open
        if (isModalOpen?.value) return

        const mousePos = frameEl.getMousePosition(event)

        if (event.button === 0) {
            startRectSelection(mousePos.x, mousePos.y)

            const onMouseMove = (e: MouseEvent) => {
                const pos = frameEl.getMousePosition(e)
                updateRectSelection(pos.x, pos.y)
            }

            const onMouseUp = (e: MouseEvent) => {
                finishRectSelection(e.ctrlKey || e.metaKey, frameEl)
                window.removeEventListener('mousemove', onMouseMove)
                window.removeEventListener('mouseup', onMouseUp)
            }

            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
        } else if (!event.ctrlKey && !event.metaKey) {
            clearSelection()
        }
    }

    // ==================== KEYBOARD SHORTCUTS ====================

    const handleKeyDown = (event: KeyboardEvent) => {
        // Ignore if modal is open
        if (isModalOpen?.value) return

        // Ignore if typing in input
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement) {
            return
        }

        // Delete/Backspace: delete selection
        if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault()
            deleteSelection()
        }

        // Ctrl/Cmd+A: select all
        if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
            event.preventDefault()
            selectAll()
        }

        // Ctrl/Cmd+C: copy
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            event.preventDefault()
            copySelection()
        }

        // Ctrl/Cmd+X: cut
        if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
            event.preventDefault()
            cutSelection()
        }

        // Ctrl/Cmd+V: paste
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            event.preventDefault()
            pasteSelection()
        }

        // Escape: clear selection
        if (event.key === 'Escape') {
            event.preventDefault()
            if (isRectSelecting.value) {
                cancelRectSelection()
            } else {
                clearSelection()
            }
        }
    }

    const registerKeyboardShortcuts = () => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }

    // ==================== RETURN PUBLIC API ====================

    return {
        // Selection state
        selectedNodeIds,
        selectedEdgeIds,
        hasSelection,
        selectedNodes,
        selectedEdges,

        // Rectangle selection
        isRectSelecting,
        selectionRect,

        // Selection operations
        clearSelection,
        selectNode,
        deselectNode,
        toggleNodeSelection,
        selectEdge,
        deselectEdge,
        toggleEdgeSelection,
        selectAll,
        selectNodes,
        selectEdges,

        // Rectangle selection
        startRectSelection,
        updateRectSelection,
        finishRectSelection,
        cancelRectSelection,

        // Clipboard
        copySelection,
        cutSelection,
        pasteSelection,

        // Delete
        deleteSelection,
        deleteNode,
        deleteEdge,

        // Interaction handlers
        handleNodeMouseDown,
        handleEdgeClick,
        handleBackgroundMouseDown,
        handleKeyDown,
        registerKeyboardShortcuts,
    }
}
