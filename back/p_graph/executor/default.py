import asyncio
import os
import sys
import importlib
import threading
import time
from collections import deque
from .base import Executor

# {"nodes":[{"id":"e31eee3a-3fee-4121-a708-3aa232401bed","title":"sdfas","type":"function","inputVariables":{"frame_id":"\"545235\""}},{"id":"e9d5d0a7-2c83-4fef-9ec4-6388bb148deb","title":"detect-pose2","type":"function","inputVariables":{"frame_id":"\"d\""}},{"id":"c8c46017-8e6f-4950-aec0-b5cca884692e","title":"detect-pose","type":"function","inputVariables":{"frame_id":"\"0\""}},{"id":"d75254d7-7161-4836-ba3f-b829574dea96","title":"detect-pose-1fadfasdfasdfad","type":"function","inputVariables":{"frame_id":"\"0\""}},{"id":"c83c6ce7-d228-4378-8598-4bbea9cb7da5","title":"Start","type":"start","inputVariables":{}}],"edges":[{"source":"d75254d7-7161-4836-ba3f-b829574dea96","source_port":"385a5a37-5cef-4dc6-996f-10bf5fa39a2f","target":"c8c46017-8e6f-4950-aec0-b5cca884692e","target_port":"ff6a08a7-51f6-4a06-9f09-db07a990229b"},{"source":"d75254d7-7161-4836-ba3f-b829574dea96","source_port":"385a5a37-5cef-4dc6-996f-10bf5fa39a2f","target":"e9d5d0a7-2c83-4fef-9ec4-6388bb148deb","target_port":"5e684293-f2a6-4407-b4cd-ddffa7877660"},{"source":"c83c6ce7-d228-4378-8598-4bbea9cb7da5","source_port":"26ff899e-2745-4c28-925b-000e27534547","target":"d75254d7-7161-4836-ba3f-b829574dea96","target_port":"54eacacb-a878-4f45-9517-b05229af4bec"},{"source":"c83c6ce7-d228-4378-8598-4bbea9cb7da5","source_port":"26ff899e-2745-4c28-925b-000e27534547","target":"e31eee3a-3fee-4121-a708-3aa232401bed","target_port":"b08252a2-0bd6-4f76-a255-6f7a2fbd8c1b"}]}

class Graph():
    def __init__(self, graph_data):
        self.nodes = {node['id']: node for node in graph_data["nodes"]}
        self.edges = graph_data["edges"]

    def get_start_nodes(self):
        return [node for node in self.nodes.values() if node['type'] == "start"]
    
    def get_control_flow_dest(self, node_id):
        dest_nodes = []
        for edge in self.edges:
            if edge['source'] == node_id:
                target_node = self.nodes[edge['target']]
                dest_nodes.append(target_node)
        return dest_nodes

class DefaultExecutor(Executor):
    def __init__(self):
        self.running = False
        self.current_node_id = None
        self.globals = {}
        self.locals = {}
        self.graph = Graph({"nodes": [], "edges": []})

    def run(self):
        # start event loop
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def start(self, graph_data):
        print("Starting execution...")
        self.graph = Graph(graph_data)
        self.running = True

        for start_node in self.graph.get_start_nodes():
            asyncio.run_coroutine_threadsafe(self.setup_start_node(start_node),self.loop)

    async def setup_start_node(self, start_node):
        tasks = []
        for dest_node in self.graph.get_control_flow_dest(start_node['id']):
            tasks.append(self.execute_node(dest_node))  
        await asyncio.gather(*tasks)
        print("Execution finished for start node:", start_node['id'])

    async def execute_node(self, node):
        if not self.running:
            return

        self.current_node_id = node['id']

        await self.node_task(node)

        # After execution, trigger next nodes
        tasks = []
        for dest_node in self.graph.get_control_flow_dest(node['id']):
            tasks.append(self.execute_node(dest_node))
        await asyncio.gather(*tasks)

    async def node_task(self, node):
        print(f"Node {node['title']} is running its task...")
        await asyncio.sleep(1)  # Simulate some async work

    def stop(self):
        print("Stopping execution...")
        self.running = False

    def get_state(self):
        return {
            "running": self.running,
            "current_node_id": self.current_node_id,
            "variables": {}
        }
