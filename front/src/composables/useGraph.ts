import type { FunctionConfig } from '@/types/PGraph'
import { useGraphData } from './useGraphData'
import { useGraphEditor } from './useGraphEditor'
import { useGraphViewport } from './useGraphViewport'
import { useGraphPersistence } from './useGraphPersistence'
import { useGraphExecution } from './useGraphExecution'
import { useGraphFunctions } from './useGraphFunctions'
import { useGraphLayers } from './useGraphLayers'

/**
 * Main graph composable - orchestrates all graph modules
 *
 * This is now a thin orchestration layer that composes focused modules:
 * - useGraphData: Core node/edge data
 * - useGraphViewport: Camera/zoom/pan
 * - useGraphLayers: Control/data layer switching
 * - useGraphEditor: Selection, copy/paste, delete, multi-select
 * - useGraphFunctions: Function palette
 * - useGraphExecution: Deployment and runtime
 * - useGraphPersistence: Save/load
 */
export function useGraph(getNodeBounds?: (nodeId: string | number) => DOMRect | null, isModalOpen?: import('vue').Ref<boolean>) {
    // ==================== INITIALIZE MODULES ====================

    // Core data
    const graphData = useGraphData()
    const { nodes, edges } = graphData

    // Viewport/camera
    const viewport = useGraphViewport()
    const { scale, panX, panY } = viewport

    // View layers
    const layers = useGraphLayers()

    // Function palette
    const functionsModule = useGraphFunctions()

    // Editor (selection, copy/paste, etc.)
    const editor = useGraphEditor({
        nodes,
        edges,
        getNewNodeName: functionsModule.getNewNodeName,
        getNodeBounds,
        isModalOpen
    })

    // Execution
    const execution = useGraphExecution(nodes, edges)

    // Persistence
    const persistence = useGraphPersistence(nodes, edges, scale, panX, panY)

    // ==================== AUTO-SAVE ====================

    // Enable auto-save to localStorage
    persistence.enableAutoSave()

    // ==================== CONVENIENCE METHODS ====================

    const addFunctionNode = (functionConfig: FunctionConfig) => {
        const nodeName = functionsModule.getNewNodeName(
            functionConfig.function_name,
            nodes.value
        )
        const node = functionsModule.createFunctionNode(functionConfig, nodeName)
        graphData.addNode(node)
    }

    const addStartNode = () => {
        const nodeName = functionsModule.getNewNodeName("Start", nodes.value)
        const node = functionsModule.createStartNode(nodeName)
        graphData.addNode(node)
    }

    // Background mouse down - combines panning with editor selection
    const handleGraphMouseDown = (event: MouseEvent, frameEl: any) => {
        if (!frameEl) return

        viewport.handlePan(event, frameEl, (dragged) => {
            if (!dragged) {
                editor.clearSelection()
            }
        })
    }

    // ==================== UNIFIED API ====================

    return {
        // Core data (useGraphData)
        nodes,
        edges,
        addNode: graphData.addNode,
        removeNode: graphData.removeNode,
        removeNodes: graphData.removeNodes,
        updateNode: graphData.updateNode,
        getNode: graphData.getNode,
        addEdge: graphData.addEdge,
        removeEdge: graphData.removeEdge,
        removeEdges: graphData.removeEdges,
        updateEdge: graphData.updateEdge,
        getEdge: graphData.getEdge,
        getEdgesForNode: graphData.getEdgesForNode,
        getConnectedNodes: graphData.getConnectedNodes,
        clearGraph: graphData.clearGraph,
        setGraph: graphData.setGraph,
        cloneGraph: graphData.cloneGraph,

        // Viewport (useGraphViewport)
        scale,
        panX,
        panY,
        backgroundStyle: viewport.backgroundStyle,
        handleWheel: viewport.handleWheel,
        handlePan: viewport.handlePan,
        handleGraphMouseDown, // Combines pan + editor
        zoomIn: viewport.zoomIn,
        zoomOut: viewport.zoomOut,
        setZoom: viewport.setZoom,
        resetView: viewport.resetView,
        fitToContent: viewport.fitToContent,

        // Layers (useGraphLayers)
        viewLayer: layers.viewLayer,
        toggleLayer: layers.toggleLayer,
        setLayer: layers.setLayer,
        isControlLayer: layers.isControlLayer,
        isDataLayer: layers.isDataLayer,

        // Editor (useGraphEditor) - expose full module + backward compat
        editor,
        selectedNodeIds: editor.selectedNodeIds,
        selectedEdgeIds: editor.selectedEdgeIds,
        hasSelection: editor.hasSelection,
        selectedNodes: editor.selectedNodes,
        selectedEdges: editor.selectedEdges,
        isRectSelecting: editor.isRectSelecting,
        selectionRect: editor.selectionRect,
        clearSelection: editor.clearSelection,
        selectNode: editor.selectNode,
        deselectNode: editor.deselectNode,
        toggleNodeSelection: editor.toggleNodeSelection,
        selectEdge: editor.selectEdge,
        deselectEdge: editor.deselectEdge,
        toggleEdgeSelection: editor.toggleEdgeSelection,
        selectAll: editor.selectAll,
        selectNodes: editor.selectNodes,
        selectEdges: editor.selectEdges,
        copySelection: editor.copySelection,
        cutSelection: editor.cutSelection,
        pasteSelection: editor.pasteSelection,
        deleteSelection: editor.deleteSelection,
        deleteNode: editor.deleteNode,
        deleteEdge: editor.deleteEdge,
        handleNodeMouseDown: editor.handleNodeMouseDown,
        handleEdgeClick: editor.handleEdgeClick,
        handleBackgroundMouseDown: editor.handleBackgroundMouseDown,
        handleKeyDown: editor.handleKeyDown,
        registerKeyboardShortcuts: editor.registerKeyboardShortcuts,

        // Functions (useGraphFunctions)
        functions: functionsModule.functions,
        fetchFunctions: functionsModule.fetchFunctions,
        getNewNodeName: functionsModule.getNewNodeName,
        createFunctionNode: functionsModule.createFunctionNode,
        createStartNode: functionsModule.createStartNode,
        addFunctionNode,
        addStartNode,

        // Execution (useGraphExecution)
        activeNodeId: execution.activeNodeId,
        isRunning: execution.isRunning,
        serializeGraph: execution.serializeGraph,
        runGraph: execution.runGraph,
        stopGraph: execution.stopGraph,

        // Persistence (useGraphPersistence)
        serializeGraphState: persistence.serializeGraphState,
        loadGraphState: persistence.loadGraphState,
        saveToLocalStorage: persistence.saveToLocalStorage,
        loadFromLocalStorage: persistence.loadFromLocalStorage,
        clearLocalStorage: persistence.clearLocalStorage,
        listGraphs: persistence.listGraphs,
        saveGraphToDisk: persistence.saveGraphToDisk,
        loadGraphFromDisk: persistence.loadGraphFromDisk,
    }
}
