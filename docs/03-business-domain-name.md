# School Portal Architecture Documentation

# Chapter 03 — Business Domain Model

> **Version:** 2.0  
> **Document Type:** Software Architecture Documentation (SAD)  
> **Project:** School Portal Management System  
> **Status:** Draft  
> **Prerequisite:** Chapter 02 — System Architecture

---

# Executive Summary

Before software can be designed correctly, the problem domain must first be understood.

The **Business Domain Model** defines the real-world entities that exist within the school environment and the relationships between them. Rather than describing databases or APIs, this chapter describes **the business itself**.

Every feature within the application is built upon these domain concepts.

---

# 1. Purpose

The purpose of this chapter is to define:

- The core business entities.
- Their responsibilities.
- Their relationships.
- Their lifecycle.
- The business rules that govern them.

This serves as the conceptual foundation for every module developed within the application.

---

# 2. Domain Philosophy

The system models a school as a collection of interconnected academic entities.

Unlike CRUD-based applications where data is viewed as isolated tables, this architecture models real-world academic processes.

For example:

A student does not simply "belong to a class."

Instead,

- the student enrolls
- during a session
- into a class
- studies subjects
- receives assessments
- accumulates results
- generates reports.

This distinction influences how the entire application is designed.

---

# 3. High-Level Domain Overview

```text
School

│

├── Academic Sessions

│      ├── Terms

│      │

│      ├── Classes

│      │      ├── Subjects

│      │      ├── Teachers

│      │      └── Students

│      │

│      └── Academic Activities

│             ├── Attendance

│             ├── Behaviour

│             ├── Results

│             ├── Fees

│             └── Comments
```

---

# 4. Core Business Entities

The platform revolves around several primary business entities.

These entities represent real-world objects within the school.

---

## School

The School represents the institution itself.

Responsibilities include:

- Branding
- Academic configuration
- Assets
- Result customization
- Grading policies
- Administrative settings

The school acts as the root of the entire domain.

---

## Academic Session

An Academic Session represents a complete academic year.

Example:

```
2025 / 2026
```

Responsibilities:

- Defines enrollment period.
- Groups academic terms.
- Determines active students.
- Maintains historical records.

Business Rules:

- Only one active session.
- Students enroll per session.
- Historical sessions remain immutable.

---

## Academic Term

Each session contains multiple terms.

Example:

```
First Term

Second Term

Third Term
```

Responsibilities:

- Organize assessments.
- Store results.
- Track attendance.
- Manage comments.

Business Rules:

- Every term belongs to exactly one session.
- Active term must belong to active session.

---

## Class

Represents a teaching group.

Examples:

```
JSS1A

JSS2B

SS3 Science
```

Responsibilities:

- Student grouping.
- Subject allocation.
- Teacher assignment.
- Result aggregation.

---

## Subject

Represents an academic discipline.

Examples:

```
Mathematics

English

Chemistry

Biology
```

Responsibilities:

- Assessment.
- Grading.
- Performance tracking.

---

## Teacher

Represents an academic staff member.

Responsibilities:

- Subject instruction.
- Assessment entry.
- Attendance.
- Behaviour.
- Comments.

Teachers are assigned to subjects rather than owning student data.

---

## Student

Represents an enrolled learner.

Responsibilities:

- Attend classes.
- Receive assessments.
- Generate results.
- Maintain academic history.

A student exists independently of enrollment.

Enrollment determines where the student belongs during a specific session.

---

## Enrollment

Enrollment connects:

Student

↓

Session

↓

Class

This entity captures the student's academic placement.

Business Rules:

- One active enrollment per session.
- Historical enrollments preserved.
- Students may change classes across sessions.

---

## Assessment

Assessment captures academic performance.

Examples:

- CA
- Assignment
- Examination

Assessments eventually produce Results.

---

## Result

Represents the final computed score for a subject.

Contains:

- Scores
- Grade
- Remark
- Subject Position

Results are considered intermediate data.

Snapshots become the final rendering document.

---

## Attendance

Tracks student participation.

Responsibilities:

- Days Present
- Days School Opened
- Attendance Percentage

---

## Behaviour

Captures non-academic evaluations.

Examples:

- Punctuality
- Neatness
- Honesty
- Leadership

---

## Fees

Represents financial obligations.

Used for:

- Outstanding balances
- Report display
- Parent information

---

## Snapshot

A Snapshot represents a complete academic document.

Unlike Results, which are fragmented across multiple tables, a Snapshot aggregates all information required to render a report.

Contents include:

- Student details
- Subjects
- Summary
- Attendance
- Behaviour
- Comments
- Assets
- Chart data
- Grades
- Positions

Snapshots are immutable after approval.

---

# 5. Entity Relationships

The following simplified relationship illustrates how the domain is connected.

```text
School

↓

Academic Session

↓

Term

↓

Class

├── Teacher

├── Subject

└── Enrollment

↓

Student

↓

Result

↓

Snapshot
```

---

# 6. Academic Lifecycle

The platform models the lifecycle of an academic period.

```text
Session Created

↓

Terms Configured

↓

Students Enrolled

↓

Subjects Assigned

↓

Teachers Assigned

↓

Assessments Recorded

↓

Results Computed

↓

Snapshots Generated

↓

Results Approved

↓

Results Released

↓

Session Archived
```

---

# 7. Domain Events

Several important events occur within the system.

Examples include:

### Student Enrolled

Triggers:

- Enrollment creation.
- Class allocation.

---

### Scores Submitted

Triggers:

- Result computation.
- Snapshot update.

---

### Final Subject Submitted

Triggers:

- Position calculation.
- Class statistics.
- Snapshot finalization.

---

### Result Approved

Triggers:

- Snapshot locking.
- Audit record.

---

### Result Released

Triggers:

- Student visibility.
- Parent visibility (future).

---

# 8. Aggregate Boundaries

The architecture groups related entities into aggregates.

```text
Academic Aggregate

Session

Term

Class

Subject
```

```text
Student Aggregate

Student

Enrollment

Attendance

Behaviour
```

```text
Assessment Aggregate

Assessment

Result

Snapshot
```

Keeping aggregates separate reduces coupling and simplifies maintenance.

---

# 9. Business Rules

Some fundamental business rules include:

- One active academic session.
- One active enrollment per student per session.
- Results cannot exist without enrollment.
- Snapshots cannot exist without results.
- Approved results become immutable.
- Released results are read-only.
- Historical data must never be overwritten.

---

# 10. Domain-Driven Design Considerations

Although the application is not a full Domain-Driven Design (DDD) implementation, several DDD principles are adopted:

- Rich business model.
- Service layer for domain logic.
- Aggregate boundaries.
- Domain events.
- Ubiquitous language.

This keeps business rules centralized and reduces duplication across the codebase.

---

# 11. Design Decisions

| Decision | Rationale |
|-----------|-----------|
| Enrollment is separate from Student | Preserves academic history across sessions. |
| Results are intermediate records | Allows recalculation without affecting published documents. |
| Snapshots are immutable | Ensures consistency, auditing, and reliable report generation. |
| Sessions own Terms | Reflects the academic calendar accurately. |
| Teachers own assessments, not students | Matches real-world teaching responsibilities. |

---

# 12. Key Takeaways

The Business Domain Model establishes a shared understanding of the school's academic ecosystem.

By modelling real-world concepts such as enrollment, assessment, results, and snapshots as distinct business entities, the platform remains intuitive, extensible, and aligned with actual school operations.

Every subsequent architectural decision—including the database schema, APIs, result engine, and snapshot architecture—is built upon the domain model defined in this chapter.

---

**End of Chapter 03 — Business Domain Model**