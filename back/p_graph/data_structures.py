import dataclasses

@dataclasses.dataclass
class FunctionConfig:
    function_name: str
    inputs: dict[str, str]
    outputs: dict[str, str]