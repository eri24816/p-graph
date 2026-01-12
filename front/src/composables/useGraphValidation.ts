import { computed, type Ref } from 'vue'
import type { NodeData, EdgeData } from '@/types/PGraph'
import { isValidLiteral, isValidVariableReference } from '@/utils/validation'

export type ValidationIssue = {
    type: 'error' | 'warning' | 'info'
    message: string
}

export type NodeValidation = {
    nodeId: string | number
    issues: ValidationIssue[]
}

export function useGraphValidation(
    nodes: Ref<NodeData[]>,
    edges: Ref<EdgeData[]>
) {
    // Find all nodes connected to start node (directly or indirectly) via control flow
    const connectedNodeIds = computed(() => {
        const startNodes = nodes.value.filter(n => n.type === 'start')
        if (startNodes.length === 0) return new Set<string | number>()

        const connected = new Set<string | number>()
        const queue: (string | number)[] = []

        // Add all start nodes to queue
        startNodes.forEach(node => {
            connected.add(node.id)
            queue.push(node.id)
        })

        // BFS to find all connected nodes via control flow
        while (queue.length > 0) {
            const currentId = queue.shift()!
            const controlEdges = edges.value.filter(
                e => e.sourceNodeId === currentId && e.layer === 'control'
            )

            controlEdges.forEach(edge => {
                if (!connected.has(edge.targetNodeId)) {
                    connected.add(edge.targetNodeId)
                    queue.push(edge.targetNodeId)
                }
            })
        }

        return connected
    })

    // Validate each node
    const nodeValidations = computed((): Map<string | number, ValidationIssue[]> => {
        const validations = new Map<string | number, ValidationIssue[]>()

        nodes.value.forEach(node => {
            // Only validate nodes connected to start
            if (!connectedNodeIds.value.has(node.id)) {
                return
            }

            const issues: ValidationIssue[] = []

            // Check each input variable
            node.inputs.forEach(input => {
                const varName = node.inputVariables[input.name]

                if (!varName || varName.trim() === '') {
                    // Input not mapped
                    issues.push({
                        type: 'error',
                        message: `Input "${input.name}" is not mapped to a variable`
                    })
                    return
                }

                const trimmed = varName.trim()

                // Check if it's a valid literal for this type
                if (isValidLiteral(trimmed, input.dataType)) {
                    // Valid literal, no further validation needed
                    return
                }

                // Check if it's a valid variable reference format
                if (!isValidVariableReference(trimmed)) {
                    issues.push({
                        type: 'error',
                        message: `Invalid value for input "${input.name}": must be a ${input.dataType} literal or a valid variable reference`
                    })
                    return
                }

                // Parse variable name (format: nodeName.outputName)
                const parts = trimmed.split('.')
                const [sourceNodeName, outputName] = parts

                // Find the source node
                const sourceNode = nodes.value.find(n => n.nodeName === sourceNodeName)
                if (!sourceNode) {
                    issues.push({
                        type: 'error',
                        message: `Source node "${sourceNodeName}" not found for input "${input.name}"`
                    })
                    return
                }

                // Check if source node is in connected nodes
                if (!connectedNodeIds.value.has(sourceNode.id)) {
                    issues.push({
                        type: 'error',
                        message: `Source node "${sourceNodeName}" is not connected to start node`
                    })
                    return
                }

                // Find the output in source node
                const sourceOutput = sourceNode.outputs.find(o => o.name === outputName)
                if (!sourceOutput) {
                    issues.push({
                        type: 'error',
                        message: `Output "${outputName}" not found in node "${sourceNodeName}"`
                    })
                    return
                }

                // Check type compatibility
                if (input.dataType !== sourceOutput.dataType) {
                    issues.push({
                        type: 'error',
                        message: `Type mismatch for input "${input.name}": expected ${input.dataType}, got ${sourceOutput.dataType}`
                    })
                }
            })

            if (issues.length > 0) {
                validations.set(node.id, issues)
            }
        })

        return validations
    })

    // Get validation issues for a specific node
    const getNodeIssues = (nodeId: string | number): ValidationIssue[] => {
        return nodeValidations.value.get(nodeId) || []
    }

    // Get issue counts by type for a node
    const getNodeIssueCounts = (nodeId: string | number) => {
        const issues = getNodeIssues(nodeId)
        return {
            errors: issues.filter(i => i.type === 'error').length,
            warnings: issues.filter(i => i.type === 'warning').length,
            info: issues.filter(i => i.type === 'info').length
        }
    }

    return {
        connectedNodeIds,
        nodeValidations,
        getNodeIssues,
        getNodeIssueCounts
    }
}
