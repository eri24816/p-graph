<template>
    <div class="main">
        <!-- <div>{{ message }}</div>
        <textarea v-model="codeArea" placeholder="Enter your code here"></textarea>
        <button @click="executeCode">Execute Code</button>
        <button @click="interruptExecution">Interrupt Execution</button> -->
        <PGraph  class="graph"/>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PGraph from './components/PGraph.vue';

const message = ref('Waiting for response from backend');
const codeArea = ref('');


const executeCode = async () => {
    const response = await fetch('/api/execute', {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ code: codeArea.value }),
    });
    const data = await response.json();
    message.value = data.message;
}

const interruptExecution = async () => {
    const response = await fetch('/api/interrupt', {
        method: 'POST',
    });
}

onMounted(() => {
});

</script>

<style scoped>
.main {
    width: 100%;
    height: 100%;
}

.graph {
    width: 100%;
    height: 100%;
}
</style>