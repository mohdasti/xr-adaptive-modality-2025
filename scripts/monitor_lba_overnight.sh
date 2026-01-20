#!/bin/bash
# Monitor LBA analysis progress overnight
# Run this and let it log progress every 5 minutes

LOG_FILE="lba_monitor_$(date +%Y%m%d_%H%M%S).log"

echo "==========================================" | tee -a "$LOG_FILE"
echo "LBA Analysis Overnight Monitor" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
echo ""

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "" | tee -a "$LOG_FILE"
    echo "[$TIMESTAMP] Status Check" | tee -a "$LOG_FILE"
    echo "----------------------------------------" | tee -a "$LOG_FILE"
    
    # Check if process is running
    LBA_PIDS=$(pgrep -f "lba.py")
    if [ -z "$LBA_PIDS" ]; then
        echo "❌ Process stopped!" | tee -a "$LOG_FILE"
        echo "Check results in: analysis/results/" | tee -a "$LOG_FILE"
        break
    fi
    
    # Count processes
    NUM_PROCS=$(echo "$LBA_PIDS" | wc -l)
    echo "✓ Running: $NUM_PROCS process(es)" | tee -a "$LOG_FILE"
    
    # Get main process info
    MAIN_PID=$(echo "$LBA_PIDS" | head -1)
    if [ -n "$MAIN_PID" ]; then
        CPU_MEM=$(ps -p $MAIN_PID -o %cpu,%mem,rss,etime --no-headers 2>/dev/null)
        if [ -n "$CPU_MEM" ]; then
            echo "$CPU_MEM" | awk '{printf "  Main process: CPU %s%% | Memory %s%% (%d MB) | Runtime: %s\n", $1, $2, $3/1024, $4}' | tee -a "$LOG_FILE"
        fi
    fi
    
    # Check output files
    if [ -f "analysis/results/lba_trace.nc" ]; then
        FILE_SIZE=$(du -h analysis/results/lba_trace.nc | cut -f1)
        FILE_TIME=$(stat -c %y analysis/results/lba_trace.nc 2>/dev/null || stat -f '%Sm' analysis/results/lba_trace.nc 2>/dev/null)
        echo "  ✓ lba_trace.nc: $FILE_SIZE (modified: $FILE_TIME)" | tee -a "$LOG_FILE"
    else
        echo "  ⚠ Still in warmup phase (no output files yet)" | tee -a "$LOG_FILE"
    fi
    
    # System load
    LOAD=$(uptime | awk -F'load average:' '{print $2}')
    echo "  System load:$LOAD" | tee -a "$LOG_FILE"
    
    # Wait 5 minutes before next check
    echo "Next check in 5 minutes..." | tee -a "$LOG_FILE"
    sleep 300
done

echo "" | tee -a "$LOG_FILE"
echo "Monitoring stopped at: $(date)" | tee -a "$LOG_FILE"
