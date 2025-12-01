# Debugging Black Screen Issue

## Steps to Debug

### 1. Test Locally First

1. **Start the dev server:**
   ```bash
   cd app
   npm run dev
   ```

2. **Open browser to:** `http://localhost:5173/intro`

3. **Complete the flow:**
   - Fill out demographics
   - Complete system check
   - Complete calibration
   - Click "Calibration Complete"

4. **When you see the black screen:**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Check the **Console** tab for errors
   - Check the **Network** tab for failed requests
   - Check the **Elements** tab to see if components are rendering

### 2. What to Look For

#### In the Console:
- Look for messages starting with `[Task]` - these are our debug logs
- Check for any red error messages
- Look for messages about demographics, loading state, etc.

#### In the Elements/Inspector:
- Check if the `<div className="app-container">` exists
- Check if the header exists
- Check if the grid exists
- Check if any of the panes (TaskPane, HUDPane, LoggerPane) exist

### 3. Expected Console Output

When working correctly, you should see:
```
[Task] Component mounted
[Task] Checking demographics...
[Task] Demographics found: true
[Task] Demographics OK, setting loading to false
[Task] Render - isLoading: false error: null
[Task] Rendering main Task component
```

### 4. Common Issues to Check

1. **Demographics not found:**
   - Check `sessionStorage.getItem('demographics')` in console
   - Should return a JSON string if demographics were saved

2. **Component not mounting:**
   - Check if you see `[Task] Component mounted` in console
   - If not, the route might not be loading

3. **JavaScript error:**
   - Look for red errors in console
   - Common: undefined imports, missing dependencies

4. **Navigation issue:**
   - Check URL bar - should show `/task?pid=...&session=...`
   - If URL doesn't change, navigation might be blocked

### 5. Quick Test

To test if Task component works at all, try navigating directly:
- Go to: `http://localhost:5173/task?pid=P001&session=1`
- (Make sure demographics are in sessionStorage first)
- Check console for debug logs

### 6. Check sessionStorage

In browser console, run:
```javascript
console.log('Demographics:', sessionStorage.getItem('demographics'))
console.log('Calibration:', sessionStorage.getItem('calibration'))
```

Both should return JSON strings (not null).

## Report Back

After testing locally, report:
1. Do you see the debug console logs? (Which ones?)
2. Any red errors in console? (Copy them)
3. What does the Elements tab show? (Is app-container present?)
4. Does it work locally but fail on Vercel?

