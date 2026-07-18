# School Portal Architecture Documentation

# Chapter 04 — Project Structure & Code Organization

> **Version:** 2.0  
> **Document Type:** Software Architecture Documentation (SAD)  
> **Project:** School Portal Management System  
> **Status:** Draft  
> **Prerequisite:** Chapter 03 — Business Domain Model

---

# Executive Summary

A software system can quickly become difficult to maintain if its source code lacks organization. As features grow, unclear boundaries between modules often lead to duplicated logic, circular dependencies, and code that is difficult to test or extend.

This chapter defines how the School Portal source code is organized and establishes the architectural conventions that every part of the project follows.

Rather than organizing the application by technical layers alone, the backend is organized around **business domains**, while the frontend is organized around **application features and user experience**.

The objective is to ensure that every module has a clearly defined responsibility and can evolve independently without negatively affecting the rest of the system.

---

# 1. Design Goals

The project structure is designed to achieve the following objectives:

- High maintainability
- Low coupling
- High cohesion
- Easy navigation
- Feature isolation
- Reusable business logic
- Simplified testing
- Scalability

Every new feature should have an obvious location within the project.

---

# 2. Overall Architecture

The project consists of two independent applications communicating through REST APIs.

```text
School Portal

├── Frontend (Next.js)

└── Backend (Django REST Framework)
```

This separation allows both applications to evolve independently while communicating through a stable API contract.

---

# 3. Backend Organization

The backend follows a **domain-driven modular architecture**.

Instead of placing all models or views into a single application, each major business area owns its models, serializers, views, services, and permissions.

```text
backend/

├── accounts/

├── academics/

├── students/

├── teachers/

├── results/

├── payments/

├── core/

├── config/

└── media/
```

Each application is responsible for a single business domain.

---

# 4. Responsibilities of Each Application

## accounts/

Responsible for authentication and identity.

Contains:

- User model
- Authentication
- Login
- Password management
- JWT integration
- Profile management
- User permissions

This application should never contain academic logic.

---

## academics/

Responsible for academic configuration.

Contains:

- Sessions
- Terms
- Classes
- Arms
- Subjects
- Subject assignments

This application defines the academic structure upon which all other modules depend.

---

## students/

Responsible for student lifecycle management.

Contains:

- Student profiles
- Enrollments
- Admissions
- Guardian information
- Student imports

---

## teachers/

Responsible for teacher management.

Contains:

- Teacher profiles
- Teacher assignments
- Class teacher allocation

---

## results/

Responsible for academic processing.

Contains:

- Score entry
- Result computation
- Snapshot generation
- Approval workflow
- Release workflow
- Broadsheets
- PDF preparation
- Grading
- Charts

This is the computational core of the application.

---

## payments/

Responsible for financial records.

Contains:

- School fees
- Outstanding balances
- Payment summaries

Future payment gateway integrations will also reside here.

---

## core/

Contains reusable infrastructure.

Examples include:

- Utility functions
- Shared mixins
- Base classes
- Constants
- Common validators
- Storage utilities

Business logic should not live inside this module.

---

## config/

Contains project-wide configuration.

Examples:

- Django settings
- URLs
- ASGI
- WSGI
- Celery/Django-Q configuration (if used)
- Logging configuration

---

# 5. Recommended Internal Structure

Every Django application should follow a consistent internal layout.

```text
results/

├── models.py

├── serializers.py

├── views.py

├── urls.py

├── permissions.py

├── filters.py

├── admin.py

├── services/

│   ├── computation.py

│   ├── snapshots.py

│   ├── pdf.py

│   ├── charts.py

│   └── statistics.py

├── utils/

├── selectors/

├── tests/

└── migrations/
```

As the application grows, services should be separated into dedicated files rather than becoming one large module.

---

# 6. Why a Service Layer?

Business logic should not be placed inside:

- Views
- Serializers
- Models

Instead:

```text
View

↓

Service

↓

Database
```

For example:

```text
ResultView

↓

ResultComputationService

↓

SnapshotService

↓

ChartService

↓

Repository
```

This separation provides:

- Better readability
- Easier testing
- Reusable logic
- Smaller views
- Smaller serializers

---

# 7. Selector (Query) Layer

As database queries become more complex, query logic should be separated from business logic.

Instead of:

```python
Result.objects.filter(...).select_related(...)
```

inside multiple services, create dedicated selectors.

Example:

```text
selectors/

student_results.py

class_statistics.py

subject_statistics.py

teacher_dashboard.py
```

Responsibilities:

- Optimized queries
- Related object loading
- Aggregations
- Filtering

This keeps services focused on business rules rather than query construction.

---

# 8. Utility Layer

Utility modules contain generic helper functions.

Examples:

- Date formatting
- Number formatting
- Storage helpers
- File utilities

Utilities must remain stateless and independent of business rules.

---

# 9. Frontend Organization

The frontend follows the **Next.js App Router** architecture.

Recommended structure:

```text
frontend/

app/

components/

hooks/

lib/

services/

types/

contexts/

styles/

public/
```

The objective is to separate presentation from networking and reusable logic.

---

# 10. Frontend Responsibilities

## app/

Contains application routes.

Each folder represents a page or feature.

---

## components/

Reusable UI components.

Examples:

- Tables
- Forms
- Cards
- Charts
- Dialogs
- Buttons
- Result sheet

Components should avoid API calls whenever possible.

---

## hooks/

Contains reusable React hooks.

Examples:

- useAuth()
- usePagination()
- useDebounce()
- useResultPreview()

---

## lib/

Contains shared frontend utilities.

Examples:

- API client
- Authentication helpers
- Constants
- Validation

---

## services/

Contains API communication.

Example:

```text
StudentService

↓

GET /students/

POST /students/

DELETE /students/
```

Centralizing API calls makes the frontend easier to maintain and test.

---

## contexts/

Contains React Context providers.

Examples:

- Authentication
- Theme
- Notifications

Avoid storing large business data here.

---

## types/

Contains shared TypeScript definitions.

Examples:

- Student
- Result
- Snapshot
- Attendance

---

# 11. Dependency Rules

Modules should communicate in one direction only.

```text
Frontend

↓

API

↓

Views

↓

Services

↓

Selectors

↓

Database
```

Reverse dependencies should never occur.

For example:

A selector must never call a service.

A model must never call a view.

---

# 12. Import Conventions

Follow a predictable import order.

1. Python standard library
2. Third-party libraries
3. Django
4. Internal applications
5. Local imports

Example:

```python
import uuid

from django.db import transaction

from rest_framework import serializers

from students.models import Student

from .services.snapshots import SnapshotService
```

Consistency improves readability.

---

# 13. Naming Conventions

Use descriptive names that reflect business intent.

Examples:

Good:

- StudentSnapshotService
- ResultComputationService
- AttendanceSelector
- ClassStatisticsService

Avoid:

- Utils2
- HelperFunctions
- ProcessData
- ManagerClass

Names should explain purpose without requiring implementation knowledge.

---

# 14. Code Ownership

Each module owns its data.

Example:

```text
accounts

↓

Owns Users
```

```text
students

↓

Owns Students
```

```text
results

↓

Owns Snapshots
```

Other modules should communicate through services or APIs rather than directly modifying another module's internal logic.

---

# 15. Architectural Boundaries

The following boundaries should always be respected.

| Layer     | Responsibility                    |
| --------- | --------------------------------- |
| Frontend  | User interaction and presentation |
| API       | Request handling and validation   |
| Services  | Business rules                    |
| Selectors | Database queries                  |
| Models    | Data representation               |
| Storage   | Files and media                   |

Crossing these boundaries unnecessarily increases coupling and reduces maintainability.

---

# 16. Future Refactoring Strategy

As the platform grows, the following improvements may be introduced:

- Dedicated `services/` package for every application.
- Domain event dispatcher.
- Repository abstraction for complex persistence logic.
- Background worker package.
- Plugin architecture for future school-specific customizations.

The current organization supports these changes without requiring major restructuring.

---

# 17. Design Decisions

| Decision               | Rationale                                            |
| ---------------------- | ---------------------------------------------------- |
| Domain-based apps      | Aligns code with business concepts.                  |
| Service layer          | Keeps business logic independent of HTTP concerns.   |
| Selector layer         | Centralizes optimized database queries.              |
| Shared utilities       | Reduces duplication without coupling business logic. |
| Feature-based frontend | Improves discoverability and scalability.            |
| Separate API services  | Keeps networking independent of UI components.       |

---

# 18. Key Takeaways

The project structure is intentionally organized around **business capabilities rather than technical implementation details**.

Every application owns a specific domain, every layer has a clearly defined responsibility, and dependencies flow in a single direction. This organization minimizes coupling, improves readability, simplifies onboarding for new contributors, and provides a stable foundation for future expansion of the School Portal.

A well-defined project structure is not merely a matter of code organization—it is an architectural decision that directly influences the maintainability, scalability, and long-term success of the system.

---

**End of Chapter 04 — Project Structure & Code Organization**
