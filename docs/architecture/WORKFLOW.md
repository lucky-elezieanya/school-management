# Result Processing Workflow

## Overview

This document describes the complete lifecycle of a student's result, from the moment a teacher enters scores to the point where students, parents, administrators, and PDFs consume the final result.

Unlike the architecture document, which explains **how the system is designed**, this workflow explains **how data flows through the system**.

The workflow follows an event-driven model where every important academic update triggers the necessary computations and snapshot regeneration.

---

# Complete Workflow

```text
Teacher Login
      │
      ▼
Teacher enters student scores
      │
      ▼
Raw Results Saved (Result Table)
      │
      ▼
Result Engine Triggered
      │
      ▼
Generate Subject Summaries
      │
      ▼
Generate Overall Result Summaries
      │
      ▼
Generate Student Snapshots
      │
      ▼
Store StudentResultSnapshot JSON
      │
      ▼
Result Ready
      │
      ├────────► Frontend Preview
      ├────────► Student Portal
      ├────────► Parent Portal
      ├────────► PDF Generation
      └────────► Mobile App
```

---

# Workflow Stages

## Stage 1 — Teacher Result Entry

### Trigger

Teacher submits scores for a subject.

Example:

```
Mathematics

John   18 | 19 | 47
Mary   20 | 18 | 50
David  15 | 17 | 43
```

The frontend sends the scores to the backend.

---

## Stage 2 — Save Raw Results

The backend validates every score.

Validation includes:

- Maximum test score
- Maximum exam score
- Missing students
- Duplicate entries
- Subject assignment

If validation succeeds:

```
Result.objects.bulk_create(...)
```

or

```
Result.objects.bulk_update(...)
```

is executed.

At this stage only raw scores exist.

No averages or rankings have been computed.

---

## Stage 3 — Subject Summary Generation

Once all results are saved, the Result Engine computes subject-level statistics.

For every subject, the engine calculates:

- Subject Score
- Subject Average
- Subject Position
- Class Size

The output is stored in:

```
SubjectSummary
```

Each student now has computed statistics for every subject.

---

## Stage 4 — Overall Result Summary

After subject summaries are complete, the engine computes overall statistics.

For every student:

- Total Score
- Average Score
- Overall Position
- Class Average
- Number of Subjects

The output is stored in:

```
ResultSummary
```

At this point every student's academic standing has been computed.

---

## Stage 5 — Snapshot Generation

The Result Engine launches the snapshot generation process.

```
ClassSnapshotEngine
```

is responsible for generating result snapshots for every student in the class.

---

## Stage 6 — Context Initialization

Before building snapshots, the system creates a shared context.

```
ResultSnapshotContext
```

loads all required data once.

Loaded objects include:

- Student enrollments
- Results
- Subject summaries
- Overall summaries
- Attendance
- Behaviour
- Comments
- School fees
- School assets
- School days
- Resumption date
- Customization
- Grading scales
- Historical results

Everything is cached in memory.

No further database queries occur during snapshot building.

---

## Stage 7 — Student Snapshot Construction

The system iterates through every enrolled student.

For each student:

```
StudentSnapshotBuilder
```

constructs:

```
Student
School
Summary
Subjects
Attendance
Fees
Behaviour
Comments
Assets
Customization
```

into a single JSON document.

---

## Stage 8 — Snapshot Storage

The completed JSON is stored inside:

```
StudentResultSnapshot
```

Example:

```
StudentResultSnapshot

student
session
term
school_class
status
data (JSON)
updated_at
```

The snapshot now becomes the authoritative version of the student's result.

---

# Result Ready

Once snapshots have been generated, the result is considered complete.

No further academic calculations are required.

---

# Result Consumption

Every consumer simply loads the stored snapshot.

```
StudentResultSnapshot

↓

snapshot.data

↓

Render
```

Consumers include:

- Frontend Result Preview
- Student Portal
- Parent Portal
- PDF Generator
- Mobile Application

---

# Snapshot Regeneration Workflow

Snapshots are regenerated only when academic data changes.

---

## Teacher edits marks

```
Teacher edits Result

↓

Result Engine

↓

Subject Summary

↓

Result Summary

↓

Class Snapshot Engine

↓

Updated StudentResultSnapshots
```

Entire class snapshots are rebuilt because rankings and averages may change.

---

## Attendance updated

```
Attendance Updated

↓

Student Snapshot Engine

↓

Updated StudentResultSnapshot
```

Only the affected student's snapshot is rebuilt.

---

## Behaviour updated

```
Behaviour Updated

↓

Student Snapshot Engine

↓

Updated StudentResultSnapshot
```

---

## Teacher comment updated

```
Teacher Comment Updated

↓

Student Snapshot Engine

↓

Updated StudentResultSnapshot
```

---

## Principal comment updated

```
Principal Comment Updated

↓

Student Snapshot Engine

↓

Updated StudentResultSnapshot
```

---

## School fees updated

```
Class Fees Updated

↓

Class Snapshot Engine

↓

All StudentResultSnapshots Updated
```

---

## Result customization updated

```
Customization Updated

↓

Class Snapshot Engine

↓

All StudentResultSnapshots Updated
```

---

## School assets updated

```
Logo/Header Updated

↓

Class Snapshot Engine

↓

All StudentResultSnapshots Updated
```

---

## Resumption date updated

```
Resumption Date Updated

↓

Class Snapshot Engine

↓

All StudentResultSnapshots Updated
```

---

# Separation of Responsibilities

| Component | Responsibility |
|-----------|----------------|
| Result | Stores raw examination scores |
| SubjectSummary | Stores subject-level statistics |
| ResultSummary | Stores overall student statistics |
| ResultEngine | Coordinates result computation |
| ClassSnapshotEngine | Generates snapshots for every student in a class |
| ResultSnapshotContext | Loads all required data once |
| StudentSnapshotBuilder | Builds frontend-ready JSON |
| StudentResultSnapshot | Stores the final snapshot |

---

# Performance Workflow

Instead of this:

```
Student requests result

↓

40–80 database queries

↓

Calculate averages

↓

Calculate rankings

↓

Calculate cumulative

↓

Render PDF
```

The system now performs:

```
Teacher updates data

↓

Compute once

↓

Store snapshot

↓

Student requests result

↓

Load JSON

↓

Render
```

This dramatically reduces processing time.

---

# Workflow Summary

```text
Teacher Entry
      │
      ▼
Save Raw Results
      │
      ▼
Generate SubjectSummary
      │
      ▼
Generate ResultSummary
      │
      ▼
Generate StudentResultSnapshots
      │
      ▼
Store JSON Snapshot
      │
      ▼
Ready for Consumption
      │
      ├────────► Frontend Preview
      ├────────► Student Portal
      ├────────► Parent Portal
      ├────────► PDF Generation
      └────────► Mobile Application
```

---

# Guiding Principle

The workflow is built around a simple principle:

> **Every expensive computation happens immediately after academic data changes. Every consumer thereafter reads a precomputed snapshot instead of recalculating results.**

This approach ensures:

- Fast result retrieval
- Consistent output across all platforms
- Minimal database queries
- Efficient PDF generation
- Simplified frontend rendering
- Scalable performance for large classes
- A single authoritative representation of each student's result