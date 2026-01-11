<template>
    <div class="sidebar-palette">
        <h3>System</h3>
        <div class="function-list" style="flex: 0 0 auto; min-height: 50px;">
             <div class="function-item" @click="$emit('add-start-node')">
                <div class="function-name">Start Node 🚩</div>
             </div>
        </div>

        <h3>functions</h3>
        <div class="function-list">
            <div 
                v-for="func in functions" 
                :key="func.function_name" 
                class="function-item" 
                @click="$emit('add-function-node', func)"
                draggable="true"
                @dragstart="$emit('drag-function-node', $event, func)"
            >
                <div class="function-name">{{ func.function_name }}</div>
                <div class="function-type" v-if="func.type">Type: {{ func.type }}</div>
            </div>
            <div v-if="functions.length === 0" class="empty-msg">No functions found</div>
        </div>
    </div>
</template>

<script setup lang="ts">


defineProps<{
    functions: any[]
}>();

defineEmits(['add-function-node', 'drag-function-node', 'add-start-node']);
</script>

<style scoped>
.sidebar-palette {
    width: 250px;
    background: #1e1e1e;
    border-right: 1px solid #333;
    display: flex;
    flex-direction: column;
    height: 100%;
}

h3 {
    margin: 0;
    padding: 16px;
    font-size: 14px;
    text-transform: uppercase;
    color: #888;
    border-bottom: 1px solid #252526;
}

.function-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.function-item {
    padding: 10px;
    background: #252526;
    border: 1px solid #333;
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.function-item:hover {
    background: #2d2d2d;
    border-color: #007acc;
}

.function-name {
    font-weight: 600;
    color: #e0e0e0;
}

.function-type {
    font-size: 11px;
    color: #888;
    margin-top: 4px;
}

.empty-msg {
    padding: 16px;
    color: #666;
    font-style: italic;
    text-align: center;
}
</style>
