# LLM Prompt: Improving Drag Distance vs. Movement Time Visualization

## Context

I'm analyzing data from a Fitts's Law pointing task experiment where participants select targets on a screen. I have a variable called `drag_distance` which represents the **actual path length** the cursor traveled during a trial (as opposed to the straight-line amplitude `A` from start to target center).

## Current Visualization

I'm currently plotting drag distance vs. movement time (RT) using:

```r
ggplot(df_drag_rt, aes(x = drag_distance, y = rt_s, color = ui_mode)) +
  geom_point(alpha = 0.3, size = 1.5) +
  geom_smooth(method = "lm", se = TRUE, alpha = 0.2, linewidth = 1.2) +
  facet_grid(modality ~ pressure)
```

**Issues with current approach:**
- Simple scatter plot with linear regression may not capture the relationship well
- Drag distance and movement time likely have a non-linear relationship (movement efficiency decreases with distance)
- Doesn't show movement efficiency (path efficiency = straight-line distance / actual path length)
- Doesn't account for target size (W) or difficulty (ID) which affect both variables
- May have heteroscedasticity (variance increases with distance)
- Doesn't distinguish between efficient vs. inefficient movements

## Research Questions

1. **Movement Efficiency**: How does actual path length compare to straight-line distance? (path efficiency = A / drag_distance)
2. **Distance-Performance Relationship**: How does movement time scale with actual distance traveled?
3. **Condition Effects**: Do modality (hand vs. gaze) and UI mode (static vs. adaptive) affect the distance-time relationship?
4. **Individual Differences**: Are some participants consistently more efficient (shorter paths for same amplitude)?

## Available Variables

- `drag_distance`: Actual cursor path length (pixels)
- `rt_ms`: Movement time (milliseconds)
- `A`: Straight-line amplitude (pixels) - distance from start to target center
- `W`: Target width (pixels)
- `ID`: Index of Difficulty (bits) = log₂(A/W + 1)
- `modality`: "hand" or "gaze"
- `ui_mode`: "static" or "adaptive"
- `pressure`: 0 or 1 (time pressure condition)
- `endpoint_error_px`: Distance from click to target center
- `correct`: Whether trial was successful
- `trajectory`: Full cursor path as JSON array of {x, y, t} points

## What I Want to Know

1. **What are better visualization approaches** for drag distance vs. movement time?
   - Should I use log scales?
   - Should I compute path efficiency first?
   - Should I use binned/aggregated data instead of raw points?
   - Should I show separate plots for different ID levels?

2. **What statistical relationships should I explore?**
   - Is the relationship linear, power-law, or exponential?
   - Should I model movement time as a function of both drag_distance AND amplitude?
   - Should I account for target size (W) in the model?

3. **What additional derived metrics would be informative?**
   - Path efficiency ratio (A / drag_distance)
   - Excess distance (drag_distance - A)
   - Movement smoothness (from trajectory data)
   - Speed profiles (velocity over time)

4. **What visualization types would best communicate the insights?**
   - Hexbin plots for density?
   - Contour plots for 2D distributions?
   - Small multiples by ID or condition?
   - Efficiency scatter plots (path efficiency vs. RT)?
   - Combined plots showing both distance and efficiency?

5. **How should I handle outliers and data quality?**
   - Very long drag distances (participant got lost?)
   - Very short drag distances (nearly straight paths)
   - Failed trials (correct = false) - should they be included?

## Constraints

- Data is from a Fitts's Law task (pointing/clicking, not dragging)
- Some participants may have very few data points per condition
- Need to compare across 4 conditions: 2 modalities × 2 UI modes
- Also need to account for pressure condition (2 levels)
- Total: 8 condition combinations

## Desired Output

Please provide:
1. **Recommended visualization approaches** with rationale
2. **R/ggplot2 code examples** for the best approaches
3. **Statistical modeling suggestions** (e.g., should I use log-linear models, polynomial regression, etc.?)
4. **Derived metrics** that would add insight
5. **Best practices** for this type of movement data visualization

Focus on approaches that will help readers understand:
- How movement efficiency varies across conditions
- Whether longer paths lead to longer movement times (and by how much)
- Individual differences in movement strategies
- Whether adaptive UI affects movement efficiency

