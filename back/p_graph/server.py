from pathlib import Path
from p_graph.data_structures import FunctionConfig
from p_graph.executor.base import Executor
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import uvicorn

import logging
logger = logging.getLogger(__name__)


class ExecuteRequest(BaseModel):
    code: str


class DeployRequest(BaseModel):
    nodes: list
    edges: list


class Server:
    def __init__(self, executor: Executor, functions: list[FunctionConfig]):
        self.app = FastAPI()
        self.executor = executor

        # Configure CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.functions = functions

        self.app.post("/execute")(self.execute)
        self.app.get("/functions")(self.get_functions)

        # Executor Endpoints
        self.app.post("/deploy")(self.deploy)
        self.app.post("/start")(self.start_execution)
        self.app.post("/stop")(self.stop_execution)
        self.app.get("/state")(self.get_state)

        # Graph Persistence Endpoints
        self.app.get("/graphs")(self.list_graphs)
        self.app.post("/graphs/save")(self.save_graph)
        self.app.get("/graphs/load/{name}")(self.load_graph)

        self.uvicorn_server = uvicorn.Server(uvicorn.Config(self.app, host="0.0.0.0", port=8000))

    def get_functions(self):
        return self.functions

    def execute(self, request: ExecuteRequest):
        self.executor.execute_python(request.code)
        return {"status": "queued"}

    def deploy(self, request: DeployRequest):
        if self.executor:
            graph_data = request.model_dump()
            self.executor.load_graph(graph_data)
            return {"status": "deployed"}
        return {"status": "no_executor"}

    def start_execution(self):
        if self.executor:
            self.executor.start()
            return {"status": "started"}
        return {"status": "no_executor"}

    def stop_execution(self):
        if self.executor:
            self.executor.stop()
            return {"status": "stopped"}
        return {"status": "no_executor"}

    def get_state(self):
        if self.executor:
            return self.executor.get_state()
        return {"status": "no_executor"}

    def run(self):
        self.uvicorn_server.run()

    def stop(self):
        self.uvicorn_server.should_exit = True

    # --- Graph Persistence ---

    def ensure_graphs_dir(self):
        graphs_dir = Path('saved_graphs')
        graphs_dir.mkdir(exist_ok=True)
        return graphs_dir

    def list_graphs(self):
        graphs_dir = self.ensure_graphs_dir()
        files = [f.name for f in graphs_dir.iterdir() if f.is_file() and f.suffix == ".json"]
        return files

    def save_graph(self, request: dict):
        # Expects { "name": "filename", "graph": { ... } }
        name = request.get("name")
        graph_data = request.get("graph")
        if not name or not graph_data:
            return {"error": "Missing name or graph data"}

        graphs_dir = self.ensure_graphs_dir()
        file_path = graphs_dir / f"{name}.json"

        with open(file_path, "w") as f:
            json.dump(graph_data, f, indent=2)

        return {"status": "saved", "file": f"{name}.json"}

    def load_graph(self, name: str):
        graphs_dir = self.ensure_graphs_dir()
        file_path = graphs_dir / f"{name}"

        logger.info(f"Loading graph from {file_path}")

        if not file_path.exists():
            logger.warning(f"Graph file {file_path} not found.")
            return {"error": "File not found"}

        with open(file_path, "r") as f:
            data = json.load(f)

        return data
