# Participant-Specific Links Guide

## Overview
Generate custom links for each participant with pre-configured counterbalanced sequences.

## Implementation

### Option 1: URL Parameters (Simplest)

**Link Format:**
```
https://your-experiment.com/?pid=P001&sequence=3
```

**Code:** Already implemented in `counterbalance.ts` - the participant index is stored in localStorage, but you can override it via URL.

### Option 2: Custom Routes (More Professional)

**Link Format:**
```
https://your-experiment.com/participant/P001/sequence/3
```

**Implementation Needed:**
1. Add route in `app/src/main.tsx` or router config
2. Extract participant ID and sequence from URL
3. Initialize logger and block sequence accordingly

### Current Behavior

Currently, the app:
1. Prompts for Participant ID on first load
2. Stores it in localStorage
3. Prompts for Participant Index (0-99) for counterbalancing
4. Generates sequence based on index

### Recommended Approach

**For each participant:**
1. Assign a Participant ID (e.g., P001, P002, etc.)
2. Assign a sequence index (0-99) based on your counterbalancing scheme
3. Generate link: `https://your-experiment.com/?pid=P001&sequence=3`

**Modify `TaskPane.tsx` to read from URL:**

```typescript
// In TaskPane.tsx, modify the initialization useEffect:
useEffect(() => {
  // Check URL parameters first
  const params = new URLSearchParams(window.location.search)
  const urlPid = params.get('pid')
  const urlSequence = params.get('sequence')
  
  // Use URL params if provided, otherwise prompt
  const participantId = urlPid || prompt('Enter Participant ID:')
  const sequenceIndex = urlSequence 
    ? parseInt(urlSequence, 10) 
    : (() => {
        const stored = localStorage.getItem('participantIndex')
        if (stored) return parseInt(stored, 10)
        const input = prompt('Enter Participant Index (0-99) for counterbalancing:')
        return input ? parseInt(input, 10) : 0
      })()
  
  if (participantId) {
    localStorage.setItem('participantIndex', String(sequenceIndex))
    const sequence = sequenceForParticipant(sequenceIndex)
    setBlockSequence(sequence)
  }
}, [])
```

**And modify `LoggerPane.tsx` to use URL participant ID:**

```typescript
// In LoggerPane.tsx, modify initialization:
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const urlPid = params.get('pid')
  const pid = urlPid || prompt('Enter Participant ID (or leave blank for auto-generated):')
  initLogger(pid || undefined)
}, [])
```

## Generating Links

### Manual Method
Create a spreadsheet with:
- Participant ID
- Sequence Index
- Generated Link

### Automated Script
```javascript
// generate-links.js
const baseUrl = 'https://your-experiment.com'
const participants = Array.from({ length: 100 }, (_, i) => ({
  id: `P${String(i + 1).padStart(3, '0')}`,
  sequence: i
}))

participants.forEach(p => {
  console.log(`${p.id}: ${baseUrl}/?pid=${p.id}&sequence=${p.sequence}`)
})
```

## Best Practices

1. **Use consistent Participant IDs**: P001, P002, etc.
2. **Document sequence assignments**: Keep a master list of which participant gets which sequence
3. **Test links before sending**: Verify each link works
4. **Include instructions**: Tell participants not to share their link
5. **Track completion**: Monitor which participants have completed

## Security Considerations

- URL parameters are visible in browser history
- Consider using tokens instead of sequential IDs for anonymity
- Don't include sensitive information in URLs
- Use HTTPS for all links

## Example Participant List

| Participant ID | Sequence | Link |
|----------------|----------|------|
| P001 | 0 | `https://exp.com/?pid=P001&sequence=0` |
| P002 | 1 | `https://exp.com/?pid=P002&sequence=1` |
| P003 | 2 | `https://exp.com/?pid=P003&sequence=2` |
| ... | ... | ... |

