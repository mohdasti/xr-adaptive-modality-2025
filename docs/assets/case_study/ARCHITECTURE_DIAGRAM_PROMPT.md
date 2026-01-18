# Architecture Diagram Generation Prompt for ChatGPT

Use this prompt with ChatGPT (or similar AI image generator) to create the architecture diagram:

---

## Prompt for ChatGPT/DALL-E/Image Generation

**Create a professional system architecture diagram for a remote XR interaction testbed. The diagram should be:**

- **Style**: Clean, modern, technical diagram with boxes, arrows, and labels
- **Color scheme**: Dark background (#0f0f0f or #1a1a1a) with cyan/blue accents (#00d9ff)
- **Format**: Horizontal layout, suitable for academic paper (width > height)
- **Resolution**: High resolution (at least 1920x1080px or higher)

**System Architecture Components:**

### 1. CLIENT-SIDE APPLICATION (Left Side)
**React 18 + TypeScript Application (Deployed on Vercel)**

**UI Components Layer:**
- **Task Control Panel** (left pane)
  - Block configuration
  - Modality selection (Hand/Gaze)
  - UI mode (Static/Adaptive)
  - Pressure settings
  - Trial controls

- **System HUD** (right pane)
  - Real-time statistics
  - Trial counters
  - Error tracking
  - Policy status display

- **Event Logger** (bottom pane)
  - Event log viewer
  - Debug interface

**Core Application Layer:**
- **Fitts Task Engine**
  - Canvas-based target selection (800×600px)
  - Circular target layout (8 positions)
  - Reaction time measurement
  - Hit/miss detection
  - ISO 9241-9 compliant

- **Modality System**
  - Hand mode: Direct pointing (cursor + click)
  - Gaze mode: Hover-based selection (dwell or SPACE confirmation)
  - Psychophysics-inspired gaze proxy (jitter + saccadic suppression)

- **Event Bus System**
  - Global event bus for inter-component communication
  - Event types: trial:start, trial:end, trial:error, policy:change

- **Adaptive Policy Engine** (Client-side)
  - Policy evaluation (width inflation for hand, declutter for gaze)
  - Context-aware adaptation triggers
  - Policy state management

- **Telemetry Collector** (Client-side)
  - P0 (minimal): Basic trial metrics, RT, endpoints
  - P0+ (full): Movement kinematics, quality metrics
  - P1 (raw): High-frequency pointer samples (optional)
  - Per-trial logging

### 2. DATA FLOW (Center)
**Arrows showing data flow:**

- **Input Flow**: Participant → UI Components → Core Application
- **Event Flow**: Components → Event Bus → Telemetry Collector
- **Policy Flow**: Trial metrics → Policy Engine → UI Adaptation
- **Output Flow**: Telemetry Collector → CSV Export → Local Download

### 3. DATA EXPORT (Right Side)
**Data Export Layer:**
- **CSV Export Module**
  - Trial data CSV (per-trial metrics)
  - Block data CSV (TLX responses)
  - Single merged CSV file (162 columns)

- **EmailJS Integration** (Optional)
  - Automatic data submission on completion
  - Email delivery to researcher

- **Local Storage**
  - Participant data stored locally
  - Downloadable CSV files

### 4. DEPLOYMENT INFRASTRUCTURE (Top)
**Vercel Platform:**
- Static site hosting
- Automated CI/CD
- Edge network distribution

### 5. KEY FEATURES TO HIGHLIGHT
- **Remote execution**: All processing client-side (no server required)
- **Privacy-first**: Data stored locally, optional email submission
- **Real-time adaptation**: Policy engine evaluates and adapts during trials
- **Comprehensive telemetry**: Multi-tier logging (P0/P0+/P1)

**Visual Elements:**
- Use boxes/rectangles for components
- Use arrows for data flow (label with flow direction)
- Use different colors/shades for different layers:
  - UI Layer: Light blue (#00d9ff)
  - Application Layer: Medium blue (#0099cc)
  - Data Layer: Dark blue (#006699)
  - Infrastructure: Gray (#666666)
- Add labels for each component
- Show bidirectional arrows where appropriate (e.g., Event Bus communication)
- Include a legend if needed

**Text Labels:**
- "Client-Side Application (React + TypeScript)"
- "Vercel Deployment"
- "Event Bus"
- "Adaptive Policy Engine"
- "Telemetry Collector"
- "CSV Export"
- "EmailJS (Optional)"

**Layout Suggestion:**
```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL PLATFORM                          │
│              (Static Hosting + CI/CD)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE APPLICATION                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Task Control │  │  System HUD  │  │Event Logger  │    │
│  │    Panel     │  │              │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │            │
│         └─────────────────┼──────────────────┘            │
│                          │                                │
│                    ┌─────▼─────┐                          │
│                    │ Event Bus │                          │
│                    └─────┬─────┘                          │
│                          │                                │
│         ┌────────────────┼────────────────┐              │
│         │                │                │              │
│    ┌────▼────┐    ┌──────▼──────┐   ┌─────▼─────┐        │
│    │ Fitts  │    │  Adaptive   │   │Telemetry  │        │
│    │  Task  │    │   Policy    │   │Collector  │        │
│    │ Engine │    │   Engine    │   │           │        │
│    └────┬───┘    └──────┬──────┘   └─────┬─────┘        │
│         │               │                │              │
│    ┌────▼───────────────▼────────────────▼──────┐      │
│    │         Modality System                      │      │
│    │    (Hand / Gaze-confirm)                     │      │
│    └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA EXPORT                               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  CSV Export  │  │  EmailJS     │  │Local Storage │    │
│  │   Module     │  │ (Optional)   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Additional Notes:**
- Emphasize that this is a **client-side only** architecture (no backend server)
- Show that telemetry collection happens in real-time during task execution
- Highlight the adaptive policy engine as a key innovation
- Make it clear that data export is optional (local download or email)

---

## Alternative: Simplified Version

If the above is too complex, create a simpler version focusing on:

1. **Client Application** (React + TypeScript)
   - UI Components
   - Task Engine
   - Policy Engine
   - Telemetry Collector

2. **Data Export**
   - CSV Files
   - EmailJS (optional)

3. **Deployment**
   - Vercel Platform

Use arrows to show: Participant → Application → Data Export
