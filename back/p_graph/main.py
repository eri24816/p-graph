import argparse
from p_graph.data_structures import FunctionConfig
from p_graph.server import Server
import threading
from p_graph.executor.default import DefaultExecutor

import logging


from aip_service_kit.client.aiproto_parser import (
    get_functions_from_proto_dir,
    get_message_types_from_proto_dir,
)

from p_graph.logging_setup import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proto_dir", type=str, default="example_services/proto")
    args = parser.parse_args()

    executor = DefaultExecutor()

    message_types = get_message_types_from_proto_dir(args.proto_dir)
    logger.info(f"Discovered message types: {message_types}")
    aip_functions = get_functions_from_proto_dir(args.proto_dir)
    functions: list[FunctionConfig] = []
    for aip_function in aip_functions:
        functions.append(
            FunctionConfig(
                function_name=aip_function.name,
                inputs=message_types[aip_function.request],
                outputs=message_types[aip_function.response],
            )
        )
    logger.info(f"Discovered functions: {functions}")
    server = Server(executor=executor, functions=functions)

    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()
    # executor.run()
    input("Press Enter to stop the server...\n")
    server.stop()
    server_thread.join()


if __name__ == "__main__":
    main()
