import { ref } from 'vue'
import { v4 as uuid } from 'uuid'
import type { NodeData, FunctionConfig } from '@/types/PGraph'

/**
 * Function palette and node creation
 * Manages available functions and creates function nodes
 */
export function useGraphFunctions() {
    const functions = ref<FunctionConfig[]>([])

    // ==================== FETCH FUNCTIONS ====================

    const fetchFunctions = async () => {
        try {
            const res = await fetch('http://localhost:8000/functions')
            if (res.ok) {
                functions.value = await res.json()
            }
        } catch (e) {
            console.error("Failed to fetch functions", e)
        }
    }

    // ==================== NODE NAME GENERATION ====================

    const getNewNodeName = (prefix: string, existingNodes: NodeData[]): string => {
        /*
        Selects prefix, prefix-1, prefix-2, etc. until it finds a unique name.
        */
        let name = prefix
        let i = 1
        while (existingNodes.some(n => n.nodeName === name)) {
            name = `${prefix}-${i}`
            i++
        }
        return name
    }

    // ==================== NODE CREATION ====================

    const createFunctionNode = (functionConfig: FunctionConfig, nodeName: string): NodeData => {
        const nodeId = uuid()
        const newNode: NodeData = {
            id: nodeId,
            nodeName: nodeName,
            x: Math.random() * 100,
            y: Math.random() * 100,
            width: 150,
            inputs: [],
            outputs: [],
            controlInput: { name: 'control', id: uuid(), type: 'input', layer: 'control', dataType: 'None' },
            controlOutput: { name: 'control', id: uuid(), type: 'output', layer: 'control', dataType: 'None' },
            type: 'function',
            functionConfig: functionConfig,
            inputVariables: {}
        }

        Object.entries(functionConfig.inputs).forEach(([key, value]) => {
            newNode.inputs.push({ id: uuid(), type: 'input', layer: 'data', name: key, dataType: value })
        })
        Object.entries(functionConfig.outputs).forEach(([key, value]) => {
            newNode.outputs.push({ id: uuid(), type: 'output', layer: 'data', name: key, dataType: value })
        })

        return newNode
    }

    const createStartNode = (nodeName: string): NodeData => {
        return {
            id: uuid(),
            nodeName: nodeName,
            x: 50,
            y: 50,
            width: 100,
            inputs: [],
            outputs: [],
            controlInput: { name: 'control', id: uuid(), type: 'input', layer: 'control', dataType: 'None' },
            controlOutput: { name: 'control', id: uuid(), type: 'output', layer: 'control', dataType: 'None' },
            type: 'start',
            inputVariables: {},
            icon: 'flag'
        }
    }

    // ==================== RETURN PUBLIC API ====================

    return {
        // State
        functions,

        // Operations
        fetchFunctions,
        getNewNodeName,
        createFunctionNode,
        createStartNode,
    }
}
