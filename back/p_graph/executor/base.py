from abc import ABC, abstractmethod

class Executor(ABC):
    @abstractmethod
    def load_graph(self, graph_data):
        pass

    @abstractmethod
    def run(self):
        """Start execution loop (blocking or non-blocking depending on impl)"""
        pass

    @abstractmethod
    def start(self):
        """Start execution in a non-blocking way (e.g. thread)"""
        pass

    @abstractmethod
    def stop(self):
        pass

    @abstractmethod
    def get_state(self):
        pass
