import { ref } from 'vue'

export type ViewLayer = 'control' | 'data'

/**
 * Graph view layer management
 * Handles switching between control flow and data flow views
 */
export function useGraphLayers() {
    const viewLayer = ref<ViewLayer>('control')

    const toggleLayer = () => {
        viewLayer.value = viewLayer.value === 'control' ? 'data' : 'control'
    }

    const setLayer = (layer: ViewLayer) => {
        viewLayer.value = layer
    }

    const isControlLayer = () => viewLayer.value === 'control'
    const isDataLayer = () => viewLayer.value === 'data'

    return {
        viewLayer,
        toggleLayer,
        setLayer,
        isControlLayer,
        isDataLayer,
    }
}
