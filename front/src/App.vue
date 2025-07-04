<template>
    <div>
        <h1>Hello World</h1>
        <div>{{ message }}</div>
        <textarea v-model="codeArea" placeholder="Enter your code here"></textarea>
        <button @click="executeCode">Execute Code</button>
        <button @click="interruptExecution">Interrupt Execution</button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const message = ref('Waiting for response from backend');
const codeArea = ref('');

const fetchMessage = async () => {
    const response = await fetch('/api/test/');
    const data = await response.json();
    message.value = data.message;
}

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
    fetchMessage();
});

</script>

<style scoped>
</style>