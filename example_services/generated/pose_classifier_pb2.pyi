import pose_pb2 as _pose_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ClassificationRequest(_message.Message):
    __slots__ = ("pose",)
    POSE_FIELD_NUMBER: _ClassVar[int]
    pose: _pose_pb2.PoseReading
    def __init__(self, pose: _Optional[_Union[_pose_pb2.PoseReading, _Mapping]] = ...) -> None: ...

class ClassificationResponse(_message.Message):
    __slots__ = ("is_upside_down", "source_pose")
    IS_UPSIDE_DOWN_FIELD_NUMBER: _ClassVar[int]
    SOURCE_POSE_FIELD_NUMBER: _ClassVar[int]
    is_upside_down: bool
    source_pose: _pose_pb2.PoseReading
    def __init__(self, is_upside_down: bool = ..., source_pose: _Optional[_Union[_pose_pb2.PoseReading, _Mapping]] = ...) -> None: ...
