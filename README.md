# Data Canvas

MISO Navigator — Add AI-Powered Data Canvas & Visual Data Connections

Continue building the existing MISO Navigator frontend.

Do NOT redesign or replace the existing homepage, onboarding experience, navigation, visual identity, or overall design language.

Add a new major capability called:

AI Data Canvas

This should allow users to visually connect MISO data sources, datasets, filters, transformations, documents, APIs, and visualization tools as interactive nodes.

The feature should feel like a natural extension of MISO Navigator — not a separate developer tool.

The overall product should remain:

Clean

Intuitive

Minimal

Professional

Sharp-edged

MISO-branded

Easy for non-technical users

Powerful enough for researchers and developers

1. Where the Data Canvas Comes From

The Data Canvas should be accessible from:

The main AI search experience

A "Create a graph" action

A "Visualize this data" action

The Data page

A "Open in Canvas" button on datasets

A "Create visualization" button on search results

For example, if the user asks:

"Compare Indiana and Michigan electricity load over the last 30 days."

The AI should be able to respond:

"I've prepared a visualization workflow for you."

Then open the Data Canvas with the relevant nodes already created and connected.

2. Data Canvas Layout

Create a full-screen workspace.

Top navigation:

← MISO Navigator

Data Canvas

[Undo] [Redo]       [Save] [Export]       [Run]


Left side:

Add

Data

Document

API

Filter

Transform

Compare

Visualization

Output

Center:

Infinite canvas

Right side:

AI Assistant

The center canvas should occupy most of the screen.

Do not use a traditional dashboard grid.

The canvas should feel like an intelligent workspace.

3. Canvas Visual Design

Use the same MISO-inspired color system already established.

Primary colors:

MISO blue

Deep navy

White

Light gray

Dark gray

MISO green for valid connections

Red for invalid connections

Yellow/amber for uncertain states

Use very subtle grid lines in the canvas.

Use sharp rectangular nodes.

Avoid:

Huge rounded cards

Excessive gradients

Glassmorphism

Neon effects

Excessive shadows

Keep the design sophisticated and enterprise-grade.

4. NODE SYSTEM

Create a reusable Node component.

Nodes should support:

Dragging

Selecting

Connecting

Disconnecting

Duplicating

Deleting

Expanding/collapsing

Context menu

Hover state

Connection handles

Status indicators

Every node should have:

Icon

Type

Name

Description

Status

Inputs

Outputs

Example:

┌─────────────────────────────┐
│ DATA SOURCE                 │
│                             │
│ MISO Load API               │
│                             │
│ Public · Real-time          │
│                             │
│                    ● Output │
└─────────────────────────────┘


5. NODE TYPES

Create the following node types.

Data Source

Example:

MISO Load API
DATA SOURCE

Public
Real-time


Dataset

Indiana Load
DATASET

Hourly
MW


Location

Indiana
LOCATION


Time Range

Last 30 Days
TIME


Filter

Filter

Location = Indiana


Transformation

Transform

Hourly → Daily Average


Comparison

Compare

Indiana vs Michigan


Document

MISO Market Report
DOCUMENT

PDF


Visualization

Visualization

Line Chart


Output

Output

CSV
PNG
Excel


6. CONNECTION HANDLES

Every node must have visible connection handles.

Use handles on the left and right edges.

Input:

●


Output:

●


When the user hovers over a connector, make it subtly larger.

When the user starts dragging a connection, dynamically evaluate whether the target is compatible.

7. CONNECTION COLORS

This is a core part of the design.

VALID CONNECTION

When two nodes can be connected:

Connector = MISO green

Connection line = MISO green

Show a subtle green highlight

Display a check icon when appropriate

Example:

[MISO LOAD API]
       ●
       │
       │ GREEN
       │
       ▼
[LINE CHART]


Tooltip:

Compatible connection

8. INVALID CONNECTION

If two nodes cannot logically be connected:

Connector = red

Connection line = red

Show warning/X icon

Display explanation

Example:

[PDF DOCUMENT]
       ●
       │
       │ RED
       │
       ▼
[REAL-TIME LOAD CHART]


Tooltip:

This document does not contain structured time-series data required for this visualization.

Do not only say:

Invalid connection.

Explain WHY the connection is invalid.

9. UNCERTAIN CONNECTION

If the system cannot determine compatibility:

Use an amber/yellow state.

Example:

● AMBER


Tooltip:

Additional information is needed to determine whether these resources are compatible.

The AI assistant should be able to resolve the ambiguity.

10. ACCESSIBILITY

Do not rely exclusively on color.

Every connection state should also have:

Icon

Tooltip

Text description

Accessible label

For example:

Green:

✓ Compatible

Red:

× Incompatible

Amber:

! Needs review

11. AI-GENERATED CANVAS

The user should NOT have to manually build every workflow.

The AI should be able to generate the canvas automatically.

Example user request:

"Create a graph comparing Indiana and Michigan electricity load over the last 30 days."

AI workflow:

Indiana Load
      │
      │
      ▼
   Compare
      ▲
      │
      │
Michigan Load
      │
      ▼
  Line Chart
      │
      ▼
   Output


The AI should automatically:

Understand the request

Find the appropriate MISO resources

Create nodes

Determine compatibility

Connect compatible nodes

Add filters

Select an appropriate visualization

Prepare the workflow

Explain the workflow to the user

12. AI ASSISTANT PANEL

Create a right-side AI panel.

Header:

Canvas Assistant

Example:

I found compatible MISO load datasets for Indiana and Michigan.

I've connected them to a comparison node and selected a line chart because this is time-series data.

Then show:

Workflow

Indiana Load
+
Michigan Load
↓
Compare
↓
Line Chart


Button:

Run workflow

13. USER CAN MODIFY AI WORK

The AI creates the initial workflow, but the user has complete control.

Users can:

Drag nodes

Reconnect nodes

Add nodes

Delete nodes

Change filters

Change time ranges

Change visualization

Add transformations

Change units

Modify aggregation

The AI should update its understanding of the canvas as the user changes it.

14. INTERACTIVE CONNECTION LINES

Connection lines should not be passive.

When a user clicks a line, open a small contextual control panel near that line.

Example:

Indiana Load ──────────────── Compare


Click the connection.

Show:

Connection Settings

Time range
[Last 30 Days ▼]

Frequency
[Hourly ▼]

Aggregation
[Average ▼]

Units
[MW ▼]

Missing values
[Ignore ▼]

Filter
[None ▼]

[Apply]


15. CONTEXT-AWARE LINE MODIFIERS

The modifiers should change based on the data being passed through the connection.

For time-series data:

Time range

Frequency

Aggregation

Moving average

Missing values

Time zone

For pricing:

Market

Location

Price type

Interval

Unit

For geographic data:

Region

Boundary

Geographic aggregation

Coordinates

For documents:

Page range

Section

Keyword

Extraction mode

Do not show irrelevant controls.

16. ADD TRANSFORMATION FROM A LINE

When the user hovers over a connection line, show:

+

When clicked:

Add to connection

Filter
Transform
Aggregate
Compare
Normalize
Calculate
Convert Units
Resample


Selecting an option inserts a new node directly into the connection.

Example:

Indiana Load
      │
      ▼
   Filter
      │
      ▼
 Aggregate
      │
      ▼
 Line Chart


17. DATA COMPATIBILITY ENGINE — FRONTEND

Create frontend logic that simulates compatibility validation.

Every node should have metadata describing:

dataType
format
unit
timeSeries
geographic
structured
supportsVisualization
supportedInputs
supportedOutputs


Example:

{
  type: "dataset",
  dataType: "time-series",
  unit: "MW",
  geographic: true,
  structured: true
}


A line chart node might accept:

{
  acceptedTypes: [
    "time-series"
  ]
}


The frontend should use this metadata to determine:

Green = compatible

Red = incompatible

Amber = uncertain

Structure this so the real backend/AI compatibility engine can replace the mock logic later.

18. AI RECOMMENDS VISUALIZATION

When users connect data to a visualization node, the AI should analyze the data characteristics and recommend the best visualization.

Examples:

Time-series:

Line chart

Categorical comparison:

Bar chart

Geographic:

Map

Two numerical variables:

Scatter plot

Composition:

Pie/donut

The AI should explain its recommendation.

Example:

Recommended: Line chart

Your dataset contains hourly measurements over time, making a line chart the clearest way to show changes.

19. AI CAN CREATE A VISUALIZATION NODE AUTOMATICALLY

If the user says:

"Visualize this."

The AI should automatically:

Inspect connected data
       ↓
Understand schema
       ↓
Determine data type
       ↓
Select visualization
       ↓
Create visualization node
       ↓
Connect data


20. VISUALIZATION NODE

When a visualization node is selected, open a configuration panel.

Example:

Visualization

Type
[Line Chart ▼]

X Axis
[Timestamp ▼]

Y Axis
[Load MW ▼]

Group By
[Location ▼]

Aggregation
[Average ▼]

Title
[Indiana vs Michigan Load]

[Apply]


The chart should update interactively.

21. OUTPUT NODE

Users should be able to connect a visualization or dataset to output nodes.

Output options:

CSV

Excel

PNG

SVG

JSON

PDF

Example:

Line Chart
    │
    ├──────→ PNG
    │
    ├──────→ SVG
    │
    └──────→ CSV


22. DATA PREVIEW

When a dataset node is selected, show:

Data Preview

A table containing:

Timestamp

Location

Metric

Value

Unit

Add:

Open full dataset

Download

Visualize

23. DOCUMENT NODES

A document can also exist inside the canvas.

Example:

MISO Planning Report
DOCUMENT

Pages: 300


If the user connects it to an AI extraction node:

MISO Report
     │
     ▼
Find Section
     │
     ▼
Transmission Planning


The system should conceptually load only the relevant document section rather than requiring the user to download the entire document.

24. CANVAS COMMAND BAR

Add a small command bar at the top of the canvas:

⌘K  Ask AI or add something...


Examples:

"Add Indiana load data."

"Compare this with Michigan."

"Add a weekly aggregation."

"Create a line chart."

"Export this workflow."

The command bar should allow natural-language manipulation of the canvas.

25. SMART SUGGESTIONS

When a node is selected, show possible next actions.

Example:

Selected:

Indiana Load

Show:

What would you like to do?

→ Compare
→ Filter
→ Aggregate
→ Visualize
→ Download
→ Find related data


This makes the node system accessible to users who don't understand visual workflow tools.

26. CANVAS STATES

Create polished states for:

Empty canvas

Start building your data workflow

Ask the AI to create one for you

[What would you like to visualize?]


Loading

Finding MISO data...
Analyzing compatibility...
Building your workflow...


Running

Running workflow...

1. Retrieving data ✓
2. Applying filters ✓
3. Transforming data...
4. Creating visualization...


Complete

Workflow complete ✓

[View results]
[Download]


Error

We couldn't complete this workflow.

[Try again]
[Ask AI]


27. SAVE WORKSPACE

Allow users to save their canvas locally for the prototype.

Save:

Nodes

Positions

Connections

Filters

Transformations

Visualization settings

User notes

Use localStorage/IndexedDB for the prototype.

Structure this so it can later be persisted through the backend.

28. SHARE / EXPORT

Add:

Export workflow

Options:

PNG

SVG

JSON

Shareable link placeholder

The exported workflow should preserve the node relationships visually.

29. NODE SEARCH

Allow users to search for resources directly from the canvas.

Click:

+ Add node

Search:

Indiana load

Results:

MISO Load API
Indiana Load Dataset
Historical Load Reports
Load Documentation


The user can drag a result directly onto the canvas.

30. REAL MISO DATA READY

Do not hardcode the architecture around fake data.

Use mock data for the frontend demonstration, but create clean service abstractions:

misoService
aiService
documentService
visualizationService
canvasService


The frontend should later be able to connect to:

FastAPI
PostgreSQL
pgvector
MISO APIs
LLM
MCP


31. TECHNICAL IMPLEMENTATION

Use the existing React + TypeScript + Tailwind architecture.

Use a mature node/canvas library such as:

React Flow / XYFlow

for:

Nodes

Edges

Dragging

Zoom

Pan

Connection handles

Edge interactions

Custom node rendering

Build custom MISO-styled nodes and edges rather than using the library's default appearance.

32. IMPORTANT — DO NOT CHANGE THE EXISTING HOMEPAGE

The existing homepage should remain focused on:

What can I help you with?

and:

Jump right back into...

The Data Canvas should be an additional experience entered when the user wants to work with data.

Do not put the node canvas on the homepage.

33. MISO VISUAL LANGUAGE

Maintain the existing MISO visual system throughout the canvas.

Use:

MISO blue for primary interactions

Deep navy for important text

White backgrounds

Light neutral canvas

Green for valid connections

Red for invalid connections

Amber for uncertain connections

Green and red must appear on:

the connector handles AND the connection lines.

Use subtle transitions when connection states change.

34. FINAL USER EXPERIENCE

The final workflow should feel like this:

USER

"What can I help you with?"

        ↓

"Compare Indiana and Michigan
electricity load for the last month."

        ↓

AI understands request

        ↓

AI finds MISO data

        ↓

AI opens Data Canvas

        ↓

┌──────────────┐       ┌──────────────┐
│ Indiana Load │──────→│              │
└──────────────┘       │   COMPARE    │
                       │              │
┌──────────────┐       │              │
│ Michigan Load│──────→│              │
└──────────────┘       └──────┬───────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ LINE CHART  │
                       └──────┬──────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 PNG/SVG              CSV


The AI creates the initial workflow.

The user can then visually manipulate it.

They can:

connect → filter → transform → compare → visualize → download

35. PRODUCT PHILOSOPHY

The Data Canvas should communicate one core idea:

Users shouldn't need to understand MISO's data architecture to work with MISO's data.

The AI handles the complexity.

The visual canvas exposes the logic.

The user remains in control.

The interface should make complex data workflows feel as simple as connecting pieces together.

Build this as a highly polished, interactive frontend prototype, with realistic mock MISO datasets and functional interactions throughout.

Prioritize:

Visual polish

Intuitive interactions

AI-generated workflows

Clear connection states

Context-aware modifiers

Accessibility

Backend/API readiness

MISO branding

Sharp, precise UI

A seamless experience with the existing MISO Navigator application

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a972f244-972e-4f51-9325-2de5dab4072a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
