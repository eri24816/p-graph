from rich.logging import RichHandler
import logging

def setup_logging(level=logging.INFO):
    root = logging.getLogger()
    root.setLevel(level)

    handler = RichHandler(rich_tracebacks=True, markup=True, log_time_format = "[%X]")
    handler.setFormatter(logging.Formatter("%(message)s"))

    root.handlers.clear()
    root.addHandler(handler)