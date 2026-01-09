import os
import sys
import importlib
import threading
import time
from collections import deque
from .base import Executor


class VariableStore:
    def __init__(self):
        self.variables = {}

    def get(self, name):
        return self.variables.get(name)

    def set(self, name, value):
        self.variables[name] = value

class DefaultExecutor(Executor):
    def __init__(self):
        self.graph_data = None
        self.execution_order = []
        self.running = False
        self.current_node_id = None
        self.variable_store = VariableStore()
        self.thread = None

    def load_graph(self, graph_data):
        self.graph_data = graph_data
        # Prioritize finding start node
        start_nodes = [n for n in graph_data['nodes'] if n.get('is_start')]
        
        if start_nodes:
            self.execution_order = self._bfs_sort(graph_data, start_nodes)
            print(f"Graph loaded (from start). Execution order: {[n['title'] for n in self.execution_order]}")
        else:
            # Fallback to topological sort of all
            self.execution_order = self._topological_sort(graph_data)
            print(f"Graph loaded (full topo). Execution order: {[n['title'] for n in self.execution_order]}")

    def _bfs_sort(self, graph, start_nodes):
        nodes = {n["id"]: n for n in graph["nodes"]}
        adj = {n["id"]: [] for n in graph["nodes"]}
        for edge in graph["edges"]:
            if edge["source"] in nodes and edge["target"] in nodes:
                adj[edge["source"]].append(edge["target"])
                
        visited = set()
        queue = deque([n["id"] for n in start_nodes])
        sorted_nodes = []
        
        while queue:
            u_id = queue.popleft()
            if u_id in visited:
                continue
            visited.add(u_id)
            sorted_nodes.append(nodes[u_id])
            
            # Append neighbors
            for v_id in adj[u_id]:
                if v_id not in visited:
                    queue.append(v_id)
        
        return sorted_nodes

    def _topological_sort(self, graph):
        # Build dependency graph
        # For simplicity in this version, we assume edges define dependency
        # graph_data = { nodes: [], edges: [] }
        nodes = {n["id"]: n for n in graph["nodes"]}
        in_degree = {n["id"]: 0 for n in graph["nodes"]}
        adj = {n["id"]: [] for n in graph["nodes"]}

        for edge in graph["edges"]:
            source = edge["source"]
            target = edge["target"]
            # Check if nodes exist (serialization might include deleted node edges if not cleaned)
            if source in nodes and target in nodes:
                adj[source].append(target)
                in_degree[target] += 1
        
        queue_nodes = deque([n_id for n_id, d in in_degree.items() if d == 0])
        sorted_nodes = []

        while queue_nodes:
            u_id = queue_nodes.popleft()
            sorted_nodes.append(nodes[u_id])
            
            for v_id in adj[u_id]:
                in_degree[v_id] -= 1
                if in_degree[v_id] == 0:
                    queue_nodes.append(v_id)
        
        if len(sorted_nodes) != len(nodes):
             print("Warning: Graph contains cycles or disconnected components not reachable.")
        
        return sorted_nodes

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self.run)
        self.thread.start()

    def run(self):
        print("Starting execution loop...")
        
        # Add root dir to sys.path to ensure service imports work
        # Assuming we are in w:\p-graph\back\p_graph\executor
        # root is w:\p-graph
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        if root_dir not in sys.path:
            sys.path.insert(0, root_dir)

        while self.running:
            for node in self.execution_order:
                if not self.running:
                    break
                
                self.current_node_id = node["id"]
                # Skip start node logic, just proceed
                if node.get('is_start'):
                    print(f"Executing Start Node ({node['id']})")
                    continue
                    
                print(f"Executing node: {node['title']} ({node['id']})")
                
                # Service execution
                if node.get('type') != 'Generic' and node.get('service_schema'):
                    try:
                        schema = node['service_schema']
                        # service_file property from .aiproto
                        service_file = schema.get('service_file')
                        
                        # Fallback for python_path if explicitly set
                        python_path = schema.get('python_path')
                        
                        module_name = service_file or python_path
                        
                        if module_name:
                            # Try to import. We might need to prefix with 'example_services.services' 
                            # if that's where they are, or rely on scanning.
                            # For the demo, we know they are in example_services.services
                            # But technically the service file just says "pose_detector_service".
                            # We should probably robustly find it.
                            # For now, hardcode the prefix loop.
                            
                            module = None
                            prefixes = ["", "example_services.services.", "services."]
                            
                            for prefix in prefixes:
                                try:
                                    full_name = f"{prefix}{module_name}"
                                    module = importlib.import_module(full_name)
                                    break
                                except ImportError:
                                    continue
                            
                            if module:
                                # Find handler
                                # Assuming app instance is named 'app'
                                if hasattr(module, 'app'):
                                    app_instance = module.app
                                    # Find route for this service path
                                    service_path = "/" + schema.get('path', '')
                                    handler = None
                                    
                                    # Accessing internal router
                                    if hasattr(app_instance, 'router') and hasattr(app_instance.router, 'routes'):
                                        handler = app_instance.router.routes.get(service_path)
                                    
                                    if handler:
                                        # Prepare inputs
                                        # TODO: Construct actual Request object
                                        # For now, just passing a Mock or Dictionary if supported, 
                                        # but the services expect typed objects (DetectPoseRequest).
                                        # Dynamic instantiation of protobuf is tricky without the class.
                                        # Maybe we can find the Request class in the module imports?
                                        
                                        # Hack: Inspect handler annotations
                                        import inspect
                                        sig = inspect.signature(handler)
                                        request_class = None
                                        
                                        for param in sig.parameters.values():
                                            if param.annotation != inspect.Parameter.empty:
                                                request_class = param.annotation
                                                break
                                        
                                        if request_class:
                                            # Construct request
                                            req_kwargs = {}
                                            # Map inputs
                                            inputs_mapping = node.get('inputs', {})
                                            
                                            for field_name, var_name in inputs_mapping.items():
                                                val = self.variable_store.get(var_name)
                                                if val is not None:
                                                    req_kwargs[field_name] = val
                                            
                                            # Simple instantiation
                                            try:
                                                request_obj = request_class(**req_kwargs)
                                                
                                                # Call handler
                                                print(f"Invoking {module_name} handler for {service_path}")
                                                response = handler(request_obj)
                                                
                                                # Handle Outputs
                                                # Map response fields to variables?
                                                # Current node settings doesn't have output mapping fully defined in UI yet
                                                # but let's assume standard conventions or if we had it.
                                                # For now, just print result.
                                                print(f"Result from {node['title']}: {response}")
                                                
                                            except Exception as e:
                                                print(f"Error invoking service {node['title']}: {e}")
                                        else:
                                            print(f"Could not determine request class for {node['title']}")
                                    else:
                                        print(f"No handler found for path {service_path} in {module_name}")
                                else:
                                    print(f"No 'app' object found in module {module_name}")
                            else:
                                print(f"Could not import module {module_name}")
                        else:
                             print(f"No service_file/python_path for {node['title']}")

                    except Exception as e:
                        print(f"Execution error on node {node['id']}: {e}")

                time.sleep(0.5)
                
            # One pass for demo, or loop?
            # If standard graph, usually one pass unless triggered again.
            # We'll break after one pass for now to avoid infinite fast loops.
            break
            
        print("Execution run finished.")
        self.running = False

    def stop(self):
        print("Stopping execution...")
        self.running = False
        if self.thread:
            self.thread.join()

    def get_state(self):
        return {
            "running": self.running,
            "current_node_id": self.current_node_id,
            "variables": self.variable_store.variables
        }
