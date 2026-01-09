import time
from p_graph.api import API
import threading
import queue
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
    def __init__(self, scanner=None):
        self.api = None
        self.scanner = scanner

    def set_api(self, api):
        self.api = api

    def run(self):
        # Deprecated run method, logic moved to main or API
        pass

    def handle_interrupt(self):
        pass

def main():
    # Initialize service scanner
    import os

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # back/
    root_dir = os.path.dirname(base_dir)  # w:/p-graph/
    proto_dir = os.path.join(root_dir, "example_services", "proto")

    from p_graph.service_scanner import ServiceScanner
    from p_graph.executor.default import DefaultExecutor

    scanner = ServiceScanner(proto_dir)

    # Debug print
    services = scanner.scan_services()
    print("Discovered services:", [s["name"] for s in services])

    executor_queue = queue.Queue()
    interrupt_flag = threading.Event()

    def handle_interrupt():
        interrupt_flag.set()

    executor = DefaultExecutor()

    api = API(executor_queue, handle_interrupt, executor=executor)
    api.set_service_scanner(scanner)

    api_thread = threading.Thread(target=api.run)
    api_thread.start()

    pgraph = PGraph(scanner)
    pgraph.set_api(api)

    # We don't run pgraph.run() anymore as it blocked with old executor loop
    # instead we keep main thread alive or join api thread

    # Since DefaultExecutor runs in its own thread when started via API,
    # we just need to keep the process alive.
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Exiting...")
        executor.stop()

if __name__ == "__main__":
    main()