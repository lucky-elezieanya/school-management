# School Portal Result Engine v2
## High Performance Snapshot-Based Result Architecture

> **Goal:** Transform the current result generation workflow from a computation-on-demand architecture into a **snapshot-driven architecture**, where all calculations are completed immediately after result entry, allowing result preview, PDF generation, printing, and downloads to read from a single optimized JSON document.

---

# 1. Vision

The current implementation generates results by querying multiple tables (Results, ResultSummary, Attendance, Fees, Behaviour, Comments, Grades, Assets, etc.) every time a PDF is generated.

Although correct, this architecture becomes increasingly expensive as the number of students grows.

Example:

```
Generate PDF
      │
      ▼
Query Results
Query Subjects
Query Grades
Query Attendance
Query Fees
Query Behaviour
Query Comments
Query Assets
Query Summary
Query Positions
Compute Averages
Compute Grades
Generate Charts
Render PDF
```

For 800 students this easily becomes **tens of thousands of database queries**, repeated every time a teacher downloads or previews results.

Instead, the application should compute everything **once** and reuse the computed data.

---

# 2. New Philosophy

The database should become the **single source of truth**, while the snapshot becomes the **single source for rendering**.

Instead of:

```
Result → Compute → PDF
```

The workflow becomes:

```
Teacher enters scores
        │
        ▼
Compute everything once
        │
        ▼
Store JSON snapshot
        │
        ▼
Preview
Download
Print
Generate PDF
Share

All use the SAME snapshot.
```

No recalculation.

No repeated joins.

No repeated aggregation.

---

# 3. Core Architecture

## Primary Components

```
Teacher
    │
    ▼
Result Entry API
    │
    ▼
Update Student Results
    │
    ▼
Result Engine
    │
    ▼
Student Snapshot JSON
Class Snapshot JSON
    │
    ▼
Frontend
    │
    ▼
PDF Renderer
```

---

# 4. New Database Models

---

## StudentResultSnapshot

Stores everything required to render ONE student's result.

```python
StudentResultSnapshot

id

student

school_class

session

term

version

status

last_updated

snapshot = JSONField()
```

Example:

```json
{
  "student": {},
  "school": {},
  "summary": {},
  "subjects": [],
  "behaviour": {},
  "attendance": {},
  "fees": {},
  "comments": {},
  "grading": {},
  "chart": {},
  "assets": {}
}
```

Nothing else is needed for rendering.

---

## ClassResultSnapshot

Stores the entire class.

```python
ClassResultSnapshot

class

term

session

status

snapshot = JSONField()
```

Example

```json
{
    "class_average":45,
    "highest_average":89,
    "lowest_average":23,
    "students":[]
}
```

Useful for

- Broadsheets
- CSV Export
- Analytics
- Rankings
- Dashboards

without querying Result tables again.

---

# 5. Result Entry Workflow

---

## Step 1

Teacher submits scores for one subject.

```
English
```

for

```
SS2A
```

The API performs:

```
Bulk Update Results
```

Only.

---

## Step 2

Immediately after saving:

```
Update Student Snapshots
```

For every student in that class.

Only the affected subject is updated.

No PDF generation.

---

Example

Student Snapshot before:

```
English

Math

Physics
```

Teacher edits English.

Only English node changes.

Everything else remains untouched.

---

# 6. Incremental Computation

The Result Engine recalculates only affected values.

```
Subject Total

↓

Subject Grade

↓

Student Average

↓

Student Position

↓

Remarks

↓

Chart Data
```

No unnecessary computations.

---

# 7. Final Subject Detection

Every class has

```
Required Subjects
```

When all subjects have been submitted:

```
Submitted Subjects == Required Subjects
```

then

```
Class Status

↓

COMPLETED
```

Now perform

```
Final Ranking

Final Positions

Highest Scores

Lowest Scores

Class Statistics

Overall Grades

Class Snapshot
```

Everything becomes frozen.

---

# 8. Snapshot Building

Each student snapshot contains everything.

Example

```json
{
    "student":{

    },

    "subjects":[

    ],

    "summary":{

    },

    "attendance":{

    },

    "behaviour":{

    },

    "comments":{

    },

    "fees":{

    },

    "performance_chart":[

    ],

    "grading_scale":[

    ],

    "assets":{

    }
}
```

No missing information.

No joins.

No lookups.

---

# 9. Class Snapshot

After every student snapshot is completed:

Build one class snapshot.

Contains

```
Entire Broadsheet

Class Ranking

Subject Rankings

Statistics

Averages

Highest

Lowest

Summary
```

Everything.

---

# 10. Frontend Workflow

Instead of

```
Open Result

↓

API

↓

20 Queries

↓

Compute

↓

Render
```

It becomes

```
Open Result

↓

GET Snapshot

↓

Render React Component

↓

Done
```

Loading time becomes almost instantaneous.

---

# 11. PDF Generation

Instead of

```
Backend

↓

WeasyPrint

↓

Queries

↓

Calculations

↓

HTML

↓

PDF
```

Use

```
Snapshot JSON

↓

React Component

↓

React PDF Renderer

↓

PDF
```

The React component simply receives

```
snapshot
```

and renders.

Exactly like rendering a webpage.

---

# 12. Eliminating Celery

## Current

```
Teacher

↓

Queue Task

↓

Celery

↓

Compute

↓

Generate

↓

Store
```

---

## Proposed

```
Teacher

↓

Save Results

↓

Compute Snapshot Immediately

↓

Done
```

Because computation occurs during normal result entry, there is no heavy processing left afterward.

This removes the need for asynchronous workers in most schools.

Celery becomes optional rather than required.

---

# 13. Optional Background Processing Strategy

Instead of Celery:

Use lightweight background execution only for expensive operations.

Examples:

```
Merge PDFs

Bulk ZIP Download

Email Reports

Nightly Analytics

Automatic Backup
```

Everything else stays synchronous.

Possible implementations:

- Django-Q2
- Django Background Tasks
- RQ
- Async Views (where appropriate)

If the school has fewer than ~3,000 students, even these tasks may not require dedicated workers.

---

# 14. Performance Optimizations

## Query Optimization

Instead of

```
Student

↓

Results

↓

Subjects

↓

Attendance

↓

Behaviour

↓

Fees

↓

Comments

↓

Assets
```

Load once using:

```
select_related()

prefetch_related()
```

Build one snapshot.

Never query again.

---

## Bulk Operations

Never loop:

```
student.save()
```

Instead:

```
bulk_create()

bulk_update()
```

for snapshots.

---

## JSON Serialization

Snapshot stores primitive values only.

No model instances.

No lazy objects.

Everything becomes serializable.

---

## Cached Assets

Store resolved URLs or file paths for:

- School logo
- Header image
- Signatures
- Student photo

Avoid resolving storage paths during rendering.

---

## Precomputed Charts

Store chart data, not rendered images.

Example:

```json
{
    "labels":["Math","English"],

    "student":[72,80],

    "average":[61,69]
}
```

Frontend renders charts directly.

---

## Immutable Snapshots

Snapshots become read-only once results are approved.

Advantages:

- Auditability
- Versioning
- Rollback capability

---

# 15. API Design

## Generate Snapshot

```
POST

/results/snapshots/generate/
```

---

## Student Snapshot

```
GET

/results/snapshots/student/
```

Returns

```json
{}
```

---

## Class Snapshot

```
GET

/results/snapshots/class/
```

Returns

```json
{}
```

---

## PDF Download

```
GET

/results/pdf/
```

Returns the snapshot only, or optionally streams a generated PDF if server-side generation is still supported.

---

# 16. Frontend Rendering

A single reusable component:

```
<ResultSheet />
```

receives

```
snapshot
```

Props only.

The component is responsible for:

- Screen Preview
- Print Preview
- PDF Rendering
- Export

No duplicate templates.

---

# 17. Versioning Strategy

Each snapshot includes:

```
version

generated_at

generated_by

status
```

If a teacher edits scores:

```
Version 3

↓

Version 4
```

Previous versions may optionally be retained for audit history.

---

# 18. Scalability

With this architecture:

Current:

```
1000 Students

↓

Generate PDFs

↓

Thousands of Queries

↓

Thousands of Calculations
```

Future:

```
1000 Students

↓

Read JSON

↓

Render

↓

Done
```

The workload shifts from repeated database reads to a single optimized write at the point of data entry.

---

# 19. Benefits

## Performance

- Near-instant result preview.
- Elimination of repeated database joins.
- Minimal query count during viewing and printing.
- Faster API responses.

## Scalability

- Supports significantly larger student populations.
- Predictable performance as the database grows.
- Suitable for multi-school deployments.

## Cost Reduction

- Lower CPU utilization.
- Reduced database load.
- Less memory consumption during rendering.
- Optional removal of Celery infrastructure.

## Maintainability

- Single source of truth for rendering.
- Reusable frontend components.
- Simplified backend endpoints.
- Easier debugging and testing.

## Reliability

- Immutable result snapshots.
- Consistent PDFs regardless of future data changes.
- Easier auditing and rollback.

---

# 20. Future Enhancements

- Snapshot compression for large payloads.
- Incremental (patch-based) snapshot updates instead of full rewrites.
- Event-driven architecture using Django signals or domain events.
- Snapshot integrity hashes to detect corruption.
- Redis caching for frequently accessed snapshots.
- Version comparison tools for auditing changes.
- Offline result viewing through cached JSON.
- Parent portal and mobile app consuming the same snapshot.
- Analytics dashboards powered directly by class snapshots.
- Multi-term cumulative snapshots for longitudinal student performance.

---

# Conclusion

This architecture transforms result processing from a **request-time computation model** into a **write-time computation model**. Every calculation is performed exactly once—when data changes—and every subsequent operation (previewing, printing, exporting, or downloading) simply consumes a precomputed snapshot.

The result is a system that is faster, more scalable, easier to maintain, and significantly more cost-efficient. By treating the snapshot as the canonical rendering artifact, the application minimizes database activity, reduces infrastructure requirements, enables consistent outputs across clients, and positions the platform to support future capabilities such as offline access, analytics, and multi-school deployments without fundamental architectural changes.