import { watch, type Ref } from 'vue'
import type { NodeData, EdgeData } from '@/types/PGraph'
import { get, post } from '@/util'

interface GraphState {
    nodes: NodeData[]
    edges: EdgeData[]
    transform: {
        scale: number
        panX?: number
        panY?: number
    }
}

/**
 * Graph persistence and serialization
 * Handles saving/loading to localStorage and disk
 */
export function useGraphPersistence(
    nodes: Ref<NodeData[]>,
    edges: Ref<EdgeData[]>,
    scale: Ref<number>,
    panX?: Ref<number>,
    panY?: Ref<number>
) {
    const LOCAL_STORAGE_KEY = 'p-graph-autosave'

    // ==================== SERIALIZATION ====================

    const serializeGraphState = (): GraphState => {
        return {
            nodes: JSON.parse(JSON.stringify(nodes.value)),
            edges: JSON.parse(JSON.stringify(edges.value)),
            transform: {
                scale: scale.value,
                panX: panX?.value,
                panY: panY?.value
            }
        }
    }

    const loadGraphState = (data: GraphState | null) => {
        if (!data) return

        nodes.value = data.nodes || []
        edges.value = data.edges || []

        if (data.transform) {
            scale.value = data.transform.scale
            if (panX && data.transform.panX !== undefined) {
                panX.value = data.transform.panX
            }
            if (panY && data.transform.panY !== undefined) {
                panY.value = data.transform.panY
            }
        }
    }

    // ==================== LOCAL STORAGE ====================

    const saveToLocalStorage = () => {
        const data = serializeGraphState()
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    }

    const loadFromLocalStorage = () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (saved) {
            try {
                const data = JSON.parse(saved)
                loadGraphState(data)
                console.log("Restored graph from local storage")
            } catch (e) {
                console.error("Failed to restore from local storage", e)
            }
        }
    }

    const clearLocalStorage = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
    }

    // ==================== DISK I/O ====================

    const listGraphs = async (): Promise<string[]> => {
        return await get('http://localhost:8000/graphs')
    }

    const saveGraphToDisk = async (filename: string) => {
        const data = serializeGraphState()
        await post('http://localhost:8000/graphs/save', { name: filename, graph: data })
    }

    const loadGraphFromDisk = async (filename: string) => {
        const data = await get(`http://localhost:8000/graphs/load/${filename}`)
        loadGraphState(data)
    }

    // ==================== AUTO-SAVE ====================

    const enableAutoSave = () => {
        const watchTargets = [nodes, edges, scale]
        if (panX) watchTargets.push(panX)
        if (panY) watchTargets.push(panY)

        return watch(watchTargets, () => {
            saveToLocalStorage()
        }, { deep: true })
    }

    // ==================== RETURN PUBLIC API ====================

    return {
        // Serialization
        serializeGraphState,
        loadGraphState,

        // Local storage
        saveToLocalStorage,
        loadFromLocalStorage,
        clearLocalStorage,

        // Disk I/O
        listGraphs,
        saveGraphToDisk,
        loadGraphFromDisk,

        // Auto-save
        enableAutoSave,
    }
}
