#!/bin/bash

# stop.sh - Stop services running on specified ports

if [ $# -eq 0 ]; then
    echo "Usage: ./stop.sh <port1> [port2] [port3] ..."
    echo "Example: ./stop.sh 8081 8082"
    exit 1
fi

echo "🛑 Stopping services on specified ports..."
echo ""

for port in "$@"; do
    echo "Checking port $port..."
    
    # Find process using the port (macOS compatible)
    PID=$(lsof -ti:$port)
    
    if [ -z "$PID" ]; then
        echo "  ℹ️  No process found on port $port"
    else
        echo "  ⚠️  Found process $PID on port $port"
        kill -9 $PID 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "  ✅ Successfully stopped process $PID"
        else
            echo "  ❌ Failed to stop process $PID (may need sudo)"
        fi
    fi
    echo ""
done

echo "✅ Done!"
