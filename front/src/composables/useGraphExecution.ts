import { ref, type Ref } from 'vue'
import type { NodeData, EdgeData } from '@/types/PGraph'
import { post } from '@/util'

interface SerializedNode {
    id: string | number
    title: string
    type: 'function' | 'start'
    inputVariables: Record<string, string>
}

interface SerializedEdge {
    source: string | number
    source_port: string | number
    target: string | number
    target_port: string | number
}

interface GraphExecutionState {
    current_node_id: string | null
    running: boolean
}

/**
 * Graph execution and runtime management
 * Handles deployment, execution, and state polling
 */
export function useGraphExecution(
    nodes: Ref<NodeData[]>,
    edges: Ref<EdgeData[]>
) {
    const activeNodeId = ref<string | null>(null)
    const isRunning = ref(false)
    let pollingInterval: any = null

    // ==================== SERIALIZATION FOR EXECUTION ====================

    const serializeGraph = () => {
        const serializedNodes: SerializedNode[] = nodes.value.map(node => ({
            id: node.id,
            title: node.nodeName,
            type: node.type,
            inputVariables: node.inputVariables,
        }))

        const serializedEdges: SerializedEdge[] = edges.value.map(edge => ({
            source: edge.sourceNodeId,
            source_port: edge.sourcePortId,
            target: edge.targetNodeId,
            target_port: edge.targetPortId
        }))

        return {
            nodes: serializedNodes,
            edges: serializedEdges
        }
    }

    // ==================== DEPLOYMENT ====================

    const runGraph = async () => {
        const graphData = serializeGraph()
        await post('http://localhost:8000/run', graphData)
    }

    const stopGraph = async () => {
        // Future: API endpoint to stop execution
        stopPolling()
        isRunning.value = false
        activeNodeId.value = null
    }

    // ==================== POLLING ====================

    const startPolling = () => {
        if (pollingInterval) clearInterval(pollingInterval)

        pollingInterval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:8000/state')
                if (res.ok) {
                    const state: GraphExecutionState = await res.json()
                    activeNodeId.value = state.current_node_id
                    isRunning.value = state.running

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
        isRunning.value = false
    }

    // ==================== CLEANUP ====================

    const cleanup = () => {
        stopPolling()
    }

    // ==================== RETURN PUBLIC API ====================

    return {
        // State
        activeNodeId,
        isRunning,

        // Operations
        serializeGraph,
        runGraph,
        stopGraph,

        // Cleanup
        cleanup,
    }
}
