---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

<!-- Provide a clear and concise description of what the bug is -->

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Enable '...'
4. Complete trial '...'
5. See error

## Expected Behavior

<!-- What you expected to happen -->

## Actual Behavior

<!-- What actually happened -->

## Environment

- **Browser**: [e.g., Chrome 120, Firefox 121]
- **OS**: [e.g., macOS 14.2, Windows 11]
- **Screen Resolution**: [e.g., 1920x1080]
- **App Version**: [e.g., main branch, commit hash]

## Modality & Settings

- **Modality**: [ ] Hand-like  [ ] Gaze-like
- **Dwell Time**: [ ] Space  [ ] 350ms  [ ] 500ms
- **Pressure Mode**: [ ] ON  [ ] OFF
- **Aging Proxy**: [ ] ON  [ ] OFF
- **Pupil Proxy**: [ ] ON  [ ] OFF

## CSV Data (if applicable)

<!-- If the issue relates to data logging, paste a relevant snippet here -->
<!-- Use the code block to preserve CSV formatting -->
```
pid,ts,block,trial,modality,ui_mode,pressure,aging,ID,A,W,target_x,target_y,rt_ms,correct,err_type
P001,1698765432100,1,1,gaze,standard,1.0,false,3.17,200,50,300,200,450,true,,
P001,1698765432200,1,2,gaze,standard,1.0,false,3.17,200,50,400,300,,false,timeout,
```

## Console Logs

<!-- Open browser console (F12) and copy any error messages -->
<details>
<summary>Browser Console Logs</summary>

```
Paste console logs here
```

</details>

## Screenshots

<!-- If applicable, add screenshots to help explain the problem -->

## Additional Context

<!-- Add any other context about the problem here -->
<!-- - Related issues? -->
<!-- - Workarounds? -->
<!-- - Expected timeline? -->

## Checklist

- [ ] Bug is reproducible consistently
- [ ] Console logs captured (if any errors)
- [ ] Steps to reproduce are clear and testable
- [ ] CSV data included (if applicable)
- [ ] Modality/settings specified

