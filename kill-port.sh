#!/bin/bash

# Check if port is provided as an argument
if [ -z "$1" ]; then
    echo "Usage: ./kill-port.sh <port_number>"
    echo "Example: ./kill-port.sh 5000"
    exit 1
fi

PORT=$1
echo "Looking for processes on port $PORT..."

# Find process ID using the port
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
    echo "No process found running on port $PORT"
    exit 0
else
    echo "Found process $PID on port $PORT"
    echo "Attempting to terminate process gracefully (SIGTERM)..."
    kill -15 $PID
    
    # Wait a moment and check if process is still running
    sleep 1
    if kill -0 $PID 2>/dev/null; then
        echo "Process still running. Forcing termination (SIGKILL)..."
        kill -9 $PID
        echo "Process $PID forcefully terminated"
    else
        echo "Process $PID terminated successfully"
    fi
fi

# Check if any processes are still using the port
STILL_RUNNING=$(lsof -ti:$PORT)
if [ -n "$STILL_RUNNING" ]; then
    echo "Warning: Port $PORT is still in use by process $STILL_RUNNING"
else
    echo "Port $PORT is now free"
fi 