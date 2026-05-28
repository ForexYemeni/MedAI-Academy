# Lesson Management UI - Task Summary

## Completed Changes

### 1. Lessons API - PUT and DELETE methods
**File**: `/home/z/my-project/src/app/api/courses/manage/lessons/route.ts`
- Added `PUT` handler for updating lessons (auth required, takes lessonId + updates)
- Added `DELETE` handler for deleting lessons (auth required, takes lessonId + courseId query params, decrements lessonsCount)

### 2. Admin Page - Lesson Management UI
**File**: `/home/z/my-project/src/components/med/pages/admin-page.tsx`

**New imports**: `FileText`, `Video`, `ArrowRight` from lucide-react

**New state variables** (after course state ~line 252):
- `selectedCourseForLessons` - tracks which course's lessons are being managed
- `lessons` - array of lesson data
- `lessonsLoading` - loading state
- `lessonDialogOpen` - create/edit dialog visibility
- `editingLesson` - lesson being edited (null for create)
- `lessonForm` - form state for lesson fields
- `lessonSaving` - saving state
- `deleteLessonId` - lesson to delete (null hides dialog)

**New functions** (after course actions ~line 507):
- `fetchLessons(courseId)` - fetches lessons from API
- `openCreateLesson()` - resets form, opens create dialog
- `openEditLesson(lesson)` - populates form, opens edit dialog
- `handleSaveLesson()` - creates or updates lesson via API
- `handleDeleteLesson()` - deletes lesson via API

**Modified renderCoursesContent**: Added BookOpen icon button (purple) next to edit/delete buttons in each course row. Clicking it sets `selectedCourseForLessons` and fetches lessons.

**New renderLessonsContent function** (~line 1330):
- Back button to return to courses list
- Course title and lesson count badge
- Lessons table with columns: #, title, type, duration, isFree, published, actions
- Add lesson button
- Create/edit dialog with:
  - titleAr input
  - type select (article/video/pdf/quiz)
  - duration number input
  - Content textarea (shown for article type)
  - Video URL + videoType select (shown for video type)
  - isFree and published checkboxes
- Delete confirmation dialog

**Updated content area rendering** (~line 2254):
- When `activeSection === 'courses'` and `selectedCourseForLessons` is set, renders `renderLessonsContent()` instead of `renderCoursesContent()`

## Lint Status
- 0 errors, 2 pre-existing warnings (unrelated alt-text warnings)
- App compiles and runs successfully on port 3000
