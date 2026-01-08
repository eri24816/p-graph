from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Point3D(_message.Message):
    __slots__ = ("x", "y", "z")
    X_FIELD_NUMBER: _ClassVar[int]
    Y_FIELD_NUMBER: _ClassVar[int]
    Z_FIELD_NUMBER: _ClassVar[int]
    x: float
    y: float
    z: float
    def __init__(self, x: _Optional[float] = ..., y: _Optional[float] = ..., z: _Optional[float] = ...) -> None: ...

class PoseReading(_message.Message):
    __slots__ = ("head", "torso")
    HEAD_FIELD_NUMBER: _ClassVar[int]
    TORSO_FIELD_NUMBER: _ClassVar[int]
    head: Point3D
    torso: Point3D
    def __init__(self, head: _Optional[_Union[Point3D, _Mapping]] = ..., torso: _Optional[_Union[Point3D, _Mapping]] = ...) -> None: ...
