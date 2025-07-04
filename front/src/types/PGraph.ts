import type { Component } from 'vue';

export type Control = {
    id: number
    component: Component
    height: number
    props: Record<string, any>
}

export type NodeData = {
    id: number
    title: string
    x: number
    y: number
    width: number
    controls: Control[]
}
