# Graph Editor Module

A comprehensive, modular graph editor system for p-graph providing full editing capabilities for nodes and edges.

## Architecture

The graph editor is implemented as a **separate, modular composable** (`useGraphEditor`) that is cleanly separated from other graph logic. This ensures:

- **Separation of concerns**: Editor logic is isolated from graph data management, rendering, and business logic
- **Reusability**: The editor module can be used with any graph implementation
- **Maintainability**: Editor features can be modified without affecting other parts of the codebase
- **Testability**: The module can be tested independently

## Files

### Core Module
- **[useGraphEditor.ts](src/composables/useGraphEditor.ts)**: Main composable providing all editor functionality
- **[RectSelection.vue](src/components/graph/RectSelection.vue)**: Visual component for rectangle selection

### Integration
- **[useGraph.ts](src/composables/useGraph.ts)**: Integrates editor module and exposes API
- **[PGraph.vue](src/components/graph/PGraph.vue)**: Uses editor for all interactions
- **[PEdge.vue](src/components/graph/PEdge.vue)**: Updated to support edge selection and clicking

## Features

### 1. Selection

#### Single Selection
- **Click node/edge**: Select a single item (clears previous selection)
- **Ctrl/Cmd + Click**: Toggle selection (add/remove from selection)
- **Shift + Click**: Add to selection (multi-select)

#### Rectangle Selection
- **Shift + Drag on background**: Draw a rectangle to select multiple nodes
- **Ctrl/Cmd + Shift + Drag**: Add nodes in rectangle to existing selection
- Visual feedback with blue selection rectangle

#### Select All
- **Ctrl/Cmd + A**: Select all nodes and edges

### 2. Moving

#### Single Node Dragging
- **Click and drag node**: Move the node
- Works seamlessly with selection (see below)

#### Multi-Node Dragging
- **Drag any selected node**: All selected nodes move together
- Maintains relative positions between nodes
- Smooth, synchronized movement

### 3. Deletion

#### Delete Selection
- **Delete** or **Backspace** key: Delete all selected nodes and edges
- **Smart edge cleanup**: Automatically removes edges connected to deleted nodes
- Clears selection after deletion

#### Individual Deletion
- Select item(s) and press Delete/Backspace

### 4. Copy/Paste

#### Copy
- **Ctrl/Cmd + C**: Copy selected nodes and edges to clipboard
- Includes edges between copied nodes
- Deep clones all node data

#### Cut
- **Ctrl/Cmd + X**: Cut selected nodes (copy + delete)

#### Paste
- **Ctrl/Cmd + V**: Paste copied nodes
- **Auto-offset**: Pasted nodes appear offset (+20px, +20px) from originals
- **Regenerates IDs**: All nodes, edges, and ports get new unique IDs
- **Preserves connections**: Edges between pasted nodes are recreated
- **Auto-select**: Pasted items are automatically selected

### 5. Edge Interaction

#### Selection
- **Click edge**: Select the edge
- **Hover**: Visual feedback (thicker, brighter)
- **Selected state**: Blue highlight with increased thickness
- **Wide hit area**: Invisible 16px-wide clickable area for easier selection

#### Visual States
- Normal: Standard appearance
- Hover: Thicker stroke, full opacity
- Selected: Blue color (#4a9eff), thicker stroke
- Control edges: Special blue color, thicker by default

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click | Select single item |
| Ctrl/Cmd + Click | Toggle selection |
| Shift + Click | Add to selection |
| Shift + Drag | Rectangle selection |
| Ctrl/Cmd + A | Select all |
| Delete / Backspace | Delete selection |
| Ctrl/Cmd + C | Copy |
| Ctrl/Cmd + X | Cut |
| Ctrl/Cmd + V | Paste |
| Escape | Clear selection / Cancel rectangle selection |
| Tab | Switch between control/data view layers *(existing)* |

## API Reference

### useGraphEditor(options)

Creates an editor instance for a graph.

**Parameters:**
```typescript
interface GraphEditorOptions {
    nodes: Ref<NodeData[]>        // Reference to nodes array
    edges: Ref<EdgeData[]>        // Reference to edges array
    onSelectionChange?: (          // Optional callback
        nodeIds: Set<string | number>,
        edgeIds: Set<string | number>
    ) => void
}
```

**Returns:**
```typescript
{
    // Selection state
    selectedNodeIds: Ref<Set<string | number>>
    selectedEdgeIds: Ref<Set<string | number>>
    hasSelection: ComputedRef<boolean>
    selectedNodes: ComputedRef<NodeData[]>
    selectedEdges: ComputedRef<EdgeData[]>

    // Rectangle selection
    isRectSelecting: Ref<boolean>
    selectionRect: ComputedRef<Rectangle>

    // Selection operations
    clearSelection: () => void
    selectNode: (id, multi?) => void
    deselectNode: (id) => void
    toggleNodeSelection: (id) => void
    selectEdge: (id, multi?) => void
    deselectEdge: (id) => void
    toggleEdgeSelection: (id) => void
    selectAll: () => void
    selectNodes: (ids[], multi?) => void
    selectEdges: (ids[], multi?) => void

    // Rectangle selection
    startRectSelection: (x, y) => void
    updateRectSelection: (x, y) => void
    finishRectSelection: (multi?) => void
    cancelRectSelection: () => void

    // Clipboard
    copySelection: () => void
    cutSelection: () => void
    pasteSelection: (offsetX?, offsetY?) => void

    // Delete
    deleteSelection: () => void
    deleteNode: (id) => void
    deleteEdge: (id) => void

    // Interaction handlers
    handleNodeMouseDown: (node, event, frameEl) => void
    handleEdgeClick: (edge, event) => void
    handleBackgroundMouseDown: (event, frameEl) => void
    handleKeyDown: (event) => void
    registerKeyboardShortcuts: () => UnregisterFn
}
```

## Usage Example

```vue
<script setup lang="ts">
import { useGraphEditor } from '@/composables/useGraphEditor'
import { ref } from 'vue'

const nodes = ref([...])
const edges = ref([...])

const editor = useGraphEditor({
    nodes,
    edges,
    onSelectionChange: (nodeIds, edgeIds) => {
        console.log('Selection changed:', nodeIds, edgeIds)
    }
})

// Use editor methods
editor.selectNode('node-1')
editor.copySelection()
editor.pasteSelection(50, 50)
</script>

<template>
    <div @mousedown="editor.handleBackgroundMouseDown($event, frameRef)">
        <!-- Nodes -->
        <Node
            v-for="node in nodes"
            :is-selected="editor.selectedNodeIds.value.has(node.id)"
            @mousedown="editor.handleNodeMouseDown(node, $event, frameRef)"
        />

        <!-- Edges -->
        <Edge
            v-for="edge in edges"
            :is-selected="editor.selectedEdgeIds.value.has(edge.id)"
            @click="editor.handleEdgeClick(edge, $event)"
        />

        <!-- Rectangle selection visual -->
        <RectSelection
            :rect="editor.selectionRect.value"
            :visible="editor.isRectSelecting.value"
        />
    </div>
</template>
```

## Implementation Details

### Multi-Node Dragging

The `MultiNodeDragHandler` class manages synchronized dragging of multiple nodes:

1. Stores initial positions of all selected nodes
2. Calculates delta from mouse movement
3. Applies same delta to all selected nodes
4. Maintains relative positions perfectly

### Copy/Paste with Edges

Pasting is intelligent about edges:

1. Creates ID mapping from old IDs to new IDs
2. Only recreates edges where both source and target nodes were pasted
3. Finds corresponding ports by index (not ID) to handle regenerated port IDs
4. Maintains all edge properties (layer, etc.)

### Rectangle Selection

Rectangle selection uses intersection detection:

1. Calculates bounding box of selection rectangle
2. Tests each node's bounding box for intersection
3. Selects nodes that overlap with the rectangle
4. Supports additive selection with Ctrl/Cmd modifier

### Edge Clicking

Edges are hard to click on, so we implement:

1. **Hit area**: Invisible 16px-wide path for easier clicking
2. **Visual feedback**: Hover and selected states
3. **Event handling**: Click events that don't interfere with dragging

## Future Enhancements

Potential additions to the editor module:

- **Undo/Redo**: Command pattern for history
- **Alignment tools**: Align nodes to grid or each other
- **Distribution**: Evenly space selected nodes
- **Grouping**: Create node groups that move together
- **Snapping**: Snap to grid or other nodes
- **Lasso selection**: Freeform selection path
- **Duplicate**: Quick duplicate with Ctrl+D
- **Nudge**: Move selection with arrow keys

## Testing

The modular design allows for comprehensive testing:

```typescript
import { useGraphEditor } from '@/composables/useGraphEditor'
import { ref } from 'vue'

describe('useGraphEditor', () => {
    it('should select nodes', () => {
        const nodes = ref([{ id: '1', ... }, { id: '2', ... }])
        const edges = ref([])
        const editor = useGraphEditor({ nodes, edges })

        editor.selectNode('1')
        expect(editor.selectedNodeIds.value.has('1')).toBe(true)
    })

    it('should copy and paste nodes', () => {
        // Test implementation...
    })
})
```

## Migration from Old Code

The editor module replaces scattered selection/interaction code:

**Before:**
- Selection state in `useGraph.ts`
- Some handlers in `useGraph.ts`
- Some handlers in `PGraph.vue`
- Clipboard logic mixed with graph logic

**After:**
- All editor logic in `useGraphEditor.ts`
- Clean integration via `useGraph.ts`
- PGraph.vue just wires up events

## Performance Considerations

The module is optimized for performance:

1. **Reactive refs**: Uses Vue's reactivity system efficiently
2. **Computed values**: Caches derived state (selectedNodes, selectedEdges)
3. **Event delegation**: Single keyboard listener
4. **Minimal re-renders**: Only updates what's necessary
5. **Deep cloning**: Only when copying (not on every operation)

## Browser Compatibility

All features work in modern browsers:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Keyboard shortcuts respect OS conventions (Cmd on Mac, Ctrl on Windows/Linux)
