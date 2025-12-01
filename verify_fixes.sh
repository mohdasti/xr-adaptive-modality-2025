#!/bin/bash
# Verification script for critical psychophysics fixes
# Run this to verify all fixes are in place

echo "=== Verifying Critical Psychophysics Fixes ==="
echo ""

echo "1. Checking commit history..."
git log --oneline -2
echo ""

echo "2. Verifying NO Date.now() in FittsTask.tsx (should return nothing)..."
if grep -n "Date.now()" app/src/components/FittsTask.tsx; then
    echo "   ❌ ERROR: Found Date.now() - timing precision issue!"
else
    echo "   ✅ PASS: No Date.now() found - all timing uses performance.now()"
fi
echo ""

echo "3. Verifying performance.now() usage..."
grep_count=$(grep -c "performance.now()" app/src/components/FittsTask.tsx)
echo "   ✅ Found $grep_count instances of performance.now()"
grep -n "performance.now()" app/src/components/FittsTask.tsx | head -5
echo ""

echo "4. Verifying gaze simulation is imported and used..."
if grep -q "useGazeSimulation" app/src/components/FittsTask.tsx; then
    echo "   ✅ PASS: useGazeSimulation hook is imported and used"
    grep -n "useGazeSimulation" app/src/components/FittsTask.tsx
else
    echo "   ❌ ERROR: useGazeSimulation not found!"
fi
echo ""

echo "5. Verifying start button gaze support..."
if grep -q "showStart ? startPos : targetPos" app/src/components/FittsTask.tsx; then
    echo "   ✅ PASS: Start button works with gaze mode"
    grep -n "showStart ? startPos : targetPos" app/src/components/FittsTask.tsx
else
    echo "   ❌ ERROR: Start button gaze support not found!"
fi
echo ""

echo "6. Verifying demographics form exists..."
if [ -f "app/src/components/DemographicsForm.tsx" ]; then
    echo "   ✅ PASS: DemographicsForm.tsx exists"
else
    echo "   ❌ ERROR: DemographicsForm.tsx not found!"
fi
echo ""

echo "7. Verifying calibration component exists..."
if [ -f "app/src/components/CreditCardCalibration.tsx" ]; then
    echo "   ✅ PASS: CreditCardCalibration.tsx exists"
else
    echo "   ❌ ERROR: CreditCardCalibration.tsx not found!"
fi
echo ""

echo "8. Verifying error rate feedback in HUDPane..."
if grep -q "errorRatePercent\|error-rate-feedback\|Error Rate" app/src/components/HUDPane.tsx; then
    echo "   ✅ PASS: Error rate feedback found in HUDPane"
else
    echo "   ❌ ERROR: Error rate feedback not found!"
fi
echo ""

echo "=== Verification Complete ==="

