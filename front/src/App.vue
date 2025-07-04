<template>
    <div>
        <h1>Hello World</h1>
        <div>{{ message }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const message = ref('Waiting for response from backend');

const fetchMessage = async () => {
    const response = await fetch('/api/test/');
    const data = await response.json();
    message.value = data.message;
}

onMounted(() => {
    fetchMessage();
});

</script>

<style scoped>
</style>