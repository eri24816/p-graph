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
    executing_node_ids?: string[]
}

/**
 * Graph execution and runtime management
 * Handles deployment, execution, and state streaming
 */
export function useGraphExecution(
    nodes: Ref<NodeData[]>,
    edges: Ref<EdgeData[]>
) {
    const activeNodeId = ref<string | null>(null)
    const isRunning = ref(false)
    let eventSource: EventSource | null = null

    // ==================== SERIALIZATION FOR EXECUTION ====================

    const serializeGraph = () => {
        const serializedNodes: SerializedNode[] = nodes.value.map(node => ({
            id: node.id,
            title: node.nodeName,
            type: node.type,
            inputVariables: node.inputVariables,
            function_name: node.functionConfig ? node.functionConfig.function_name : undefined
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
        startStreaming()
    }

    const stopGraph = async () => {
        await post('http://localhost:8000/stop', {})
        stopStreaming()
        isRunning.value = false
        activeNodeId.value = null
    }

    // ==================== STATE STREAMING ====================

    const startStreaming = () => {
        if (eventSource) {
            eventSource.close()
        }

        eventSource = new EventSource('http://localhost:8000/state/stream')

        eventSource.onmessage = (event) => {
            try {
                const state: GraphExecutionState = JSON.parse(event.data)
                activeNodeId.value = state.current_node_id
                isRunning.value = state.running

                if (!state.running) {
                    stopStreaming()
                }
            } catch (e) {
                console.error("Error parsing state stream", e)
            }
        }

        eventSource.onerror = (error) => {
            console.error("State stream error", error)
            stopStreaming()
        }
    }

    const stopStreaming = () => {
        if (eventSource) {
            eventSource.close()
            eventSource = null
        }
    }

    // ==================== CLEANUP ====================

    const cleanup = () => {
        stopStreaming()
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
