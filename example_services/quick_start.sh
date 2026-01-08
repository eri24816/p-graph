#!/bin/bash

# Quick Start Script - Test the generated services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  AIProto Quick Start"
echo "=========================================="
echo ""

# Check if services are already generated
if [ ! -d "${SCRIPT_DIR}/generated" ] || [ ! -d "${SCRIPT_DIR}/services" ]; then
    echo "📦 Generating services for the first time..."
    "${SCRIPT_DIR}/generate_services.sh"
    echo ""
fi

echo "🚀 Starting services..."
echo ""
echo "This will start:"
echo "  1. Pose Detector Service (port 8081)"
echo "  2. Pose Classifier Service (port 8082)"
echo "  3. Test Client"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""
sleep 2

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $DETECTOR_PID $CLASSIFIER_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start detector service in background
echo "▶️  Starting Pose Detector Service..."
python3 "${SCRIPT_DIR}/services/pose_detector_service_impl.py" &
DETECTOR_PID=$!
sleep 2

# Start classifier service in background
echo "▶️  Starting Pose Classifier Service..."
python3 "${SCRIPT_DIR}/services/pose_classifier_service_impl.py" &
CLASSIFIER_PID=$!
sleep 2

# Run test client
echo ""
echo "▶️  Running Test Client..."
echo ""
python3 "${SCRIPT_DIR}/test_client.py"

# Keep services running
echo ""
echo "Services are running. Press Ctrl+C to stop."
wait
