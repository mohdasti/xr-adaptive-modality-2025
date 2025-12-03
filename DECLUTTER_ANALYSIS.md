# Decluttering Feature Analysis

## Current Implementation: VERY SUBTLE

When declutter mode activates, it only hides elements with the `.noncritical` class:

### In Production Mode (what participants see):
1. **Policy reason text** - Small italic gray text that says why adaptation triggered
   - This is already very small/unnoticeable
   - Only appears when adaptation is active (which already shows a badge)

### In Dev Mode (hidden from participants):
2. **"Last Event" stat card** - Inside a collapsible `<details>` section
3. **"System Active" indicator** - Small status dot

## The Problem

The decluttering is **too subtle** to notice because:
- Most of the HUD remains visible
- Only minor/secondary elements are hidden
- The hidden elements are already not very prominent
- In production, only one small text element gets hidden

## What Should Happen

According to the debrief text: "dimmed non-essential text"
But the current implementation doesn't actually "dim" anything - it just hides a few small elements.

## Recommendation

Either:
1. **Make decluttering more noticeable** - Hide/dim more prominent elements
2. **Update debrief text** - Make it more accurate about what actually happens
3. **Both** - Improve implementation AND update text

