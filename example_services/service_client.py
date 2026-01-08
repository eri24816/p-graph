"""
Universal Service Client - 通用服務客戶端

支援自動檢測和使用 HTTP 或 gRPC 協議連接服務。
使用者只需指定服務地址和方法，不需要關心底層協議。

使用範例:
    from service_client import ServiceClient
    
    # 創建客戶端
    client = ServiceClient("localhost:8081", protocol="http")
    
    # 調用服務
    response = client.call("/detect_pose", request, ResponseType)
"""

from typing import Type, TypeVar, Optional
from enum import Enum
import grpc
import requests
from google.protobuf.message import Message


T = TypeVar('T', bound=Message)


class Protocol(Enum):
    """支援的協議類型"""
    HTTP = "http"
    GRPC = "grpc"
    AUTO = "auto"


class ServiceClient:
    """
    通用服務客戶端，支援 HTTP 和 gRPC 協議。
    
    Attributes:
        address: 服務地址 (例如: "localhost:8081")
        protocol: 使用的協議 (http, grpc, 或 auto)
    """
    
    def __init__(
        self,
        address: str,
        protocol: str = "auto",
        service_name: str = "DynamicService"
    ):
        """
        初始化服務客戶端。
        
        Args:
            address: 服務地址，格式為 "host:port"
            protocol: 協議類型 ("http", "grpc", 或 "auto")
            service_name: gRPC 服務名稱 (預設: "DynamicService")
        """
        self.address = address
        self.service_name = service_name
        
        if protocol == "auto":
            self.protocol = self._detect_protocol()
        else:
            self.protocol = Protocol(protocol)
    
    def _detect_protocol(self) -> Protocol:
        """
        自動檢測服務使用的協議。
        
        首先嘗試 HTTP，如果失敗則嘗試 gRPC。
        """
        # 嘗試 HTTP
        try:
            response = requests.get(f"http://{self.address}/health", timeout=1)
            if response.status_code == 200:
                return Protocol.HTTP
        except:
            pass
        
        # 預設使用 gRPC
        return Protocol.GRPC
    
    def call(
        self,
        path: str,
        request: Message,
        response_type: Type[T],
        method_name: Optional[str] = None
    ) -> T:
        """
        調用服務方法。
        
        Args:
            path: 方法路徑 (例如: "/detect_pose")
            request: 請求訊息 (protobuf Message)
            response_type: 響應訊息類型
            method_name: gRPC 方法名稱 (可選，會從 path 自動生成)
        
        Returns:
            響應訊息
        
        Raises:
            Exception: 調用失敗時拋出異常
        """
        if self.protocol == Protocol.HTTP:
            return self._call_http(path, request, response_type)
        elif self.protocol == Protocol.GRPC:
            return self._call_grpc(path, request, response_type, method_name)
        else:
            raise ValueError(f"Unsupported protocol: {self.protocol}")
    
    def _call_http(
        self,
        path: str,
        request: Message,
        response_type: Type[T]
    ) -> T:
        """使用 HTTP 協議調用服務"""
        url = f"http://{self.address}{path}"
        
        response = requests.post(
            url,
            data=request.SerializeToString(),
            headers={"Content-Type": "application/x-protobuf"}
        )
        
        if response.status_code == 200:
            result = response_type()
            result.ParseFromString(response.content)
            return result
        else:
            raise Exception(
                f"HTTP request failed: {response.status_code} - {response.text}"
            )
    
    def _call_grpc(
        self,
        path: str,
        request: Message,
        response_type: Type[T],
        method_name: Optional[str] = None
    ) -> T:
        """使用 gRPC 協議調用服務"""
        # 如果沒有提供 method_name，從 path 自動生成
        # 例如: "/detect_pose" -> "DetectPose"
        if method_name is None:
            method_name = self._path_to_method_name(path)
        
        # 構建完整的 gRPC 方法路徑
        grpc_method = f"/{self.service_name}/{method_name}"
        
        with grpc.insecure_channel(self.address) as channel:
            try:
                response = channel.unary_unary(
                    grpc_method,
                    request_serializer=request.SerializeToString,
                    response_deserializer=response_type.FromString,
                )(request)
                return response
            except grpc.RpcError as e:
                raise Exception(
                    f"gRPC request failed: {e.code()} - {e.details()}"
                )
    
    @staticmethod
    def _path_to_method_name(path: str) -> str:
        """
        將路徑轉換為 gRPC 方法名稱。
        
        例如:
            "/detect_pose" -> "DetectPose"
            "/classify_pose" -> "ClassifyPose"
        """
        # 移除開頭的 '/' 並轉換為駝峰式
        clean_path = path.strip('/')
        parts = clean_path.split('_')
        return ''.join(word.capitalize() for word in parts)
    
    def __repr__(self) -> str:
        return f"ServiceClient(address='{self.address}', protocol={self.protocol.value})"


class ServiceRegistry:
    """
    服務註冊表，管理多個服務客戶端。
    
    使用範例:
        registry = ServiceRegistry()
        registry.register("detector", "localhost:8081", protocol="http")
        registry.register("classifier", "localhost:8082", protocol="grpc")
        
        response = registry.call("detector", "/detect_pose", request, ResponseType)
    """
    
    def __init__(self):
        self._clients: dict[str, ServiceClient] = {}
    
    def register(
        self,
        name: str,
        address: str,
        protocol: str = "auto",
        service_name: str = "DynamicService"
    ) -> ServiceClient:
        """
        註冊一個服務。
        
        Args:
            name: 服務名稱
            address: 服務地址
            protocol: 協議類型
            service_name: gRPC 服務名稱
        
        Returns:
            創建的 ServiceClient 實例
        """
        client = ServiceClient(address, protocol, service_name)
        self._clients[name] = client
        return client
    
    def get(self, name: str) -> ServiceClient:
        """獲取已註冊的服務客戶端"""
        if name not in self._clients:
            raise KeyError(f"Service '{name}' not registered")
        return self._clients[name]
    
    def call(
        self,
        service_name: str,
        path: str,
        request: Message,
        response_type: Type[T],
        method_name: Optional[str] = None
    ) -> T:
        """調用已註冊的服務"""
        client = self.get(service_name)
        return client.call(path, request, response_type, method_name)
    
    def list_services(self) -> list[str]:
        """列出所有已註冊的服務"""
        return list(self._clients.keys())
    
    def __repr__(self) -> str:
        services = ', '.join(f"{name}({client.protocol.value})" 
                            for name, client in self._clients.items())
        return f"ServiceRegistry([{services}])"
