# Interactive Plots Setup Guide

## Available Options

### 1. Highcharter (Recommended)
**Status:** ✅ Installed and working  
**Package:** `highcharter` (R wrapper for Highcharts.js)  
**License:** Highcharts is free for non-commercial use; commercial use requires license

**Installation:**
```r
install.packages("highcharter")
```

**Usage in Quarto:**
```r
library(highcharter)
highchart() %>%
  hc_chart(type = "column") %>%
  hc_add_series(data = c(5.15, 4.70), name = "Throughput") %>%
  hc_xAxis(categories = c("Hand", "Gaze"))
```

### 2. Plotly for R (Also Available)
**Status:** ✅ Still maintained and available  
**Package:** `plotly`  
**Note:** Despite rumors, plotly R package is NOT discontinued. It's actively maintained.

**Installation:**
```r
install.packages("plotly")
```

**Usage in Quarto:**
```r
library(plotly)
p <- ggplot(data, aes(x = modality, y = tp_mean)) +
  geom_bar(stat = "identity")
ggplotly(p)
```

### 3. ggiraph (ggplot2 Interactive)
**Status:** ✅ Available  
**Package:** `ggiraph`  
**Best for:** Making existing ggplot2 plots interactive

**Installation:**
```r
install.packages("ggiraph")
```

**Usage:**
```r
library(ggiraph)
p <- ggplot(data, aes(x = modality, y = tp_mean)) +
  geom_bar_interactive(stat = "identity", tooltip = "tp_mean")
girafe(ggobj = p)
```

## Current Implementation

The case study page (`case_study_web.qmd`) currently uses:
- **Highcharter** for interactive plots (if available)
- **Static PNG fallback** if Highcharter is not installed

Interactive plots are generated inline in Quarto chunks, which means:
- ✅ No separate HTML files needed
- ✅ Self-contained in the rendered HTML
- ✅ Works with Quarto's HTML output
- ✅ Falls back gracefully to static images

## Adding More Interactive Plots

To add interactive plots to other sections:

1. **Check if Highcharter is available** in the setup chunk
2. **Prepare data** in the same way as static plots
3. **Create Highcharter chart** using `highchart()`
4. **Add fallback** to static image if Highcharter unavailable

Example:
```r
```{r my-plot-interactive, eval=has_highcharter && !is.null(df_raw_interactive)}
if (has_highcharter && !is.null(df_raw_interactive)) {
  highchart() %>%
    hc_chart(type = "column") %>%
    hc_add_series(data = my_data$values, name = "Metric") %>%
    hc_xAxis(categories = my_data$labels)
} else {
  knitr::include_graphics("path/to/static.png")
}
```
```

## Switching to Plotly

If you prefer Plotly over Highcharter:

1. Update setup chunk:
```r
if (requireNamespace("plotly", quietly = TRUE)) {
  library(plotly)
  has_plotly <- TRUE
} else {
  has_plotly <- FALSE
}
```

2. Convert ggplot2 plots:
```r
p <- ggplot(data, aes(x = modality, y = tp_mean)) +
  geom_bar(stat = "identity")
ggplotly(p)
```

## Performance Considerations

- **Highcharter:** Smaller file size, faster loading
- **Plotly:** More features, larger file size
- **Static PNG:** Smallest, no interactivity

For web deployment, Highcharter is often preferred for its balance of features and performance.