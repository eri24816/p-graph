# P-Graph Frontend Architecture

This document describes the modular, decoupled architecture of the p-graph frontend.

## Philosophy

The codebase follows these principles:

1. **Single Responsibility**: Each module has one clear purpose
2. **Separation of Concerns**: Different aspects of functionality are isolated
3. **Composability**: Modules can be combined in different ways
4. **Testability**: Each module can be tested independently
5. **Explicit Dependencies**: Dependencies are passed as parameters

## Module Structure

The graph functionality is split into focused composables, orchestrated by a main `useGraph()` composable.

```
composables/
├── useGraph.ts              # Main orchestrator (thin layer)
├── useGraphData.ts          # Core node/edge data management
├── useGraphEditor.ts        # Selection, copy/paste, delete
├── useGraphViewport.ts      # Camera, zoom, pan
├── useGraphLayers.ts        # Control/data layer switching
├── useGraphFunctions.ts     # Function palette
├── useGraphExecution.ts     # Deployment and runtime
└── useGraphPersistence.ts   # Save/load (localStorage, disk)
```

## Module Details

### useGraphData.ts - Core Data Management

**Responsibility**: Manage nodes and edges state

**State**:
- `nodes: Ref<NodeData[]>`
- `edges: Ref<EdgeData[]>`

**Operations**:
- Node CRUD: `addNode`, `removeNode`, `updateNode`, `getNode`
- Edge CRUD: `addEdge`, `removeEdge`, `updateEdge`, `getEdge`
- Graph operations: `clearGraph`, `setGraph`, `cloneGraph`
- Queries: `getEdgesForNode`, `getConnectedNodes`

**Dependencies**: None

**Use cases**:
```typescript
const data = useGraphData()
data.addNode(newNode)
data.removeNode(nodeId)
const node = data.getNode(nodeId)
```

---

### useGraphViewport.ts - Camera/View Management

**Responsibility**: Handle viewport transformations (zoom, pan)

**State**:
- `scale: Ref<number>`
- `panX: Ref<number>`
- `panY: Ref<number>`
- `backgroundStyle: ComputedRef<object>`

**Operations**:
- Zoom: `handleWheel`, `zoomIn`, `zoomOut`, `setZoom`
- Pan: `handlePan` (with drag handler)
- Utilities: `resetView`, `fitToContent`

**Dependencies**: None (operates independently)

**Use cases**:
```typescript
const viewport = useGraphViewport()

// Zoom
viewport.handleWheel(event, frameEl)
viewport.zoomIn()

// Pan
viewport.handlePan(event, frameEl, (dragged) => {
    if (!dragged) console.log('Click without drag')
})

// Fit content
viewport.fitToContent(nodes.value)
```

---

### useGraphLayers.ts - View Layer Management

**Responsibility**: Switch between control flow and data flow views

**State**:
- `viewLayer: Ref<'control' | 'data'>`

**Operations**:
- `toggleLayer()`
- `setLayer(layer)`
- `isControlLayer()`, `isDataLayer()`

**Dependencies**: None

**Use cases**:
```typescript
const layers = useGraphLayers()
layers.toggleLayer() // Switch between control/data
if (layers.isControlLayer()) { /* ... */ }
```

---

### useGraphEditor.ts - Interactive Editor

**Responsibility**: Selection, copy/paste, delete, multi-select

See [GRAPH_EDITOR.md](GRAPH_EDITOR.md) for full documentation.

**State**:
- `selectedNodeIds`, `selectedEdgeIds`
- `isRectSelecting`, `selectionRect`

**Operations**:
- Selection: `selectNode`, `selectEdge`, `selectAll`, `clearSelection`
- Clipboard: `copySelection`, `cutSelection`, `pasteSelection`
- Delete: `deleteSelection`, `deleteNode`, `deleteEdge`
- Interaction: `handleNodeMouseDown`, `handleEdgeClick`, `handleBackgroundMouseDown`

**Dependencies**:
- `nodes: Ref<NodeData[]>` (passed in options)
- `edges: Ref<EdgeData[]>` (passed in options)

**Use cases**:
```typescript
const editor = useGraphEditor({ nodes, edges })
editor.selectNode(nodeId)
editor.copySelection()
editor.pasteSelection()
```

---

### useGraphFunctions.ts - Function Palette

**Responsibility**: Manage available functions and create function nodes

**State**:
- `functions: Ref<FunctionConfig[]>`

**Operations**:
- `fetchFunctions()` - Load from API
- `getNewNodeName(prefix, existingNodes)` - Generate unique name
- `createFunctionNode(config, name)` - Create function node
- `createStartNode(name)` - Create start node

**Dependencies**: None (fetches from API)

**Use cases**:
```typescript
const funcs = useGraphFunctions()
await funcs.fetchFunctions()
const node = funcs.createFunctionNode(config, 'MyNode')
```

---

### useGraphExecution.ts - Runtime Execution

**Responsibility**: Deploy and execute graphs, track execution state

**State**:
- `activeNodeId: Ref<string | null>` - Currently executing node
- `isRunning: Ref<boolean>`

**Operations**:
- `runGraph()` - Deploy to backend
- `startGraph()` - Start execution
- `stopGraph()` - Stop execution
- `serializeGraph()` - Convert to backend format

**Dependencies**:
- `nodes: Ref<NodeData[]>`
- `edges: Ref<EdgeData[]>`

**Internal**: Polls backend for execution state

**Use cases**:
```typescript
const exec = useGraphExecution(nodes, edges)
await exec.runGraph()
await exec.startGraph()
// exec.activeNodeId updates via polling
```

---

### useGraphPersistence.ts - Save/Load

**Responsibility**: Serialize and persist graph state

**Operations**:
- **Serialization**: `serializeGraphState`, `loadGraphState`
- **Local Storage**: `saveToLocalStorage`, `loadFromLocalStorage`, `clearLocalStorage`
- **Disk I/O**: `saveGraphToDisk`, `loadGraphFromDisk`, `listGraphs`
- **Auto-save**: `enableAutoSave()` - Returns watcher unsubscribe function

**Dependencies**:
- `nodes: Ref<NodeData[]>`
- `edges: Ref<EdgeData[]>`
- `scale: Ref<number>`
- `panX?: Ref<number>` (optional)
- `panY?: Ref<number>` (optional)

**Use cases**:
```typescript
const persist = useGraphPersistence(nodes, edges, scale, panX, panY)

// Auto-save
persist.enableAutoSave()

// Manual save
await persist.saveGraphToDisk('my-graph')
await persist.loadGraphFromDisk('my-graph')

// Local storage
persist.loadFromLocalStorage()
```

---

### useGraph.ts - Main Orchestrator

**Responsibility**: Compose all modules and provide unified API

**Pattern**: Orchestrator / Facade

**Implementation**:
1. Instantiates all sub-modules
2. Passes dependencies between modules
3. Exposes unified API
4. Adds convenience methods

**Use case**:
```typescript
// Component usage
const graph = useGraph()

// All module APIs available
graph.addNode(node)           // From useGraphData
graph.zoomIn()                // From useGraphViewport
graph.selectNode(id)          // From useGraphEditor
graph.runGraph()           // From useGraphExecution
graph.saveGraphToDisk(name)   // From useGraphPersistence
```

## Dependency Graph

```
useGraph (orchestrator)
├── useGraphData ────────────┐
├── useGraphViewport         │
├── useGraphLayers           │
├── useGraphEditor ──────────┤ (depends on nodes, edges)
├── useGraphFunctions        │
├── useGraphExecution ───────┤
└── useGraphPersistence ─────┘ (depends on nodes, edges, scale, pan)
```

## Data Flow

### 1. Graph Modification Flow
```
User Action (PGraph.vue)
    ↓
useGraph API call
    ↓
Specific Module (e.g., useGraphData)
    ↓
Update reactive state (nodes/edges)
    ↓
Vue reactivity propagates changes
    ↓
UI updates
    ↓
useGraphPersistence auto-save (watcher)
```

### 2. Editor Flow
```
User Selection (click/drag)
    ↓
useGraphEditor handlers
    ↓
Update selection state
    ↓
Emit selection change callback
    ↓
UI highlights selected items
```

### 3. Execution Flow
```
User clicks "Run"
    ↓
useGraphExecution.runGraph()
    ↓
Serialize graph (nodes → backend format)
    ↓
POST to backend
    ↓
useGraphExecution.startGraph()
    ↓
Start polling loop
    ↓
Update activeNodeId ref
    ↓
UI highlights active node
```

## Benefits of This Architecture

### 1. Testability
Each module can be tested in isolation:

```typescript
describe('useGraphData', () => {
    it('should add node', () => {
        const data = useGraphData()
        data.addNode(mockNode)
        expect(data.nodes.value).toHaveLength(1)
    })
})

describe('useGraphViewport', () => {
    it('should zoom in', () => {
        const viewport = useGraphViewport()
        const oldScale = viewport.scale.value
        viewport.zoomIn()
        expect(viewport.scale.value).toBeGreaterThan(oldScale)
    })
})
```

### 2. Reusability
Modules can be used independently:

```typescript
// Use only viewport in a different context
const { scale, panX, panY, handleWheel } = useGraphViewport()

// Use only data without other features
const { nodes, edges, addNode } = useGraphData()
```

### 3. Maintainability
Changes are localized:

- Zoom bug? → Check `useGraphViewport.ts`
- Save/load issue? → Check `useGraphPersistence.ts`
- Selection not working? → Check `useGraphEditor.ts`

### 4. Type Safety
Each module has focused TypeScript types:

```typescript
// useGraphData.ts
export function useGraphData() {
    const nodes = ref<NodeData[]>([])
    const edges = ref<EdgeData[]>([])
    // ... typed operations
}

// useGraphViewport.ts
export function useGraphViewport() {
    const scale = ref<number>(1)
    // ... typed operations
}
```

### 5. Tree-Shaking
Unused modules can be eliminated by bundler:

```typescript
// If a component only needs data and viewport
import { useGraphData } from './useGraphData'
import { useGraphViewport } from './useGraphViewport'
// Other modules not imported = not bundled
```

### 6. Clear Contracts
Explicit dependencies make relationships clear:

```typescript
// useGraphEditor clearly depends on nodes and edges
export function useGraphEditor(options: {
    nodes: Ref<NodeData[]>
    edges: Ref<EdgeData[]>
})

// useGraphPersistence clearly depends on graph state
export function useGraphPersistence(
    nodes: Ref<NodeData[]>,
    edges: Ref<EdgeData[]>,
    scale: Ref<number>,
    panX?: Ref<number>,
    panY?: Ref<number>
)
```

## Migration from Old Code

The refactoring maintains **100% backward compatibility** through the orchestrator pattern.

**Before**:
```typescript
const {
    nodes,
    edges,
    scale,
    selectedNodeIds,
    addNode,
    zoomIn,
    selectNode,
    saveGraphToDisk
} = useGraph()
```

**After** (same API):
```typescript
const {
    nodes,        // From useGraphData
    edges,        // From useGraphData
    scale,        // From useGraphViewport
    selectedNodeIds,  // From useGraphEditor
    addNode,      // From useGraphData
    zoomIn,       // From useGraphViewport
    selectNode,   // From useGraphEditor
    saveGraphToDisk  // From useGraphPersistence
} = useGraph()
```

No component code needs to change!

## Component Integration

### PGraph.vue
Uses the unified `useGraph()` API:

```vue
<script setup>
import { useGraph } from '@/composables/useGraph'

const graph = useGraph()
const {
    nodes, edges,
    scale, panX, panY,
    editor,
    fetchFunctions,
    runGraph,
    // ... other APIs
} = graph

// Initialize
fetchFunctions()
onMounted(() => {
    graph.loadFromLocalStorage()
})
</script>
```

### Direct Module Usage (Alternative)
Components can also use modules directly:

```vue
<script setup>
import { useGraphData } from '@/composables/useGraphData'
import { useGraphViewport } from '@/composables/useGraphViewport'

const data = useGraphData()
const viewport = useGraphViewport()
</script>
```

## Future Enhancements

### Potential New Modules

1. **useGraphHistory.ts** - Undo/redo with command pattern
2. **useGraphAlignment.ts** - Align nodes to grid/each other
3. **useGraphValidation.ts** - Validate graph structure
4. **useGraphSearch.ts** - Search/filter nodes
5. **useGraphMinimap.ts** - Minimap/overview
6. **useEdgeDrawing.ts** - Edge connection UI (currently in PGraph.vue)

### Domain-Driven Organization

Could reorganize by domain:

```
composables/
├── graph/
│   ├── index.ts (main useGraph)
│   ├── data.ts
│   ├── viewport.ts
│   └── layers.ts
├── editor/
│   ├── selection.ts
│   ├── clipboard.ts
│   └── edge-drawing.ts
├── execution/
│   ├── runtime.ts
│   └── polling.ts
└── persistence/
    ├── serialization.ts
    └── storage.ts
```

## Best Practices

### 1. Module Creation
When creating a new module:
- Single responsibility
- Explicit dependencies (parameters)
- Clear return interface
- No side effects in setup
- Document public API

### 2. Module Usage
When using modules:
- Import only what you need
- Pass dependencies explicitly
- Don't access internal state
- Use TypeScript types

### 3. Testing
For each module:
- Unit tests for all operations
- Mock dependencies
- Test edge cases
- Test reactivity

Example:
```typescript
describe('useGraphData', () => {
    it('should remove node and connected edges', () => {
        const data = useGraphData()
        data.addNode(node1)
        data.addNode(node2)
        data.addEdge(edge) // Connects node1 to node2

        data.removeNode(node1.id)

        expect(data.nodes.value).toHaveLength(1)
        expect(data.edges.value).toHaveLength(0) // Edge removed too
    })
})
```

## Summary

The modular architecture provides:

✅ **Clear separation of concerns**
✅ **Easy testing and maintenance**
✅ **Reusable, composable modules**
✅ **Type safety throughout**
✅ **Backward compatibility**
✅ **Explicit dependencies**
✅ **Better developer experience**

Each module does one thing well, and the orchestrator composes them into a powerful, cohesive system.
