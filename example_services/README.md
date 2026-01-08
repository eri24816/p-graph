# AIProto - Service Generator Experiments

這個資料夾包含 **AIProto** 格式的實驗性實作，能夠從擴充的 `.aiproto` 文件自動生成完整的服務框架。

## 📋 目錄結構

```
experiments/
├── proto/                      # Protocol Buffer 定義
│   ├── pose.proto             # 基礎訊息定義
│   ├── pose_detector.aiproto  # AI 擴充格式 (檢測服務)
│   └── pose_classifier.aiproto # AI 擴充格式 (分類服務)
├── generated/                  # 自動生成的 Python protobuf 綁定
│   ├── pose_pb2.py
│   ├── pose_detector_pb2.py
│   └── pose_classifier_pb2.py
├── services/                   # 自動生成的服務模板
│   ├── pose_detector_service.py
│   └── pose_classifier_service.py
├── parse_aiproto.py           # AIProto 解析器
├── generate_services.sh       # 一鍵生成腳本
└── README.md                  # 本文件
```

## 🚀 快速開始

### 方法 1: 一鍵啟動（推薦）

最快的方式，自動啟動所有服務並執行測試：

```bash
cd experiments
./quick_start.sh
```

這會自動：
1. ✅ 生成所有服務（如果還沒生成）
2. ✅ 啟動 Pose Detector Service (port 8081)
3. ✅ 啟動 Pose Classifier Service (port 8082)
4. ✅ 執行測試客戶端
5. ✅ 保持服務運行（按 Ctrl+C 停止）

### 方法 2: 手動步驟

#### 1. 生成所有服務

只需執行一個命令：

```bash
cd experiments
./generate_services.sh
```

這個腳本會自動：
1. ✅ 解析所有 `.aiproto` 文件
2. ✅ 生成標準 `.proto` 文件
3. ✅ 編譯生成 Python protobuf 綁定 (`*_pb2.py`)
4. ✅ 生成服務模板 Python 文件

#### 2. 實作服務邏輯

編輯生成的服務文件（在 `services/` 目錄下），或使用已實作的範例：

**選項 A: 使用範例實作（推薦）**
```bash
# 已提供完整實作的服務
python services/pose_detector_service_impl.py    # port 8081
python services/pose_classifier_service_impl.py  # port 8082
```

**選項 B: 自己實作**
編輯 `services/pose_detector_service.py`：

```python
# services/pose_detector_service.py
@app.router.route("/detect_pose")
def detect_pose(request: DetectPoseRequest) -> DetectPoseResponse:
    # 實作你的服務邏輯
    pose = PoseReading(
        head=Point3D(x=0.0, y=1.7, z=0.5),
        torso=Point3D(x=0.0, y=1.0, z=0.5)
    )
    response = DetectPoseResponse(pose=pose)
    return response
```

#### 3. 測試服務

**終端 1：啟動檢測服務**
```bash
python services/pose_detector_service_impl.py
```

**終端 2：啟動分類服務**
```bash
python services/pose_classifier_service_impl.py
```

**終端 3：執行測試客戶端**
```bash
python test_client.py
```

預期輸出：
```
============================================================
  AIProto Services Test Client
============================================================

📸 Calling Pose Detector with frame: frame_001
✓ Detected pose:
  - Head: (0.0, 1.7, 0.5)
  - Torso: (0.0, 1.0, 0.5)

🔍 Calling Pose Classifier
✓ Classification result:
  - Is upside down: False

============================================================
✅ Test completed successfully!
============================================================
```

## 📝 AIProto 格式說明

`.aiproto` 是標準 Protocol Buffer 的擴充格式，在標準 proto 語法基礎上增加服務配置。

### 基本結構

```protobuf
syntax = "proto3";

package your_package;

import "pose.proto";

# 標準 protobuf 訊息定義
message YourRequest {
  string field1 = 1;
  int32 field2 = 2;
}

message YourResponse {
  string result = 1;
}

# AI 服務配置（擴充部分）
service YourService {
    service_file = "your_service"      # 生成的服務文件名
    parent_path = "api/v1"             # API 父路徑
    path = "your_method"               # 方法路徑
    protocol = "http"                  # 協議: http 或 grpc
    port = 8080                        # 服務端口
    request = YourRequest              # 請求訊息類型
    response = YourResponse            # 響應訊息類型
}
```

### 配置選項說明

| 選項 | 說明 | 範例 | 預設值 |
|------|------|------|--------|
| `service_file` | 生成的服務文件名 | `"pose_detector_service"` | `"{service_name}_service"` |
| `parent_path` | API 路徑前綴 | `"api/v1"` | `"api/v1"` |
| `path` | 服務方法路徑 | `"detect_pose"` | `"{service_name}"` |
| `protocol` | 通訊協議 | `"http"` 或 `"grpc"` | `"http"` |
| `port` | 服務監聽端口 | `8081` | `8080` |
| `request` | 請求訊息類型 | `DetectPoseRequest` | - |
| `response` | 響應訊息類型 | `DetectPoseResponse` | - |

## 📄 範例文件

### pose_detector.aiproto

```protobuf
syntax = "proto3";

package pose_detector;

import "pose.proto";

message DetectPoseRequest {
  string frame_id = 1;
}

message DetectPoseResponse {
  pose.PoseReading pose = 1;
}

service DetectPose {
    service_file = "pose_detector_service"
    parent_path = "api/v1"
    path = "detect_pose"
    protocol = "http"
    port = 8081
    request = DetectPoseRequest
    response = DetectPoseResponse
}
```

### 生成的服務模板

```python
"""Auto-generated service: DetectPose"""

from aip_service_kit import App
from ../generated.pose_detector_pb2 import (
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
    # Run service with http protocol on port 8081
    app.run(protocol="http", port=8081)
```

## 🔧 手動使用解析器

如果只想處理單個文件：

```bash
python parse_aiproto.py proto/pose_detector.aiproto .
```

參數：
- 第一個參數：`.aiproto` 文件路徑
- 第二個參數：輸出目錄（可選，預設為當前目錄）

## 🛑 管理服務

**停止服務：**
```bash
./stop.sh 8081 8082              # 停止指定端口的服務
./stop.sh 8081 8082 50051 50052  # 可以停止多個端口
```

**檢查端口佔用：**
```bash
lsof -i :8081  # macOS/Linux
```

**常見問題：**
- `OSError: [Errno 48] Address already in use` → 執行 `./stop.sh 8081 8082`
- 服務無法啟動 → 確認端口未被其他程序佔用

## 🎯 工作流程

1. **設計階段**：編寫 `.aiproto` 文件定義服務
2. **生成階段**：執行 `./generate_services.sh` 生成框架
3. **開發階段**：實作服務邏輯
4. **測試階段**：執行服務並測試
5. **迭代階段**：修改 `.aiproto` 重新生成（注意保留你的實作）

## ⚠️ 注意事項

- 重新執行 `generate_services.sh` 會覆蓋 `services/` 目錄下的文件
- 建議在生成後立即複製服務模板到其他位置進行開發
- 或者使用版本控制來追蹤變更

## 🚀 進階使用

### 支援多協議

在同一個 `.aiproto` 中可以定義多個服務使用不同協議：

```protobuf
service DetectPoseHTTP {
    protocol = "http"
    port = 8081
    # ...
}

service DetectPoseGRPC {
    protocol = "grpc"
    port = 50051
    # ...
}
```

### 自訂生成邏輯

修改 `parse_aiproto.py` 中的 `generate_service_file()` 函數來自訂服務模板。

## 📚 相關文件

- [aip_service_kit README](../README.md) - 主框架文件
- [Protocol Buffer 指南](https://protobuf.dev/)
- [gRPC Python 文件](https://grpc.io/docs/languages/python/)
