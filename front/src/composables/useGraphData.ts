import { ref } from 'vue'
import type { NodeData, EdgeData } from '@/types/PGraph'

/**
 * Core graph data management
 * Handles nodes and edges state and operations
 */
export function useGraphData() {
    const nodes = ref<NodeData[]>([])
    const edges = ref<EdgeData[]>([])

    // ==================== NODE OPERATIONS ====================

    const addNode = (node: NodeData) => {
        nodes.value.push(node)
    }

    const removeNode = (id: string | number) => {
        nodes.value = nodes.value.filter(n => n.id !== id)
        // Also remove connected edges
        edges.value = edges.value.filter(e =>
            e.sourceNodeId !== id && e.targetNodeId !== id
        )
    }

    const removeNodes = (ids: Set<string | number>) => {
        nodes.value = nodes.value.filter(n => !ids.has(n.id))
        // Also remove connected edges
        edges.value = edges.value.filter(e =>
            !ids.has(e.sourceNodeId) && !ids.has(e.targetNodeId)
        )
    }

    const updateNode = (id: string | number, updates: Partial<NodeData>) => {
        const node = nodes.value.find(n => n.id === id)
        if (node) {
            Object.assign(node, updates)
        }
    }

    const getNode = (id: string | number): NodeData | undefined => {
        return nodes.value.find(n => n.id === id)
    }

    // ==================== EDGE OPERATIONS ====================

    const addEdge = (edge: EdgeData) => {
        edges.value.push(edge)
    }

    const removeEdge = (id: string | number) => {
        edges.value = edges.value.filter(e => e.id !== id)
    }

    const removeEdges = (ids: Set<string | number>) => {
        edges.value = edges.value.filter(e => !ids.has(e.id))
    }

    const updateEdge = (id: string | number, updates: Partial<EdgeData>) => {
        const edge = edges.value.find(e => e.id === id)
        if (edge) {
            Object.assign(edge, updates)
        }
    }

    const getEdge = (id: string | number): EdgeData | undefined => {
        return edges.value.find(e => e.id === id)
    }

    const getEdgesForNode = (nodeId: string | number): EdgeData[] => {
        return edges.value.filter(e =>
            e.sourceNodeId === nodeId || e.targetNodeId === nodeId
        )
    }

    const getConnectedNodes = (nodeId: string | number): NodeData[] => {
        const connectedEdges = getEdgesForNode(nodeId)
        const connectedNodeIds = new Set<string | number>()

        connectedEdges.forEach(edge => {
            if (edge.sourceNodeId === nodeId) {
                connectedNodeIds.add(edge.targetNodeId)
            } else {
                connectedNodeIds.add(edge.sourceNodeId)
            }
        })

        return nodes.value.filter(n => connectedNodeIds.has(n.id))
    }

    // ==================== GRAPH OPERATIONS ====================

    const clearGraph = () => {
        nodes.value = []
        edges.value = []
    }

    const setGraph = (newNodes: NodeData[], newEdges: EdgeData[]) => {
        nodes.value = newNodes
        edges.value = newEdges
    }

    const cloneGraph = () => {
        return {
            nodes: JSON.parse(JSON.stringify(nodes.value)),
            edges: JSON.parse(JSON.stringify(edges.value))
        }
    }

    // ==================== RETURN PUBLIC API ====================

    return {
        // State
        nodes,
        edges,

        // Node operations
        addNode,
        removeNode,
        removeNodes,
        updateNode,
        getNode,

        // Edge operations
        addEdge,
        removeEdge,
        removeEdges,
        updateEdge,
        getEdge,
        getEdgesForNode,
        getConnectedNodes,

        // Graph operations
        clearGraph,
        setGraph,
        cloneGraph,
    }
}
