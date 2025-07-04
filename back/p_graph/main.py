import time
from p_graph.api import API
import threading
import queue
import signal
from p_graph.utils import exec_

class Executor:
    def __init__(self):
        self.execution_queue = queue.Queue()
        self.next_sigint_is_from_frontend = False
    
    def run(self):
        while True:
            try:
                code = self.execution_queue.get(block=True, timeout=0.01)
                exec_(code,print_=print)
            except queue.Empty:
                time.sleep(0.01)
            except KeyboardInterrupt:
                if self.next_sigint_is_from_frontend:
                    print("Interrupted execution")
                else:
                    print("Shutting down...")
                    return
            
            self.next_sigint_is_from_frontend = False

class PGraph:
    def __init__(self):
        self.executor = Executor()
        self.api = API(execution_queue=self.executor.execution_queue, handle_interrupt=self.handle_interrupt)
        self.api_thread = threading.Thread(target=self.api.run)
        self.api_thread.daemon = True

    def run(self):
        self.api_thread.start()
        self.executor.run()
        

    def handle_interrupt(self):
        self.executor.next_sigint_is_from_frontend = True
        # send a signal to the executor thread
        signal.raise_signal(signal.SIGINT)

def main():
    pgraph = PGraph()
    pgraph.run()

if __name__ == "__main__":
    main()