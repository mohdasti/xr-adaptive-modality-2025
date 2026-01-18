#!/bin/bash
# Quick script to check CPU usage and available cores

echo "=========================================="
echo "CPU and Process Information"
echo "=========================================="
echo ""

# Check CPU cores
echo "Available CPU cores:"
nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "Could not determine"
echo ""

# Check if LBA process is running
echo "LBA Analysis Process:"
LBA_PID=$(pgrep -f "lba.py" | head -1)
if [ -n "$LBA_PID" ]; then
    echo "  Process ID: $LBA_PID"
    echo ""
    echo "  CPU Usage:"
    ps -p $LBA_PID -o %cpu,pcpu,cmd --no-headers 2>/dev/null || top -b -n 1 -p $LBA_PID 2>/dev/null | tail -1
    echo ""
    echo "  Memory Usage:"
    ps -p $LBA_PID -o %mem,rss,vsz,cmd --no-headers 2>/dev/null
    echo ""
    echo "  Threads:"
    ps -p $LBA_PID -o nlwp,cmd --no-headers 2>/dev/null || ps -p $LBA_PID -L | wc -l
    echo ""
    echo "  All Python processes:"
    ps aux | grep python | grep -v grep | head -5
else
    echo "  No LBA process found running"
fi

echo ""
echo "System Load Average:"
uptime

echo ""
echo "CPU Usage (top 5 processes):"
ps aux --sort=-%cpu | head -6
