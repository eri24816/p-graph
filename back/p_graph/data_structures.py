import dataclasses
from typing import Callable

@dataclasses.dataclass
class FunctionConfig:
    function_name: str
    inputs: dict[str, str]
    outputs: dict[str, str]
    default_node_name: str | None = None