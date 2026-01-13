import type { Component } from 'vue';

export type NodeData = {
    id: number | string
    nodeName: string
    x: number
    y: number
    width: number
    inputs: PortData[]
    outputs: PortData[]
    controlInput: PortData
    controlOutput: PortData
    type: 'function' | 'start'
    functionConfig?: any
    inputVariables: Record<string, string>
    icon?: string
}

export type PortData = {
    name: string,
    id: number | string,
    type: string,
    layer: string,
    dataType: string
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

export type FunctionConfig = {
    function_name: string
    default_node_name: string
    inputs: Record<string, string>
    outputs: Record<string, string>
}