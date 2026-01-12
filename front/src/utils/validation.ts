// Shared validation utilities for graph nodes and inputs

/**
 * Validate if a value is a valid literal for the given type
 */
export function isValidLiteral(value: string, type: string): boolean {
    if (!value) return false

    const trimmed = value.trim()

    switch (type) {
        case 'string':
            // String literals with single or double quotes
            return (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
                   (trimmed.startsWith('"') && trimmed.endsWith('"'))

        case 'bool':
            // Boolean literals
            return trimmed === 'true' || trimmed === 'false'

        case 'int':
        case 'int32':
        case 'int64':
            // Integer literals (positive or negative)
            return /^-?\d+$/.test(trimmed)

        case 'uint32':
        case 'uint64':
            // Unsigned integer literals (positive only)
            return /^\d+$/.test(trimmed)

        case 'float':
        case 'double':
            // Float/double literals (with optional decimal point and sign)
            return /^-?\d+(\.\d+)?$/.test(trimmed)

        default:
            return false
    }
}

/**
 * Check if a value is a valid variable reference
 */
export function isValidVariableReference(value: string): boolean {
    if (!value) return false
    // Variable references should be in the format: nodeName.outputName
    return /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)?$/.test(value.trim())
}
