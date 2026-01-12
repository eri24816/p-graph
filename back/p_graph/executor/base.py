from abc import ABC, abstractmethod

class Executor(ABC):

    @abstractmethod
    def run(self):
        """Take over the main thread and run execution loop"""
        pass

    @abstractmethod
    def start(self, graph):
        """Start executing the provided graph in the execution loop. Non-blocking."""
        pass

    @abstractmethod
    def stop(self):
        pass

    @abstractmethod
    def get_state(self):
        pass
