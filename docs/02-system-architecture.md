# School Portal Architecture Documentation

# Chapter 02 — System Architecture

> **Version:** 2.0  
> **Document Type:** Software Architecture Documentation (SAD)  
> **Project:** School Portal Management System  
> **Status:** Draft  
> **Prerequisite:** Chapter 01 — Project Overview

---

# 1. Introduction

This chapter describes the overall system architecture of the School Portal Management System.

Rather than focusing on individual modules, this chapter explains **how the major parts of the system interact**, how requests flow through the application, and the architectural decisions that make the platform scalable, maintainable, and performant.

The architecture follows a layered, service-oriented design with clear separation between presentation, business logic, persistence, and storage.

---

# 2. Architectural Philosophy

The platform is designed around five core architectural principles:

- Modularity
- Separation of Concerns
- Snapshot-Driven Rendering
- API-First Communication
- Performance by Design

Unlike traditional school systems that compute academic data every time a result is requested, this platform performs expensive computations **once**, stores the output as immutable snapshots, and serves those snapshots to every consumer.

This significantly reduces CPU usage, database load, and response times.

---

# 3. High-Level System Architecture

```text
                        USERS
────────────────────────────────────────────────────

Administrator
Teacher
Student
Parent (Future)

                │
                ▼

         Next.js Frontend
────────────────────────────────────────────────────

Authentication

Dashboard

Academic Modules

Result Preview

PDF Rendering

Administration

                │
         REST API (HTTPS)
                │

                ▼

         Django REST Backend
────────────────────────────────────────────────────

Authentication Layer

Permission Layer

Application Services

Business Logic

Snapshot Engine

Validation

Database Access

                │

      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼

 PostgreSQL         Backblaze Storage

Academic Data        Images
Snapshots            PDFs
Users                Signatures
Results              Logos
```

---

# 4. Layered Architecture

The system is divided into multiple logical layers.

```text
Presentation Layer

↓

API Layer

↓

Service Layer

↓

Domain Layer

↓

Persistence Layer

↓

Storage Layer
```

Each layer has a clearly defined responsibility.

---

# 5. Presentation Layer

The Presentation Layer is implemented using **Next.js** and React.

Responsibilities include:

- Rendering pages
- Managing user interaction
- Authentication state
- Calling backend APIs
- Rendering snapshots
- Client-side PDF generation
- Form validation

The frontend contains **no business logic** relating to academic computations.

All calculations occur on the backend.

---

# 6. API Layer

The API Layer is implemented using Django REST Framework.

Responsibilities include:

- Request validation
- Authentication
- Authorization
- Serialization
- Input sanitization
- Response formatting

The API acts as the gateway between the frontend and the backend services.

---

# 7. Service Layer

The Service Layer contains the application's business logic.

Instead of placing complex logic inside views or serializers, dedicated services perform operations such as:

- Result computation
- Snapshot generation
- Position calculation
- Grade assignment
- PDF preparation
- Class statistics
- Validation

Example:

```text
ResultView

↓

ResultService

↓

SnapshotService

↓

Database
```

Advantages:

- Easier testing
- Better maintainability
- Smaller views
- Reusable logic

---

# 8. Domain Layer

The Domain Layer represents the business entities of the school.

Examples include:

- Student
- Teacher
- Class
- Subject
- Session
- Term
- Result
- Attendance
- Behaviour
- Fees

These models describe the school's academic domain independently of presentation concerns.

---

# 9. Persistence Layer

The Persistence Layer is responsible for storing application data.

Implemented using:

- Django ORM
- PostgreSQL

Responsibilities include:

- Reading data
- Writing data
- Transactions
- Indexes
- Constraints

Business rules should not reside here.

---

# 10. Storage Layer

Large binary assets are stored outside the database.

Examples include:

- Student photographs
- School logos
- Header images
- Teacher signatures
- Generated PDFs

Current storage provider:

- Backblaze B2

Advantages:

- Lower database size
- Faster backups
- CDN compatibility
- Scalable storage

---

# 11. Application Modules

The backend is organized into independent applications.

```text
accounts/

academics/

students/

teachers/

results/

payments/

notifications (future)

analytics (future)
```

Each application owns its own responsibilities and data models.

---

# 12. Request Lifecycle

A typical request follows this flow.

```text
User

↓

Next.js

↓

REST API

↓

Authentication

↓

Permission Check

↓

View

↓

Service

↓

Database

↓

Service

↓

Serializer

↓

JSON Response

↓

Frontend
```

This ensures that responsibilities remain clearly separated.

---

# 13. Result Processing Workflow

Traditional systems perform computations during every result request.

This platform follows a different approach.

```text
Teacher Enters Scores

↓

Validate Scores

↓

Store Results

↓

Compute Student Totals

↓

Compute Grades

↓

Compute Positions

↓

Generate Student Snapshot

↓

Update Class Snapshot

↓

Store Snapshot JSON

↓

Completed
```

Subsequent requests never repeat these computations.

---

# 14. Snapshot Rendering Workflow

When a student opens a result:

```text
Student

↓

Request Snapshot

↓

Load JSON

↓

Render Result Page

↓

Render PDF

↓

Download
```

No expensive database queries occur during rendering.

---

# 15. Authentication Flow

```text
Login

↓

Credentials

↓

JWT Generated

↓

Access Token

↓

Frontend Stores Token

↓

Authenticated Requests

↓

Permission Validation
```

Authentication is completely stateless.

---

# 16. Data Flow Overview

The system operates using three primary data flows.

## Administrative Flow

```text
Administrator

↓

Configure School

↓

Sessions

↓

Terms

↓

Classes

↓

Subjects

↓

Teachers
```

---

## Academic Flow

```text
Teacher

↓

Enter Scores

↓

Results Saved

↓

Snapshots Updated

↓

Results Approved

↓

Results Released
```

---

## Student Flow

```text
Student

↓

Login

↓

View Dashboard

↓

View Snapshot

↓

Print Result

↓

Logout
```

---

# 17. Snapshot-Driven Architecture

The Snapshot Engine is the foundation of the Result Engine v2.

Instead of querying multiple database tables whenever a result is needed, the engine stores a complete representation of the student's academic record as a JSON document.

```text
Result Data

↓

Snapshot Engine

↓

Student Snapshot

↓

Class Snapshot

↓

Preview

Print

PDF

Analytics
```

The snapshot becomes the authoritative rendering document.

---

# 18. Database Interaction Strategy

The architecture minimizes database traffic using several techniques.

## Bulk Operations

Instead of:

```python
for student in students:
    student.save()
```

Use:

```python
bulk_create()

bulk_update()
```

---

## Optimized Queries

Prefer:

- select_related()
- prefetch_related()

Avoid:

- N+1 query patterns
- repeated lookups

---

## Immutable Snapshots

Once approved, snapshots should no longer be modified.

Benefits:

- Consistency
- Auditability
- Version control

---

# 19. Scalability Strategy

The architecture is designed to scale both vertically and horizontally.

Current deployment supports a single school.

Future architecture supports:

```text
School A

School B

School C

↓

Shared Platform

↓

Independent Data

↓

Shared Infrastructure
```

without major architectural changes.

---

# 20. Fault Isolation

Each module operates independently.

For example:

A failure in:

- Attendance

should not affect:

- Authentication
- Student Management
- Result Viewing

Likewise, a storage outage should not prevent users from logging in or accessing non-media features.

This modularity improves system resilience and simplifies troubleshooting.

---

# 21. Architectural Decisions

The following decisions shape the overall design of the system.

| Decision               | Reason                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| Next.js Frontend       | Modern React framework with excellent performance and routing             |
| Django REST Framework  | Mature, secure, and maintainable backend framework                        |
| PostgreSQL             | Reliable relational database with strong indexing and transaction support |
| Backblaze B2           | Cost-effective object storage for media assets                            |
| JWT Authentication     | Stateless authentication suitable for REST APIs                           |
| Snapshot-Based Results | Eliminates repeated computations and reduces database load                |
| Service Layer          | Keeps business logic out of views and serializers                         |
| JSON Snapshots         | Fast rendering, reusable data, and simplified PDF generation              |
| Frontend PDF Rendering | Reduces backend CPU usage and infrastructure costs                        |

---

# 22. Future Architectural Enhancements

As the platform evolves, the following improvements may be introduced.

- Event-driven architecture
- Domain events
- Message queues
- Redis caching
- WebSocket notifications
- Multi-tenant SaaS architecture
- Microservices (only if justified by scale)
- Analytics engine
- Parent portal
- Mobile applications

These enhancements can be incorporated without major redesign because of the modular architecture established in the current system.

---

# 23. Summary

The School Portal adopts a layered, modular architecture that separates presentation, business logic, persistence, and storage into distinct responsibilities.

By introducing a snapshot-driven result engine, the platform shifts expensive computations from request time to write time, enabling fast previews, efficient PDF generation, and consistent outputs across all clients.

This architecture prioritizes maintainability, scalability, performance, and cost efficiency, providing a strong foundation for future growth into a multi-school platform while remaining simple enough to support the needs of a single institution today.

---

**End of Chapter 02 — System Architecture**
