# Task 1: Admin Page Mobile Responsiveness & Remove "View as User"

## Summary
Fixed mobile responsiveness issues in the admin page and removed the "view as user" ability for admin accounts.

## Changes Made

### 1. admin-page.tsx - Mobile Responsiveness Fixes

#### Course Stats (lines ~914-930)
- Reduced padding on mobile: `p-3 sm:p-5` (was `p-4 sm:p-5`)
- Smaller icon containers on mobile: `rounded-lg sm:rounded-xl p-1.5 sm:p-2`
- Smaller icons on mobile: `h-3.5 w-3.5 sm:h-4 sm:w-4`
- Smaller title text on mobile: `text-[11px] sm:text-sm`
- Reduced value font size: `text-lg sm:text-2xl`

#### Course Header (lines ~972-1030)
- Changed container from `flex items-start gap-3` to `flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4` — actions now stack below on mobile
- Smaller course number badge: `w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl text-base sm:text-xl`
- Truncated title on mobile: `truncate max-w-[180px] sm:max-w-none`
- Smaller badge text: `text-[8px] sm:text-[9px]`
- Reduced stats text: `text-[10px] sm:text-xs flex-wrap`
- Hidden student count on mobile: `hidden sm:flex`
- Course actions aligned with title on mobile: `mr-11 sm:mr-0`
- Smaller action buttons: `h-7 w-7 sm:h-8 sm:w-8` with smaller icons

#### Lesson Rows (lines ~1078-1116)
- Reduced padding: `p-1.5 sm:p-3`
- Smaller order number: `w-6 h-6 sm:w-8 sm:h-8 text-[10px] sm:text-xs`
- Hidden type icon on mobile (type label shown in text): `shrink-0 hidden sm:block`
- Smaller title: `text-xs sm:text-sm`
- Smaller metadata text: `text-[9px] sm:text-xs`
- Hidden summary text on mobile: `hidden sm:inline`
- Shortened duration: `د` instead of `دقيقة` on mobile
- Smaller badges: `text-[8px] sm:text-[9px] px-1 sm:px-2`
- Smaller action buttons: `h-6 w-6 sm:h-7 sm:w-7`

#### Lesson Preview (line ~1124)
- Changed margin from `mr-9 sm:mr-12` to `mx-1 sm:mx-0 sm:mr-12` — full width on mobile
- Reduced padding: `p-2 sm:p-4`
- Smaller border radius: `rounded-lg sm:rounded-xl`
- Tighter spacing: `space-y-2 sm:space-y-3`

### 2. app-shell.tsx - Remove "View as User"

Changed the admin layout condition from:
```typescript
if (user.role === 'admin' && activePage === 'admin')
```
to:
```typescript
if (user.role === 'admin')
```

This ensures the admin always sees the admin panel layout and never has access to the regular user interface (home, courses, community, etc.).

## Verification
- ESLint passes with no errors
- Dev server running with no errors
- All changes preserve existing functionality (expand/collapse, CRUD operations, theme, RTL direction)
