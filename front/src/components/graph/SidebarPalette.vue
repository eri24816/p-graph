<template>
    <div class="sidebar-palette">
        <h3>System</h3>
        <div class="service-list" style="flex: 0 0 auto; min-height: 50px;">
             <div class="service-item" @click="$emit('add-start-node')">
                <div class="service-name">Start Node 🚩</div>
             </div>
        </div>

        <h3>Services</h3>
        <div class="service-list">
            <div 
                v-for="service in services" 
                :key="service.name" 
                class="service-item" 
                @click="$emit('add-service', service)"
                draggable="true"
                @dragstart="$emit('drag-service', $event, service)"
            >
                <div class="service-name">{{ service.name }}</div>
                <div class="service-type" v-if="service.type">Type: {{ service.type }}</div>
            </div>
            <div v-if="services.length === 0" class="empty-msg">No services found</div>
        </div>
    </div>
</template>

<script setup lang="ts">


defineProps<{
    services: any[]
}>();

defineEmits(['add-service', 'drag-service', 'add-start-node']);
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

.service-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.service-item {
    padding: 10px;
    background: #252526;
    border: 1px solid #333;
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.service-item:hover {
    background: #2d2d2d;
    border-color: #007acc;
}

.service-name {
    font-weight: 600;
    color: #e0e0e0;
}

.service-type {
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
