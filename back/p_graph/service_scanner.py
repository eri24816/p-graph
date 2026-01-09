import os
import re

class ServiceScanner:
    def __init__(self, root_path):
        self.root_path = root_path

    def scan_services(self):
        services = []
        # Walk through the directory to find .proto and .aiproto files
        for root, dirs, files in os.walk(self.root_path):
            for file in files:
                if file.endswith(".aiproto"):
                    full_path = os.path.join(root, file)
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        
                    # Parse local messages first to build a type map
                    messages = self.parse_messages(content)
                    
                    found_services = self.parse_service_definitions(content, messages)
                    services.extend(found_services)
        return services

    def parse_messages(self, content):
        """
        Simple regex-based message parser.
        Returns a dict: { "MessageName": { "field_name": "field_type", ... } }
        """
        messages = {}
        # Regex to find message blocks: message Name { ... }
        # This is a basic parser and might not handle nested braces correctly if complex.
        # Assuming standard formatting for now as per examples.
        message_pattern = re.compile(r'message\s+(\w+)\s*{([^}]*)}', re.MULTILINE | re.DOTALL)
        
        for match in message_pattern.finditer(content):
            msg_name = match.group(1)
            body = match.group(2)
            fields = {}
            
            # Parse fields: type name = id;
            # e.g. string frame_id = 1;
            # e.g. pose.PoseReading pose = 1;
            field_pattern = re.compile(r'\s*([\w\.]+)\s+(\w+)\s*=\s*\d+\s*;')
            for field_match in field_pattern.finditer(body):
                field_type = field_match.group(1)
                field_name = field_match.group(2)
                fields[field_name] = field_type
            
            messages[msg_name] = fields
            
        return messages

    def parse_service_definitions(self, content, messages):
        """
        Parses the custom service definition format in .aiproto
        service Name {
            key = "value"
            ...
        }
        """
        services = []
        # Regex for service block
        service_pattern = re.compile(r'service\s+(\w+)\s*{([^}]*)}', re.MULTILINE | re.DOTALL)
        
        for match in service_pattern.finditer(content):
            service_name = match.group(1)
            body = match.group(2)
            
            # defaults
            service_info = {
                "name": service_name,
                "path": "",
                "protocol": "grpc",
                "python_path": None,  # Will be populated if service_file or python_path is present
                "request": {},
                "response": {},
                "input_fields": {},
                "output_fields": {},
            }
            
            # Parse properties: key = value or key = identifier
            prop_pattern = re.compile(r'^\s*(\w+)\s*=\s*(?:"([^"]*)"|(\w+))', re.MULTILINE)
            
            request_type_name = None
            response_type_name = None
            
            for prop_match in prop_pattern.finditer(body):
                key = prop_match.group(1)
                val_str = prop_match.group(2)
                val_id = prop_match.group(3)
                value = val_str if val_str is not None else val_id
                
                if key == "request":
                    request_type_name = value
                elif key == "response":
                    response_type_name = value
                else:
                    service_info[key] = value
            
            # Resolve request/response types to fields
            if request_type_name and request_type_name in messages:
                service_info["request"] = messages[request_type_name]
                service_info["input_fields"] = messages[request_type_name]
            
            if response_type_name and response_type_name in messages:
                service_info["response"] = messages[response_type_name]
                service_info["output_fields"] = messages[response_type_name]
                
            services.append(service_info)
            
        return services
