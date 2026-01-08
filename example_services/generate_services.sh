#!/bin/bash

# generate_services.sh - Automatically generate services from .aiproto files
# This script processes .aiproto files to generate:
# 1. Standard .proto files
# 2. Python protobuf bindings (_pb2.py)
# 3. Service template files

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROTO_DIR="${SCRIPT_DIR}/proto"
GENERATED_DIR="${SCRIPT_DIR}/generated"
SERVICES_DIR="${SCRIPT_DIR}/services"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   AI Proto Service Generator${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Error: python3 not found${NC}"
    exit 1
fi

# Check if protoc is available
if ! command -v protoc &> /dev/null; then
    echo -e "${YELLOW}Warning: protoc not found. Installing grpcio-tools...${NC}"
    pip install grpcio-tools
fi

# Create necessary directories
mkdir -p "${GENERATED_DIR}"
mkdir -p "${SERVICES_DIR}"

# Step 1: Process all .aiproto files
echo -e "${GREEN}[1/3] Processing .aiproto files...${NC}"
for aiproto_file in "${PROTO_DIR}"/*.aiproto; do
    if [ -f "$aiproto_file" ]; then
        echo "  → $(basename "$aiproto_file")"
        python3 "${SCRIPT_DIR}/parse_aiproto.py" "$aiproto_file" "${SCRIPT_DIR}"
    fi
done
echo ""

# Step 2: Generate Python protobuf bindings
echo -e "${GREEN}[2/3] Generating Python protobuf bindings...${NC}"
for proto_file in "${PROTO_DIR}"/*.proto; do
    if [ -f "$proto_file" ]; then
        echo "  → $(basename "$proto_file")"
        python3 -m grpc_tools.protoc \
            -I"${PROTO_DIR}" \
            --python_out="${GENERATED_DIR}" \
            --pyi_out="${GENERATED_DIR}" \
            "$proto_file"
    fi
done
echo ""

# Create __init__.py in generated directory
touch "${GENERATED_DIR}/__init__.py"
cat <<EOF > "${GENERATED_DIR}/__init__.py"
# add the current directory to the python path
import sys
sys.path.append(__path__[0])
EOF

# Step 3: Summary
echo -e "${GREEN}[3/3] Generation complete!${NC}"
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "📁 Generated files:"
echo "  • Proto files:    ${PROTO_DIR}/"
echo "  • Python modules: ${GENERATED_DIR}/"
echo "  • Services:       ${SERVICES_DIR}/"
echo ""
echo "🚀 Next steps:"
echo "  1. Implement service logic in ${SERVICES_DIR}/*.py"
echo "  2. Run a service:"
echo "     python ${SERVICES_DIR}/pose_detector_service.py"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
