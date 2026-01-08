# 通用服務客戶端 (Universal Service Client)

這是一個統一的客戶端模組，可以透明地與 HTTP 和 gRPC 服務進行交互，使用者無需關心底層協議細節。

## 📦 模組結構

```
experiments/
├── service_client.py      # 通用客戶端模組
├── demo_client.py         # 使用示範
└── CLIENT_GUIDE.md        # 本文件
```

## 🚀 快速開始

### 基本使用

```python
from service_client import ServiceClient
from generated.pose_detector_pb2 import DetectPoseRequest, DetectPoseResponse

# 創建客戶端
client = ServiceClient("localhost:8081", protocol="http")

# 調用服務
request = DetectPoseRequest(frame_id="frame_001")
response = client.call(
    path="/detect_pose",
    request=request,
    response_type=DetectPoseResponse
)

print(f"Head: {response.pose.head}")
```

### 使用服務註冊表

```python
from service_client import ServiceRegistry

# 創建註冊表
registry = ServiceRegistry()

# 註冊多個服務
registry.register("detector", "localhost:8081", protocol="http")
registry.register("classifier", "localhost:8082", protocol="http")

# 調用服務
response = registry.call(
    service_name="detector",
    path="/detect_pose",
    request=request,
    response_type=DetectPoseResponse
)
```

### 自動協議檢測

```python
# 自動檢測協議 (HTTP 或 gRPC)
client = ServiceClient("localhost:8081", protocol="auto")

# 客戶端會自動選擇合適的協議
response = client.call("/detect_pose", request, DetectPoseResponse)
```

## 📚 API 文檔

### ServiceClient

主要的客戶端類，用於與單個服務交互。

#### 構造函數

```python
ServiceClient(
    address: str,
    protocol: str = "auto",
    service_name: str = "DynamicService"
)
```

**參數:**
- `address`: 服務地址，格式為 `"host:port"`
- `protocol`: 協議類型
  - `"http"` - 使用 HTTP 協議
  - `"grpc"` - 使用 gRPC 協議
  - `"auto"` - 自動檢測 (預設)
- `service_name`: gRPC 服務名稱 (預設: "DynamicService")

#### call() 方法

```python
client.call(
    path: str,
    request: Message,
    response_type: Type[T],
    method_name: Optional[str] = None
) -> T
```

**參數:**
- `path`: 方法路徑，例如 `"/detect_pose"`
- `request`: 請求訊息 (protobuf Message)
- `response_type`: 響應訊息類型
- `method_name`: gRPC 方法名稱 (可選，會從 path 自動生成)

**返回:**
- 響應訊息實例

### ServiceRegistry

服務註冊表，用於管理多個服務客戶端。

#### register() 方法

```python
registry.register(
    name: str,
    address: str,
    protocol: str = "auto",
    service_name: str = "DynamicService"
) -> ServiceClient
```

註冊一個服務到註冊表。

#### call() 方法

```python
registry.call(
    service_name: str,
    path: str,
    request: Message,
    response_type: Type[T],
    method_name: Optional[str] = None
) -> T
```

調用已註冊的服務。

#### 其他方法

- `get(name: str)` - 獲取已註冊的客戶端
- `list_services()` - 列出所有已註冊的服務

## 🎯 使用場景

### 場景 1: 簡單的單服務調用

```python
client = ServiceClient("localhost:8081", protocol="http")
response = client.call("/method", request, ResponseType)
```

**適合:** 只需調用一個服務的場景

### 場景 2: 多服務編排

```python
registry = ServiceRegistry()
registry.register("service1", "localhost:8081")
registry.register("service2", "localhost:8082")

# 調用多個服務
result1 = registry.call("service1", "/method1", req1, Res1)
result2 = registry.call("service2", "/method2", req2, Res2)
```

**適合:** 需要調用多個服務並組合結果的場景

### 場景 3: 協議無關的客戶端

```python
# 開發時使用 HTTP
client = ServiceClient("localhost:8081", protocol="auto")

# 生產環境切換到 gRPC，代碼無需修改
# 只需更改服務端口和協議
client = ServiceClient("localhost:50051", protocol="auto")
```

**適合:** 需要在不同環境使用不同協議的場景

## 🔧 進階用法

### 自訂 gRPC 方法名稱

```python
# 如果自動生成的方法名不正確，可以手動指定
response = client.call(
    path="/my_method",
    request=request,
    response_type=ResponseType,
    method_name="CustomMethodName"  # 手動指定
)
```

### 錯誤處理

```python
try:
    response = client.call("/method", request, ResponseType)
except Exception as e:
    print(f"調用失敗: {e}")
    # 處理錯誤
```

### 連接池管理 (未來功能)

```python
# 未來版本將支援連接池
client = ServiceClient(
    "localhost:8081",
    pool_size=10,
    timeout=30
)
```

## 📊 協議對比

| 特性 | HTTP | gRPC |
|------|------|------|
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 效能 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 串流支援 | ❌ | ✅ |
| 防火牆友好 | ✅ | ⚠️ |
| 除錯容易度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🧪 測試

運行完整示範：

```bash
# 啟動服務 (終端 1)
./quick_start.sh

# 運行示範 (終端 2)
python demo_client.py
```

運行單個測試：

```bash
python -c "
from service_client import ServiceClient
from generated.pose_detector_pb2 import DetectPoseRequest, DetectPoseResponse

client = ServiceClient('localhost:8081', protocol='http')
request = DetectPoseRequest(frame_id='test')
response = client.call('/detect_pose', request, DetectPoseResponse)
print(f'Success: {response.pose.head}')
"
```

## 💡 最佳實踐

1. **使用 ServiceRegistry 管理多個服務**
   ```python
   # 好的做法
   registry = ServiceRegistry()
   registry.register("detector", "localhost:8081")
   registry.register("classifier", "localhost:8082")
   ```

2. **使用 auto 協議進行開發**
   ```python
   # 靈活的做法
   client = ServiceClient("localhost:8081", protocol="auto")
   ```

3. **適當的錯誤處理**
   ```python
   try:
       response = client.call(...)
   except Exception as e:
       logger.error(f"Service call failed: {e}")
       # 降級處理或重試
   ```

4. **配置化服務地址**
   ```python
   # 從配置文件讀取
   import json
   config = json.load(open('config.json'))
   
   for service in config['services']:
       registry.register(
           service['name'],
           service['address'],
           protocol=service['protocol']
       )
   ```

## 🐛 故障排除

### 問題 1: "Connection refused"

**原因:** 服務未啟動

**解決:**
```bash
./quick_start.sh  # 啟動所有服務
```

### 問題 2: "Protocol detection failed"

**原因:** 服務未正確響應 /health 端點

**解決:**
```python
# 明確指定協議
client = ServiceClient("localhost:8081", protocol="http")
```

### 問題 3: gRPC 方法名錯誤

**原因:** 自動生成的方法名與服務不匹配

**解決:**
```python
# 手動指定方法名
response = client.call(
    path="/method",
    request=request,
    response_type=ResponseType,
    method_name="CorrectMethodName"
)
```

## 🔮 未來功能

- [ ] 連接池支援
- [ ] 自動重試機制
- [ ] 負載平衡
- [ ] 服務發現集成
- [ ] 監控和追蹤
- [ ] 非同步調用支援
- [ ] 串流 API 支援

## 📞 示範程式

查看 `demo_client.py` 了解完整的使用示範，包括：
- 簡單客戶端使用
- 服務註冊表使用
- 自動協議檢測
- HTTP vs gRPC 對比

## 📖 相關文檔

- [README.md](README.md) - 主要文檔
- [QUICKREF.md](QUICKREF.md) - 快速參考
- [ARCHITECTURE.txt](ARCHITECTURE.txt) - 系統架構
