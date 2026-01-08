"""
Demo Client - 通用客戶端示範

展示如何使用 ServiceClient 和 ServiceRegistry 
與 HTTP 和 gRPC 服務進行交互。
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from service_client import ServiceClient, ServiceRegistry
from generated.pose_detector_pb2 import DetectPoseRequest, DetectPoseResponse
from generated.pose_classifier_pb2 import ClassificationRequest, ClassificationResponse


def demo_simple_client():
    """示範 1: 使用簡單的 ServiceClient"""
    print("=" * 70)
    print("  示範 1: 簡單客戶端 (ServiceClient)")
    print("=" * 70)
    
    # 創建 HTTP 客戶端
    print("\n📡 創建 HTTP 客戶端連接到 localhost:8081...")
    detector_client = ServiceClient("localhost:8081", protocol="http")
    print(f"✓ 客戶端已創建: {detector_client}")
    
    # 調用檢測服務
    print("\n📸 調用姿態檢測服務...")
    request = DetectPoseRequest(frame_id="frame_demo_001")
    
    try:
        response = detector_client.call(
            path="/detect_pose",
            request=request,
            response_type=DetectPoseResponse
        )
        
        print("✓ 檢測成功!")
        print(f"  - Frame ID: {request.frame_id}")
        print(f"  - Head: ({response.pose.head.x}, {response.pose.head.y}, {response.pose.head.z})")
        print(f"  - Torso: ({response.pose.torso.x}, {response.pose.torso.y}, {response.pose.torso.z})")
        
        return response
    except Exception as e:
        print(f"✗ 調用失敗: {e}")
        return None


def demo_registry():
    """示範 2: 使用 ServiceRegistry 管理多個服務"""
    print("\n" + "=" * 70)
    print("  示範 2: 服務註冊表 (ServiceRegistry)")
    print("=" * 70)
    
    # 創建註冊表
    print("\n📋 創建服務註冊表...")
    registry = ServiceRegistry()
    
    # 註冊服務
    print("📝 註冊服務...")
    registry.register("detector", "localhost:8081", protocol="http")
    registry.register("classifier", "localhost:8082", protocol="http")
    
    print(f"✓ 註冊完成: {registry}")
    print(f"  已註冊服務: {registry.list_services()}")
    
    # 調用檢測服務
    print("\n📸 步驟 1: 調用姿態檢測服務...")
    detect_request = DetectPoseRequest(frame_id="frame_demo_002")
    
    try:
        detect_response = registry.call(
            service_name="detector",
            path="/detect_pose",
            request=detect_request,
            response_type=DetectPoseResponse
        )
        
        print("✓ 檢測成功!")
        print(f"  - Head: ({detect_response.pose.head.x}, {detect_response.pose.head.y}, {detect_response.pose.head.z})")
        print(f"  - Torso: ({detect_response.pose.torso.x}, {detect_response.pose.torso.y}, {detect_response.pose.torso.z})")
        
    except Exception as e:
        print(f"✗ 調用失敗: {e}")
        return
    
    # 調用分類服務
    print("\n🔍 步驟 2: 調用姿態分類服務...")
    classify_request = ClassificationRequest(pose=detect_response.pose)
    
    try:
        classify_response = registry.call(
            service_name="classifier",
            path="/classify_pose",
            request=classify_request,
            response_type=ClassificationResponse
        )
        
        print("✓ 分類成功!")
        print(f"  - 是否倒立: {classify_response.is_upside_down}")
        print(f"  - 判斷: {'倒立' if classify_response.is_upside_down else '正常'}")
        
    except Exception as e:
        print(f"✗ 調用失敗: {e}")


def demo_auto_detect():
    """示範 3: 自動檢測協議"""
    print("\n" + "=" * 70)
    print("  示範 3: 自動協議檢測")
    print("=" * 70)
    
    print("\n🔍 創建客戶端並自動檢測協議...")
    
    # 自動檢測 HTTP 服務
    client = ServiceClient("localhost:8081", protocol="auto")
    print(f"✓ 自動檢測結果: {client}")
    
    # 測試調用
    print("\n📞 測試調用服務...")
    request = DetectPoseRequest(frame_id="frame_auto_detect")
    
    try:
        response = client.call(
            path="/detect_pose",
            request=request,
            response_type=DetectPoseResponse
        )
        print(f"✓ 調用成功! 協議: {client.protocol.value}")
    except Exception as e:
        print(f"✗ 調用失敗: {e}")


def demo_grpc_client():
    """示範 4: gRPC 客戶端 (如果有 gRPC 服務運行)"""
    print("\n" + "=" * 70)
    print("  示範 4: gRPC 客戶端 (可選)")
    print("=" * 70)
    
    print("\n📡 創建 gRPC 客戶端連接到 localhost:50051...")
    print("   (如果沒有 gRPC 服務運行，此示範會跳過)")
    
    try:
        client = ServiceClient("localhost:50051", protocol="grpc")
        print(f"✓ 客戶端已創建: {client}")
        
        # 調用服務
        request = DetectPoseRequest(frame_id="frame_grpc_001")
        response = client.call(
            path="/detect_pose",
            request=request,
            response_type=DetectPoseResponse
        )
        
        print("✓ gRPC 調用成功!")
        print(f"  - Head: ({response.pose.head.x}, {response.pose.head.y}, {response.pose.head.z})")
        
    except Exception as e:
        print(f"⚠️  gRPC 服務未運行或調用失敗: {e}")
        print("   提示: 使用 protocol='grpc' 啟動服務來測試此功能")


def demo_comparison():
    """示範 5: HTTP vs gRPC 對比"""
    print("\n" + "=" * 70)
    print("  示範 5: 協議對比 (HTTP vs gRPC)")
    print("=" * 70)
    
    request = DetectPoseRequest(frame_id="frame_comparison")
    
    # HTTP
    print("\n🌐 HTTP 協議:")
    try:
        http_client = ServiceClient("localhost:8081", protocol="http")
        response = http_client.call("/detect_pose", request, DetectPoseResponse)
        print(f"  ✓ 成功 - 協議: HTTP")
    except Exception as e:
        print(f"  ✗ 失敗: {e}")
    
    # gRPC  
    print("\n⚡ gRPC 協議:")
    try:
        grpc_client = ServiceClient("localhost:50051", protocol="grpc")
        response = grpc_client.call("/detect_pose", request, DetectPoseResponse)
        print(f"  ✓ 成功 - 協議: gRPC")
    except Exception as e:
        print(f"  ⚠️  未運行或失敗: {e}")
    
    print("\n📊 協議特點對比:")
    print("  HTTP:")
    print("    + 簡單易用，廣泛支援")
    print("    + 防火牆友好")
    print("    - 效能較低")
    print("  gRPC:")
    print("    + 高效能，低延遲")
    print("    + 支援串流")
    print("    - 需要特殊配置")


def main():
    client = ServiceClient("localhost:8081", protocol="auto")
    
    request = DetectPoseRequest(frame_id="frame_auto_detect")
    
    try:
        response = client.call(
            path="/detect_pose",
            request=request,
            response_type=DetectPoseResponse
        )
        print(f"✓ 調用成功! 協議: {client.protocol.value}")
    except Exception as e:
        print(f"✗ 調用失敗: {e}")

if __name__ == "__main__":
    main()
