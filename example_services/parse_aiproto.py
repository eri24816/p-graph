#!/usr/bin/env python3
"""
AIProto Parser - Parse .aiproto files to extract service configurations.

.aiproto format extends standard protobuf with service metadata:

service ServiceName {
    service_file = "service_filename"
    parent_path = "api/v1"
    path = "method_path"
    protocol = "http|grpc"
    port = 8080
    request = RequestMessage
    response = ResponseMessage
}
"""

import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ServiceConfig:
    """Service configuration extracted from .aiproto file."""
    name: str
    service_file: str
    parent_path: str
    path: str
    protocol: str
    port: int
    request: str
    response: str
    package: str
    proto_file: str


def parse_aiproto(file_path: Path) -> tuple[str, list[ServiceConfig]]:
    """
    Parse an .aiproto file and extract protobuf and service configurations.
    
    Returns:
        tuple: (protobuf_content, list of ServiceConfig)
    """
    content = file_path.read_text()
    
    # Extract package name
    package_match = re.search(r'package\s+([a-zA-Z0-9_.]+)\s*;', content)
    package = package_match.group(1) if package_match else ""
    
    # Extract protobuf content (everything before service definitions)
    proto_content = re.sub(r'#.*?service\s+\w+\s*{[^}]+}', '', content, flags=re.DOTALL)
    proto_content = re.sub(r'#[^\n]*\n', '', proto_content)  # Remove comment lines
    proto_content = proto_content.strip()
    
    # Extract service configurations
    services = []
    service_pattern = r'service\s+(\w+)\s*{([^}]+)}'
    
    for match in re.finditer(service_pattern, content):
        service_name = match.group(1)
        service_body = match.group(2)
        
        # Parse service attributes
        attrs = {}
        for line in service_body.split('\n'):
            line = line.strip()
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                attrs[key] = value
        
        # Create service config
        config = ServiceConfig(
            name=service_name,
            service_file=attrs.get('service_file', f'{service_name.lower()}_service'),
            parent_path=attrs.get('parent_path', 'api/v1'),
            path=attrs.get('path', service_name.lower()),
            protocol=attrs.get('protocol', 'http'),
            port=int(attrs.get('port', '8080')),
            request=attrs.get('request', ''),
            response=attrs.get('response', ''),
            package=package,
            proto_file=file_path.stem
        )
        services.append(config)
    
    return proto_content, services


def generate_proto_file(proto_content: str, output_path: Path) -> None:
    """Generate standard .proto file from aiproto content."""
    output_path.write_text(proto_content)
    print(f"✓ Generated proto: {output_path}")


def generate_service_file(config: ServiceConfig, output_dir: Path, generated_dir: str = "generated") -> None:
    """Generate Python service file from service configuration."""
    
    # Convert package name for imports
    pb2_module = f"{config.proto_file}_pb2"
    
    # Import path handling - use relative import with sys.path
    template = f'''"""Auto-generated service: {config.name}"""

import sys
from pathlib import Path

# Add parent directory to path to import generated modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from aip_service_kit import App
from generated.{pb2_module} import (
    {config.request},
    {config.response},
)

app = App()

@app.router.route("/{config.path}")
def {config.path}(request: {config.request}) -> {config.response}:
    """
    Handler for {config.name} service.
    
    TODO: Implement your service logic here.
    """
    print(f"[{config.name}] Received request: {{request}}")
    
    # TODO: Implement service logic
    response = {config.response}()
    
    return response


if __name__ == "__main__":
    # Run service with {config.protocol} protocol on port {config.port}
    app.run(protocol="{config.protocol}", port={config.port})
'''
    
    output_path = output_dir / f"{config.service_file}.py"
    output_path.write_text(template)
    print(f"✓ Generated service: {output_path}")


def main():
    """Main function to process .aiproto files."""
    if len(sys.argv) < 2:
        print("Usage: python parse_aiproto.py <aiproto_file> [output_dir]")
        print("Example: python parse_aiproto.py proto/pose_detector.aiproto")
        sys.exit(1)
    
    aiproto_file = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".")
    
    if not aiproto_file.exists():
        print(f"Error: File not found: {aiproto_file}")
        sys.exit(1)
    
    print(f"\n🔧 Processing {aiproto_file}...")
    
    # Parse aiproto file
    proto_content, services = parse_aiproto(aiproto_file)
    
    # Generate standard .proto file
    proto_output = output_dir / "proto" / f"{aiproto_file.stem}.proto"
    proto_output.parent.mkdir(parents=True, exist_ok=True)
    generate_proto_file(proto_content, proto_output)
    
    # Generate service files
    services_dir = output_dir / "services"
    services_dir.mkdir(parents=True, exist_ok=True)
    
    for service in services:
        generate_service_file(service, services_dir, "../generated")
    
    print(f"\n✅ Successfully processed {len(services)} service(s) from {aiproto_file.name}\n")
    
    # Print summary
    print("📋 Summary:")
    for service in services:
        print(f"  • {service.name}")
        print(f"    - File: {service.service_file}.py")
        print(f"    - Protocol: {service.protocol}")
        print(f"    - Port: {service.port}")
        print(f"    - Path: /{service.path}")


if __name__ == "__main__":
    main()
