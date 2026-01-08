"""Auto-generated service: DetectPose - WITH IMPLEMENTATION"""

import sys
from pathlib import Path

# Add parent directory to path to import generated modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from aip_service_kit import App
from generated.pose_detector_pb2 import (
    DetectPoseRequest,
    DetectPoseResponse,
)
from generated.pose_pb2 import PoseReading, Point3D

app = App()

@app.router.route("/detect_pose")
def detect_pose(request: DetectPoseRequest) -> DetectPoseResponse:
    """
    Handler for DetectPose service.
    
    Simulates pose detection from a video frame.
    """
    print(f"[DetectPose] Received request for frame: {request.frame_id}")
    
    # Simulate pose detection
    # In real implementation, this would process the frame and detect pose
    pose = PoseReading(
        head=Point3D(x=0.0, y=1.7, z=0.5),
        torso=Point3D(x=0.0, y=1.0, z=0.5)
    )
    
    print(f"[DetectPose] Detected pose - Head: ({pose.head.x}, {pose.head.y}, {pose.head.z})")
    
    response = DetectPoseResponse(pose=pose)
    return response


if __name__ == "__main__":
    # Run service with http protocol on port 8081
    print("Starting Pose Detector Service...")
    app.run(protocol="grpc", port=8081)
