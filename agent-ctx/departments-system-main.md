# Task: Departments (أقسام) System Implementation

## Summary
Implemented a comprehensive "Departments" system for the medical education app, including MongoDB schema, API routes, admin UI management, and user-facing course reorganization.

## Changes Made

### 1. MongoDB Schema (`src/lib/mongodb-schema.ts`)
- Added `MongoDepartment` interface with fields: nameAr, nameEn, icon, color, description, order, published, createdAt, updatedAt
- Added `departmentId?: ObjectId` and `recommended?: boolean` fields to `MongoCourse` interface
- Added seed data for 6 default departments: تمريض, قبالة, مساعد طبيب, مختبرات, صيدلة, أشعة

### 2. Departments API (`src/app/api/departments/route.ts`) - NEW FILE
- **GET**: Fetch departments (public sees only published, admin sees all), includes course counts (free/paid)
- **POST**: Create department (admin only)
- **PUT**: Update department (admin only)
- **DELETE**: Delete department (admin only), unsets departmentId on related courses

### 3. Admin Courses API (`src/app/api/admin/courses/route.ts`)
- POST now accepts `departmentId` and `recommended` fields
- PUT now handles `departmentId` conversion (to ObjectId or unset) and `recommended`

### 4. Public Courses API (`src/app/api/courses/route.ts`)
- Added `departmentId`, `recommended`, and `recent` query filter support
- Response now includes `departmentId` (as string) and `recommended` fields
- `?recommended=true` filter for recommended courses
- `?recent=true` filter for courses from last 3 days
- `?departmentId=xxx` filter for courses by department

### 5. Admin Page (`src/components/med/pages/admin-page.tsx`)
- Added `ApiDepartment` interface
- Added 'departments' to AdminSection type
- Added "الأقسام" sidebar item with Layer icon (before courses)
- Added department state variables and `fetchDepartments` function
- Added `DepartmentsManagement` component with:
  - List of departments with icon, names, color, order, published status, course counts
  - Add/Edit department form with nameAr, nameEn, icon, color, description, order, published
  - Delete confirmation dialog
  - Professional styling matching existing admin UI
- Modified `CourseForm` component:
  - Added department dropdown (fetched from /api/departments)
  - Added recommended toggle (موصى بها) with purple highlight
- Updated initial data loading to include departments
- Updated loadSectionData for 'departments' section

### 6. Courses Page (`src/components/med/pages/courses-page.tsx`)
- Added department state and fetch logic
- Added new course categorizations:
  - `recommendedCourses` - courses with recommended=true
  - `recentCourses` - courses from last 3 days
  - `coursesWithoutDepartment` - courses without departmentId
- Reorganized course display to:
  1. "موصى بها ✨" (Recommended) - horizontal scrollable row
  2. Per-department sections (free + paid rows per department)
  3. "حديثاً ✨" (Recent) - courses from last 3 days
  4. "أخرى 📚" (Other) - courses without department
- Updated featured course banner badge from "موصى به/رائج" to "موصى بها/مميز"

### 7. App Store (`src/store/app-store.ts`)
- Added `departmentId?: string | null` and `recommended?: boolean` and `createdAt?: string` to Course interface

## Pre-existing Issues (NOT introduced by this task)
- MongoDB URI not configured in environment (all API endpoints fail)
- Lint warnings in notification-center.tsx, theme-provider.tsx, ai-tutor-page.tsx, course-detail-page.tsx
- React hooks set-state-in-effect warnings in existing code
