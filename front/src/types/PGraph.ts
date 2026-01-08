import type { Component } from 'vue';

export type NodeData = {
    id: number | string
    title: string
    x: number
    y: number
    width: number
    inputs: PortData[]
    outputs: PortData[]
    controlInput: PortData
    controlOutput: PortData
    isService?: boolean
    serviceSchema?: any
    settings?: {
        inputMappings: Record<string, string>
        outputMappings: Record<string, string>
    }
}

export type PortData = {
    id: number | string,
    type: string,
    layer: string,
}

export type EdgeData = {
    id: number | string,
    sourceNodeId: number | string,
    sourcePortId: number | string,
    targetNodeId: number | string,
    targetPortId: number | string,
    layer: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
}