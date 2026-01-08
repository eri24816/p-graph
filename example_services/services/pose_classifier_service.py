"""Auto-generated service: ClassifyPose"""

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
    
    TODO: Implement your service logic here.
    """
    print(f"[ClassifyPose] Received request: {request}")
    
    # TODO: Implement service logic
    response = ClassificationResponse()
    
    return response


if __name__ == "__main__":
    # Run service with grpc protocol on port 8082
    app.run(protocol="grpc", port=8082)
