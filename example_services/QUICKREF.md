# AIProto 快速參考

## 📁 文件結構

```
experiments/
├── 📄 README.md                          ← 完整文檔
├── 🔧 generate_services.sh              ← 主生成腳本
├── 🚀 quick_start.sh                    ← 一鍵啟動所有服務
├── 🐍 parse_aiproto.py                  ← AIProto 解析器
├── 🧪 test_client.py                    ← HTTP 測試客戶端
│
├── proto/                               ← Protocol 定義
│   ├── pose.proto                       ← 基礎訊息
│   ├── pose_detector.aiproto           ← AI 擴充：檢測服務
│   └── pose_classifier.aiproto         ← AI 擴充：分類服務
│
├── generated/                           ← 自動生成
│   ├── pose_pb2.py
│   ├── pose_detector_pb2.py
│   └── pose_classifier_pb2.py
│
└── services/                            ← 服務實作
    ├── pose_detector_service.py         ← 自動生成模板
    ├── pose_detector_service_impl.py    ← 完整實作範例
    ├── pose_classifier_service.py       ← 自動生成模板
    └── pose_classifier_service_impl.py  ← 完整實作範例
```

## ⚡ 快速命令

```bash
# 一鍵啟動所有服務（推薦）
./quick_start.sh

# 停止服務（端口被佔用時）
./stop.sh 8081 8082

# 或手動步驟：
./generate_services.sh                           # 生成所有服務
python services/pose_detector_service_impl.py   # 啟動檢測服務
python services/pose_classifier_service_impl.py # 啟動分類服務
python test_client.py                           # 測試客戶端
```

## 📝 AIProto 格式範例

```protobuf
syntax = "proto3";
package my_service;

# 標準 protobuf 訊息
message MyRequest {
  string data = 1;
}

message MyResponse {
  string result = 1;
}

# AI 服務配置
service MyService {
    service_file = "my_service"
    parent_path = "api/v1"
    path = "my_method"
    protocol = "http"      # 或 "grpc"
    port = 8080
    request = MyRequest
    response = MyResponse
}
```

## 🔄 工作流程

1. **設計** → 編寫 `.aiproto` 文件
2. **生成** → 執行 `./generate_services.sh`
3. **實作** → 填寫服務邏輯
4. **測試** → 執行 `./quick_start.sh` 或手動測試
5. **部署** → 運行生產服務

## 🎯 支援的協議

- ✅ **HTTP** - 使用 Python 內建 http.server，Protobuf 二進位格式
- ✅ **gRPC** - 高效能 RPC 框架
- 🔜 **ROS2** - 機器人作業系統整合（待實作）

## 📚 更多資訊

詳見 [README.md](README.md)
