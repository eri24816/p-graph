#!/bin/bash

# 使用說明腳本

cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════╗
║                   AIProto Service Generator                       ║
║                      使用說明與範例                                ║
╚═══════════════════════════════════════════════════════════════════╝

📚 完整文檔：
   • README.md        - 完整使用指南
   • QUICKREF.md      - 快速參考
   • ARCHITECTURE.txt - 系統架構圖

🚀 快速開始：

   1️⃣  一鍵啟動（最簡單）：
      ./quick_start.sh

   2️⃣  手動步驟：
      ./generate_services.sh                           # 生成服務
      python services/pose_detector_service_impl.py   # 終端 1
      python services/pose_classifier_service_impl.py # 終端 2  
      python test_client.py                           # 終端 3

📝 建立新服務：

   1. 在 proto/ 建立 my_service.aiproto：
      
      syntax = "proto3";
      package my_service;
      
      message MyRequest {
        string data = 1;
      }
      
      message MyResponse {
        string result = 1;
      }
      
      service MyService {
          service_file = "my_service"
          path = "my_method"
          protocol = "http"
          port = 8080
          request = MyRequest
          response = MyResponse
      }

   2. 執行生成腳本：
      ./generate_services.sh

   3. 實作服務邏輯：
      編輯 services/my_service.py

   4. 執行服務：
      python services/my_service.py

🔧 主要腳本：

   generate_services.sh  - 從 .aiproto 生成所有文件
   parse_aiproto.py      - AIProto 解析器
   quick_start.sh        - 一鍵啟動測試
   test_client.py        - HTTP 客戶端測試

📂 目錄結構：

   proto/       - .aiproto 和 .proto 文件
   generated/   - 自動生成的 Python protobuf 綁定
   services/    - 服務實作文件

💡 提示：

   • 修改 .aiproto 後重新執行 generate_services.sh
   • _impl.py 文件是完整實作範例，不會被覆蓋
   • .py (無 _impl) 是模板，會被覆蓋
   • 使用版本控制追蹤你的更改

🌐 支援的協議：

   ✅ HTTP  - protocol = "http"
   ✅ gRPC  - protocol = "grpc"
   🔜 ROS2  - protocol = "ros2" (待實作)

📞 測試服務：

   HTTP:
   curl -X POST http://localhost:8081/detect_pose \
     -H "Content-Type: application/x-protobuf" \
     --data-binary @request.bin

   Python:
   python test_client.py

❓ 需要幫助？

   閱讀 README.md 或 QUICKREF.md 了解更多詳情

╔═══════════════════════════════════════════════════════════════════╗
║                      準備好開始了嗎？                              ║
║                   執行：./quick_start.sh                          ║
╚═══════════════════════════════════════════════════════════════════╝

EOF
