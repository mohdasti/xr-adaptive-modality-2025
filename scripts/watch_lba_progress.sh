#!/bin/bash
# Watch for LBA trace file and check progress

TRACE_FILE="analysis/results/lba_trace.nc"

echo "Watching for trace file: $TRACE_FILE"
echo "Press Ctrl+C to stop"
echo ""

# Check if trace file exists
if [ -f "$TRACE_FILE" ]; then
    echo "✓ Trace file found! Checking progress..."
    echo ""
    python3 scripts/check_lba_progress.py
    exit 0
fi

# Watch for file to appear
echo "Waiting for warmup to complete..."
echo ""

while [ ! -f "$TRACE_FILE" ]; do
    # Check if process is still running
    if ! pgrep -f "lba.py" > /dev/null; then
        echo "⚠ LBA process stopped!"
        echo "Check for errors or completion"
        exit 1
    fi
    
    # Show status
    echo -ne "\r[$(date '+%H:%M:%S')] Still in warmup... (process running)"
    sleep 10
done

echo ""
echo ""
echo "✓ Trace file appeared! Warmup complete, sampling started."
echo ""
python3 scripts/check_lba_progress.py
