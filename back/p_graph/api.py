from typing import Callable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import queue
from pydantic import BaseModel
import uvicorn

class ExecuteRequest(BaseModel):
    code: str

class API:
    def __init__(self, execution_queue: queue.Queue, handle_interrupt: Callable):
        self.app = FastAPI()
        self.execution_queue = execution_queue
        self.handle_interrupt = handle_interrupt
        # Configure CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, replace with specific origins
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self.app.post("/execute")(self.execute)
        self.app.post("/interrupt")(self.handle_interrupt)

    def execute(self, request: ExecuteRequest):
        self.execution_queue.put(request.code)

    def run(self):
        uvicorn.run(self.app, host="0.0.0.0", port=8000)
    
