import argparse
from email import message
from pathlib import Path
import google.protobuf.message
from p_graph.data_structures import FunctionConfig
from p_graph.server import Server
import threading
from p_graph.executor.default import DefaultExecutor

import logging


import aip_service_kit
import aip_service_kit.client
from aip_service_kit.client.aiproto_parser import (
    get_functions_from_proto_dir,
    get_message_types_from_proto_dir,
)

import google.protobuf.json_format
from p_graph.logging_setup import setup_logging

import aip_service_kit.client.aiproto_parser


setup_logging()
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proto_dir", type=str, default="example_services/proto")
    args = parser.parse_args()

    aip_client = aip_service_kit.client.ServiceRegistry()
    aip_client.register_from_proto_files(args.proto_dir)

    message_classes = aip_service_kit.client.aiproto_parser.get_message_classes(
        proto_dir=args.proto_dir,
        proto_generated_dir=str(Path(args.proto_dir).parent / "services/generated"),
    )

    message_types = get_message_types_from_proto_dir(args.proto_dir)
    logger.info(f"Discovered message types: {message_types}")
    aip_functions = get_functions_from_proto_dir(args.proto_dir)

    def get_aip_function_implementation(function_name: str):

        aip_function = next(
            f for f in aip_functions if f"{f.service}/{f.name}" == function_name
        )

        def implementation(**kwargs):
            request_message = message_classes[aip_function.request](**kwargs)
            logger.info(
                f"Executing AIP function: {function_name} with request: {google.protobuf.json_format.MessageToDict(request_message, preserving_proto_field_name=True,always_print_fields_with_no_presence=True)}"
            )
            service_name, path = function_name.split("/", 1)
            response = aip_client.call(
                service_name=service_name,
                path=path,
                request=request_message,
                response_type=message_classes[aip_function.response],
            )
            logger.info(
                f"AIP function {function_name} returned response: {google.protobuf.json_format.MessageToDict(response, preserving_proto_field_name=True, always_print_fields_with_no_presence=True)}"
            )
            return response

        return implementation

    function_configs: list[FunctionConfig] = []
    for aip_function in aip_functions:
        function_configs.append(
            FunctionConfig(
                function_name=f"{aip_function.service}/{aip_function.name}",
                default_node_name=aip_function.name,
                inputs=message_types[aip_function.request],
                outputs=message_types[aip_function.response],
            )
        )

    logger.info(f"Discovered functions: {function_configs}")

    function_impls = {
        f.function_name: get_aip_function_implementation(f.function_name)
        for f in function_configs
    }

    executor = DefaultExecutor(functions=function_impls)
    server = Server(executor=executor, functions=function_configs)

    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()
    executor.run()
    input("Press Enter to stop the server...\n")
    server.stop()
    server_thread.join()


if __name__ == "__main__":
    main()
