<template>
    <div class="main" @mousemove="onMouseMove" @wheel="onWheel">

        <PGraph class="graph"/>
        <NotificationPopup />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PGraph from './components/graph/PGraph.vue';
import NotificationPopup from './components/NotificationPopup.vue';

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

.transform-frame {
    width: 100%;
    height: 100%;
}


.transform-content {
    width: 20px;
    height: 20px;
    background-color: #9d9d9d;
}
</style>