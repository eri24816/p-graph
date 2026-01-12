#!/usr/bin/env python3
"""Simple server runner that bypasses aip_service_kit dependency"""

from p_graph.server import Server
from p_graph.executor.default import DefaultExecutor
from p_graph.logging_setup import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)

def main():
    executor = DefaultExecutor()

    # Start with empty functions list for now
    # TODO: Add proper function discovery when aip_service_kit is available
    functions = []

    logger.info("Starting server with empty functions list")
    server = Server(executor=executor, functions=functions)

    logger.info("Server starting on http://0.0.0.0:8000")
    server.run()

if __name__ == "__main__":
    main()
