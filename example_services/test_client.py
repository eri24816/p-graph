"""Test client for generated services."""

import sys
from pathlib import Path
import requests

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from generated.pose_detector_pb2 import DetectPoseRequest, DetectPoseResponse
from generated.pose_classifier_pb2 import ClassificationRequest, ClassificationResponse


def call_detector(frame_id: str) -> DetectPoseResponse:
    """Call the pose detector service."""
    print(f"\n📸 Calling Pose Detector with frame: {frame_id}")
    
    request = DetectPoseRequest(frame_id=frame_id)
    
    response = requests.post(
        "http://localhost:8081/detect_pose",
        data=request.SerializeToString(),
        headers={"Content-Type": "application/x-protobuf"}
    )
    
    if response.status_code == 200:
        result = DetectPoseResponse()
        result.ParseFromString(response.content)
        print(f"✓ Detected pose:")
        print(f"  - Head: ({result.pose.head.x}, {result.pose.head.y}, {result.pose.head.z})")
        print(f"  - Torso: ({result.pose.torso.x}, {result.pose.torso.y}, {result.pose.torso.z})")
        return result
    else:
        print(f"✗ Error: {response.status_code}")
        raise Exception(f"Request failed: {response.status_code}")


def call_classifier(detect_response: DetectPoseResponse) -> ClassificationResponse:
    """Call the pose classifier service."""
    print(f"\n🔍 Calling Pose Classifier")
    
    request = ClassificationRequest(pose=detect_response.pose)
    
    response = requests.post(
        "http://localhost:8082/classify_pose",
        data=request.SerializeToString(),
        headers={"Content-Type": "application/x-protobuf"}
    )
    
    if response.status_code == 200:
        result = ClassificationResponse()
        result.ParseFromString(response.content)
        print(f"✓ Classification result:")
        print(f"  - Is upside down: {result.is_upside_down}")
        return result
    else:
        print(f"✗ Error: {response.status_code}")
        raise Exception(f"Request failed: {response.status_code}")


def main():
    """Run the test client."""
    print("=" * 60)
    print("  AIProto Services Test Client")
    print("=" * 60)
    
    try:
        # Step 1: Detect pose
        detect_result = call_detector("frame_001")
        
        # Step 2: Classify pose
        classify_result = call_classifier(detect_result)
        
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("\nMake sure both services are running:")
        print("  Terminal 1: python services/pose_detector_service_impl.py")
        print("  Terminal 2: python services/pose_classifier_service_impl.py")

        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
