import queue
from p_graph.utils import exec_
import time

class InterruptableExecutor:
    def __init__(self):
        self.execution_queue = queue.Queue()
        self.next_sigint_is_from_frontend = False

    def run(self):
        while True:
            try:
                code = self.execution_queue.get(block=True, timeout=0.01)
                exec_(code, print_=print)
            except queue.Empty:
                time.sleep(0.01)
            except KeyboardInterrupt:
                if self.next_sigint_is_from_frontend:
                    print("Interrupted execution")
                else:
                    print("Shutting down...")
                    return

            self.next_sigint_is_from_frontend = False