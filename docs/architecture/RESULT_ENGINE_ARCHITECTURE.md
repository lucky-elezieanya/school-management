# Result Engine Architecture

## Overview

The Result Engine is the core processing pipeline responsible for transforming raw examination data into a fully computed, frontend-ready result snapshot.

The primary design goal of this architecture is **compute once, consume everywhere**.

Instead of recalculating student results every time a teacher, student, parent, or administrator requests them, all computations are performed immediately after result data changes. The computed output is then stored as a structured JSON snapshot that becomes the single source of truth for every consumer in the system.

This architecture dramatically reduces database queries, improves PDF generation speed, eliminates duplicated business logic, and ensures consistency across every platform that consumes result data.

---

# Design Philosophy

The architecture follows four fundamental principles.

## 1. Compute Once

All expensive computations are performed only when academic data changes.

Examples include:

- Subject averages
- Subject positions
- Overall averages
- Overall positions
- Overall grades
- Class statistics
- Cumulative averages
- Behaviour formatting
- Result customization
- Frontend formatting

These values are never recomputed during normal result viewing.

---

## 2. Store Once

After computation completes, a complete frontend-ready JSON document is stored inside the `StudentResultSnapshot` model.

This snapshot contains every piece of information required to display a student's result.

---

## 3. Read Many

Every consumer reads the same snapshot.

Examples include:

- Student Portal
- Parent Portal
- Admin Preview
- Result PDF
- Mobile Application
- Public APIs

No consumer performs calculations.

---

## 4. Single Source of Truth

The snapshot becomes the definitive representation of a student's result.

Every frontend screen, exported PDF, and API response displays identical information because they all consume the same JSON document.

---

# High-Level Architecture

```text
Teacher enters scores
        │
        ▼
+----------------------+
|    Result Engine     |
+----------------------+
        │
        ▼
 ┌─────────────────────────────────────────────┐
 │         Summary Computation Stage           │
 └─────────────────────────────────────────────┘
        │
        ├──────────────┐
        ▼              ▼
+----------------+  +----------------+
| SubjectSummary |  | ResultSummary  |
+----------------+  +----------------+
        │              │
        └──────┬───────┘
               ▼
+--------------------------------------+
|      ClassSnapshotEngine             |
+--------------------------------------+
               │
               ▼
+--------------------------------------+
|      ResultSnapshotContext           |
|                                      |
| Loads all required data once         |
+--------------------------------------+
               │
               ▼
      Iterate through every student
               │
               ▼
 ┌─────────────┬─────────────┬─────────────┐
 ▼             ▼             ▼
StudentSnapshotBuilder
StudentSnapshotBuilder
StudentSnapshotBuilder
        │
        ▼
StudentResultSnapshot (JSON)
        │
        ▼
Stored Permanently
        │
        ├────────────► Frontend Preview
        ├────────────► Student Portal
        ├────────────► Parent Portal
        ├────────────► PDF Generation
        └────────────► Mobile Application
```

---

# Processing Pipeline

The complete processing pipeline consists of five stages.

## Stage 1 — Teacher Result Entry

Teachers enter raw examination scores.

These are stored inside the `Result` table.

At this stage the database contains only raw scores.

No averages or rankings are calculated.

---

## Stage 2 — Summary Generation

Once score entry is completed, the Result Engine generates all derived statistics.

### Subject Summary

The system computes:

- Subject score
- Subject average
- Subject position
- Class size

These values are stored inside the `SubjectSummary` table.

---

### Overall Result Summary

Next, the engine computes:

- Total score
- Average score
- Overall position
- Overall class average
- Total subjects

These values are stored inside the `ResultSummary` table.

---

## Stage 3 — Snapshot Generation

After summaries are complete, the `ClassSnapshotEngine` begins snapshot generation.

Its responsibility is to generate frontend-ready snapshots for every student in the class.

---

## Stage 4 — Context Loading

The `ResultSnapshotContext` loads every object required to build snapshots.

This happens only once.

The context preloads:

- Student enrollments
- Results
- Subject summaries
- Result summaries
- Attendance
- Behaviour
- Teacher comments
- Fees
- School assets
- School days
- Resumption date
- Result customization
- Grading scales
- Historical term results

All data is cached in memory.

No additional database queries are performed while building snapshots.

---

## Stage 5 — Snapshot Building

The `StudentSnapshotBuilder` iterates through every enrolled student.

For each student it constructs a structured JSON object containing:

- Student information
- School information
- Academic summary
- Subject results
- Attendance
- Fees
- Behaviour
- Teacher comments
- Principal comments
- Assets
- Result customization

The completed JSON is then stored inside the `StudentResultSnapshot` model.

---

# Architectural Components

## ResultEngine

Coordinates the entire computation process.

Responsibilities:

- Generate subject summaries
- Generate result summaries
- Launch snapshot generation

---

## SubjectSummary Generator

Computes statistics for every subject.

Outputs:

- Subject Average
- Subject Position
- Subject Score
- Class Size

---

## ResultSummary Generator

Computes overall student statistics.

Outputs:

- Total Score
- Average Score
- Overall Position
- Overall Grade
- Class Average

---

## ClassSnapshotEngine

Coordinates snapshot generation for an entire class.

Responsibilities:

- Create a shared context
- Iterate through students
- Invoke the StudentSnapshotBuilder

---

## ResultSnapshotContext

Acts as the data provider.

Responsibilities:

- Load all required objects
- Eliminate N+1 queries
- Cache data for builders

The builder never performs database queries.

---

## StudentSnapshotBuilder

Transforms preloaded objects into a frontend-ready snapshot.

Responsibilities:

- Build student section
- Build school section
- Build summary
- Build subjects
- Build attendance
- Build behaviour
- Build comments
- Build assets
- Build customization

The builder performs no database queries and contains no business logic outside of assembling the snapshot.

---

## StudentResultSnapshot

Stores the final computed JSON.

This snapshot becomes the single source of truth for every result consumer.

---

# Data Flow

```
Raw Result Data
        │
        ▼
Subject Summary
        │
        ▼
Overall Result Summary
        │
        ▼
Class Statistics
        │
        ▼
Overall Grade
        │
        ▼
Cumulative Calculations
        │
        ▼
Snapshot Builder
        │
        ▼
StudentResultSnapshot
        │
        ▼
Frontend / PDF / APIs
```

---

# Snapshot Structure

Each snapshot contains the following sections:

```
StudentResultSnapshot

├── student
├── school
├── summary
├── attendance
├── fees
├── behaviour
├── comments
├── assets
├── customization
└── subjects
```

Every consumer relies exclusively on this structure.

---

# Performance Optimizations

The architecture introduces several optimizations.

### Context Loading

All required objects are loaded once and reused throughout snapshot generation.

---

### No N+1 Queries

Builders never perform database queries.

All required objects already exist inside the context.

---

### Precomputed Statistics

The following values are computed only once:

- Subject averages
- Subject positions
- Class averages
- Class positions
- Highest score
- Lowest score
- Overall grades
- Cumulative averages

---

### Frontend-Ready JSON

The snapshot requires no transformation before rendering.

The frontend can consume it directly.

---

### Fast PDF Generation

PDF generation no longer performs academic calculations.

It simply renders the stored snapshot.

---

# Benefits

This architecture provides:

- Minimal database queries
- High rendering performance
- Consistent data across all platforms
- Single source of truth
- Separation of concerns
- Maintainable business logic
- Scalable processing for large classes
- Frontend-ready JSON snapshots
- Efficient PDF generation
- Extensible design for future features

---

# Conclusion

The Result Engine follows a layered architecture where each component has a single responsibility.

Raw academic data is transformed into summarized statistics, then into a complete frontend-ready snapshot. Once stored, this snapshot serves every consumer in the application without additional computation.

By separating computation from presentation, the system achieves high performance, consistency, maintainability, and scalability while ensuring that every result displayed across the platform originates from the same authoritative data source.