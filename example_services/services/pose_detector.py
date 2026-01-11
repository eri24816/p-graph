"""Auto-generated service: pose_detector"""


from generated.pose_detector_pb2 import DetectPoseRequest, DetectPoseResponse

from aip_service_kit import App
app = App()


@app.route("detect-pose")
def detect_pose(request: DetectPoseRequest) -> DetectPoseResponse:
    """
    Handler for detect_pose service.
    """
    print(f"[detect_pose] Received request: {request}")
    
    # TODO: Implement service logic
    response = DetectPoseResponse()
    
    return response


@app.route("detect-pose2")
def detect_pose2(request: DetectPoseRequest) -> DetectPoseResponse:
    """
    Handler for detect_pose2 service.
    """
    print(f"[detect_pose2] Received request: {request}")
    
    # TODO: Implement service logic
    response = DetectPoseResponse()
    
    return response



if __name__ == "__main__":
    app.run(protocol="grpc", port=8081)
