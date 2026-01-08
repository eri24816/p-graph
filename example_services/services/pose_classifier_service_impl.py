"""Auto-generated service: ClassifyPose - WITH IMPLEMENTATION"""

import sys
from pathlib import Path

# Add parent directory to path to import generated modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from aip_service_kit import App
from generated.pose_classifier_pb2 import (
    ClassificationRequest,
    ClassificationResponse,
)

app = App()

@app.router.route("/classify_pose")
def classify_pose(request: ClassificationRequest) -> ClassificationResponse:
    """
    Handler for ClassifyPose service.
    
    Classifies if a pose is upside down based on head/torso positions.
    """
    pose = request.pose
    print(f"[ClassifyPose] Received pose - Head Y: {pose.head.y}, Torso Y: {pose.torso.y}")
    
    # Classification logic: if head is below torso, it's upside down
    is_upside_down = pose.head.y < pose.torso.y
    
    print(f"[ClassifyPose] Classification: {'Upside Down' if is_upside_down else 'Normal'}")
    
    response = ClassificationResponse(
        is_upside_down=is_upside_down,
        source_pose=pose
    )
    return response


if __name__ == "__main__":
    # Run service with http protocol on port 8082
    print("Starting Pose Classifier Service...")
    app.run(protocol="grpc", port=8082)
