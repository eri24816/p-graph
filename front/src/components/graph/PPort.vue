<template>
  <div class="p-port">
    <div class="port-knob"></div>
  </div>
</template>

<script setup lang="ts">
import type { PortData } from '@/types/PGraph';

const props = defineProps<{
  portData: PortData
}>();
</script>

<style scoped>
.p-port {
  display: flex;
  align-items: center;
  justify-content: center;
}

.port-knob {
  width: 12px;
  height: 8px;
  background-color: #e0e0e0;
  border: 1px solid #4b4b4b;
  cursor: pointer;
}

.port-knob:hover {
  background-color: #f5f5f5;
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
}
</style>
