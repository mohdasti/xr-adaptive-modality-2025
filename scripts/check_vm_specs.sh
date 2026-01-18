#!/bin/bash
# Check VM specifications

echo "=========================================="
echo "Virtual Machine Specifications"
echo "=========================================="
echo ""

echo "CPU Information:"
echo "  Cores (logical): $(nproc)"
if [ -f /proc/cpuinfo ]; then
    echo "  Physical cores: $(grep -c ^processor /proc/cpuinfo)"
    echo "  CPU model: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
    echo "  CPU frequency: $(grep 'cpu MHz' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs) MHz"
fi
echo ""

echo "Memory Information:"
if [ -f /proc/meminfo ]; then
    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024))
    AVAIL_MEM=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    AVAIL_MEM_GB=$((AVAIL_MEM / 1024 / 1024))
    echo "  Total RAM: ${TOTAL_MEM_GB} GB"
    echo "  Available RAM: ${AVAIL_MEM_GB} GB"
else
    free -h 2>/dev/null || echo "  Could not determine memory"
fi
echo ""

echo "GCP Instance Information (if available):"
if [ -f /sys/class/dmi/id/product_name ]; then
    echo "  Product: $(cat /sys/class/dmi/id/product_name)"
fi
if curl -s -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/machine-type > /dev/null 2>&1; then
    MACHINE_TYPE=$(curl -s -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/machine-type)
    echo "  Machine Type: $MACHINE_TYPE"
    ZONE=$(curl -s -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/zone)
    echo "  Zone: $ZONE"
fi
echo ""

echo "Current Load:"
uptime
echo ""

echo "Python Process Information:"
LBA_PID=$(pgrep -f "lba.py" | head -1)
if [ -n "$LBA_PID" ]; then
    echo "  LBA Process PID: $LBA_PID"
    ps -p $LBA_PID -o pid,%cpu,%mem,rss,vsz,nlwp,cmd --no-headers 2>/dev/null | awk '{print "  CPU: "$2"% | Memory: "$3"% ("$4/1024"MB) | Threads: "$6}'
    echo ""
    echo "  All Python processes:"
    ps aux | grep python | grep -v grep | awk '{printf "  PID %s: CPU %s%% | MEM %s%%\n", $2, $3, $4}'
else
    echo "  No LBA process running"
fi
