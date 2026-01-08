import type { Component } from 'vue';

export type NodeData = {
    id: number
    title: string
    x: number
    y: number
    width: number
    inputs: PortData[]
    outputs: PortData[]
}

export type PortData = {
    id: number,
    type: string,
}