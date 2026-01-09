from typing import Callable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import queue
from pydantic import BaseModel
import uvicorn

class ExecuteRequest(BaseModel):
    code: str

class DeployRequest(BaseModel):
    nodes: list
    edges: list


class API:
    def __init__(
        self, execution_queue: queue.Queue, handle_interrupt: Callable, executor=None
    ):
        self.app = FastAPI()
        self.execution_queue = execution_queue
        self.handle_interrupt = handle_interrupt
        self.executor = executor

        # Configure CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.service_scanner = None  # Will be set by main

        self.app.post("/execute")(self.execute)
        self.app.post("/interrupt")(self.handle_interrupt)
        self.app.get("/services")(self.get_services)

        # Executor Endpoints
        self.app.post("/deploy")(self.deploy)
        self.app.post("/start")(self.start_execution)
        self.app.post("/stop")(self.stop_execution)
        self.app.get("/state")(self.get_state)

    def set_service_scanner(self, scanner):
        self.service_scanner = scanner

    def get_services(self):
        if self.service_scanner:
            return self.service_scanner.scan_services()
        return []

    def execute(self, request: ExecuteRequest):
        self.execution_queue.put(request.code)

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
        uvicorn.run(self.app, host="0.0.0.0", port=8000)

    
