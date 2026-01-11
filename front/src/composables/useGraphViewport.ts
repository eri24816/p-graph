import { ref, computed } from 'vue'
import type { NodeData } from '@/types/PGraph'

/**
 * Viewport/Camera management for the graph canvas
 * Handles zoom, pan, and view transformations
 */
export function useGraphViewport() {
    const scale = ref(1)
    const panX = ref(0)
    const panY = ref(0)

    const backgroundStyle = computed(() => ({
        '--scale': scale.value,
        '--pan-x': `${panX.value}px`,
        '--pan-y': `${panY.value}px`
    }))

    // ==================== ZOOM ====================

    const handleWheel = (event: WheelEvent, frameEl: any) => {
        if (!frameEl) return
        const originalMX = frameEl.getMousePosition(event).x
        const originalMY = frameEl.getMousePosition(event).y
        const originalScale = scale.value
        scale.value *= Math.exp(event.deltaY / -1000)
        panX.value = -(originalMX * scale.value - (originalMX * originalScale + panX.value))
        panY.value = -(originalMY * scale.value - (originalMY * originalScale + panY.value))
    }

    // ==================== PAN ====================

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

    const handlePan = (event: MouseEvent, frameEl: any, onPanEnd?: (dragged: boolean) => void) => {
        if (!frameEl) return

        const handler = new DragGraphHandler(event, frameEl)

        const onMouseMove = (e: MouseEvent) => handler.update(e, frameEl)
        const onMouseUp = () => {
            onPanEnd?.(handler.dragged)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    // ==================== UTILITIES ====================

    const resetView = () => {
        scale.value = 1
        panX.value = 0
        panY.value = 0
    }

    const fitToContent = (nodes: NodeData[]) => {
        if (nodes.length === 0) {
            resetView()
            return
        }

        // Calculate bounding box
        let minX = Infinity, minY = Infinity
        let maxX = -Infinity, maxY = -Infinity

        nodes.forEach(node => {
            minX = Math.min(minX, node.x)
            minY = Math.min(minY, node.y)
            maxX = Math.max(maxX, node.x + node.width)
            maxY = Math.max(maxY, node.y + 100) // Approximate node height
        })

        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        // Set scale to fit content with some padding
        const contentWidth = maxX - minX
        const contentHeight = maxY - minY
        const padding = 100

        // Assuming viewport is ~800x600 (can be parameterized later)
        const viewportWidth = 800
        const viewportHeight = 600

        const scaleX = (viewportWidth - padding * 2) / contentWidth
        const scaleY = (viewportHeight - padding * 2) / contentHeight
        scale.value = Math.min(scaleX, scaleY, 1) // Don't zoom in more than 1x

        // Center the content
        panX.value = -centerX * scale.value + viewportWidth / 2
        panY.value = -centerY * scale.value + viewportHeight / 2
    }

    const zoomIn = (factor: number = 1.2) => {
        scale.value *= factor
    }

    const zoomOut = (factor: number = 1.2) => {
        scale.value /= factor
    }

    const setZoom = (newScale: number) => {
        scale.value = Math.max(0.1, Math.min(5, newScale))
    }

    // ==================== RETURN PUBLIC API ====================

    return {
        // State
        scale,
        panX,
        panY,
        backgroundStyle,

        // Zoom
        handleWheel,
        zoomIn,
        zoomOut,
        setZoom,

        // Pan
        handlePan,

        // Utilities
        resetView,
        fitToContent,
    }
}
