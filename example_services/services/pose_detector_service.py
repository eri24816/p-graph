"""Auto-generated service: DetectPose"""

import sys
from pathlib import Path

# Add parent directory to path to import generated modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from aip_service_kit import App
from generated.pose_detector_pb2 import (
    DetectPoseRequest,
    DetectPoseResponse,
)

app = App()

@app.router.route("/detect_pose")
def detect_pose(request: DetectPoseRequest) -> DetectPoseResponse:
    """
    Handler for DetectPose service.
    
    TODO: Implement your service logic here.
    """
    print(f"[DetectPose] Received request: {request}")
    
    # TODO: Implement service logic
    response = DetectPoseResponse()
    
    return response


if __name__ == "__main__":
    # Run service with grpc protocol on port 8081
    app.run(protocol="grpc", port=8081)
