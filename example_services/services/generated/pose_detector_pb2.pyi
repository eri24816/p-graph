import pose_pb2 as _pose_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class DetectPoseRequest(_message.Message):
    __slots__ = ("frame_id",)
    FRAME_ID_FIELD_NUMBER: _ClassVar[int]
    frame_id: str
    def __init__(self, frame_id: _Optional[str] = ...) -> None: ...

class DetectPoseResponse(_message.Message):
    __slots__ = ("pose",)
    POSE_FIELD_NUMBER: _ClassVar[int]
    pose: _pose_pb2.PoseReading
    def __init__(self, pose: _Optional[_Union[_pose_pb2.PoseReading, _Mapping]] = ...) -> None: ...
