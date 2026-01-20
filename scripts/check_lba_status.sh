#!/bin/bash
# Check if LBA analysis is still running

echo "=========================================="
echo "LBA Analysis Status Check"
echo "=========================================="
echo ""

# Check if process is running
LBA_PIDS=$(pgrep -f "lba.py")
if [ -z "$LBA_PIDS" ]; then
    echo "❌ LBA analysis is NOT running"
    echo ""
    echo "Checking for completed results..."
    if [ -f "analysis/results/lba_parameters.json" ]; then
        echo "✓ Found results file: analysis/results/lba_parameters.json"
        echo "  Last modified: $(stat -c %y analysis/results/lba_parameters.json 2>/dev/null || stat -f '%Sm' analysis/results/lba_parameters.json 2>/dev/null)"
    fi
    exit 1
fi

echo "✓ LBA analysis IS running"
echo ""

# Show process details
echo "Process Information:"
for PID in $LBA_PIDS; do
    ps -p $PID -o pid,%cpu,%mem,rss,etime,cmd --no-headers 2>/dev/null | awk '{
        printf "  PID: %s | CPU: %s%% | Memory: %s%% (%s MB) | Runtime: %s\n", $1, $2, $3, $4/1024, $5
    }'
done
echo ""

# Check output files
echo "Output Files Status:"
if [ -f "analysis/results/lba_trace.nc" ]; then
    FILE_SIZE=$(du -h analysis/results/lba_trace.nc | cut -f1)
    LAST_MOD=$(stat -c %y analysis/results/lba_trace.nc 2>/dev/null || stat -f '%Sm' analysis/results/lba_trace.nc 2>/dev/null)
    echo "  ✓ lba_trace.nc exists (${FILE_SIZE}, last modified: ${LAST_MOD})"
else
    echo "  ⚠ lba_trace.nc not created yet"
fi

if [ -f "analysis/results/lba_parameters.json" ]; then
    FILE_SIZE=$(du -h analysis/results/lba_parameters.json | cut -f1)
    LAST_MOD=$(stat -c %y analysis/results/lba_parameters.json 2>/dev/null || stat -f '%Sm' analysis/results/lba_parameters.json 2>/dev/null)
    echo "  ✓ lba_parameters.json exists (${FILE_SIZE}, last modified: ${LAST_MOD})"
else
    echo "  ⚠ lba_parameters.json not created yet (will be created at end)"
fi
echo ""

# Check system resources
echo "System Resources:"
echo "  CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "  Available Memory: $(free -h 2>/dev/null | grep Mem | awk '{print $7}' || echo 'N/A')"
echo ""

# Check if process is actually using CPU (not stuck)
MAIN_PID=$(echo $LBA_PIDS | awk '{print $1}')
CPU_USAGE=$(ps -p $MAIN_PID -o %cpu --no-headers 2>/dev/null | xargs)
if [ -n "$CPU_USAGE" ]; then
    CPU_FLOAT=$(echo $CPU_USAGE | sed 's/%//')
    if (( $(echo "$CPU_FLOAT > 1.0" | bc -l 2>/dev/null || echo "0") )); then
        echo "✓ Process is actively using CPU (${CPU_USAGE})"
    else
        echo "⚠ Process CPU usage is low (${CPU_USAGE}) - may be stuck or waiting"
    fi
fi

echo ""
echo "To monitor continuously, run: watch -n 5 ./scripts/check_lba_status.sh"
echo "Or check logs if running with nohup: tail -f lba_analysis.log"
