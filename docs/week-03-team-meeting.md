# WDD 430 Week 03 Team Meeting and Project Planning

**Project:** Instituto Salvador Moncada Records  
**Meeting:** Week 03 synchronous team meeting  
**Date:** Thursday, November 12, 2026  
**Recorded meeting time:** 9:30 AM - 12:25 PM  
**Repository:** [dantonifa/ism-records-api](https://github.com/dantonifa/ism-records-api)  
**Project board:** [ISM Records API Tasks](https://github.com/users/dantonifa/projects/3)

## Team meeting summary

### Members present

- Abdullahi Bolutife Mohammed
- Emmanuel Okon Bassey
- David Antonio Fajardo Ponce
- Obiri Bempa Asiedu
- Christina Dobbins

David Antonio Fajardo Ponce served as the project coordinator for this phase.
The notes supplied for the meeting do not record the next meeting's group
leader selection.

### Major decisions

1. The team will continue building Instituto Salvador Moncada Records as the
   shared project through the MVP, targeted for Week 07.
2. MongoDB with Mongoose is the selected database solution. The application
   reads its connection string from `MONGODB_URI`; credentials must not be
   committed to the repository.
3. The target frontend architecture is Next.js App Router with React,
   TypeScript strict mode, and responsive Tailwind CSS. The repository also
   contains an existing Express/Mongoose API and legacy static pages; feature
   work should preserve the behavior of the area being changed while the
   architecture is consolidated.
4. Authentication and session-provider selection remains open. Auth.js v5,
   Clerk, or an approved team implementation may be evaluated before the
   authentication module is finalized. Server-side authorization and input
   validation are required regardless of provider.
5. Render remains the proposed deployment platform.
6. The team will use feature branches, regular commits, pull requests, peer
   review, and `main` for integrated work. Blockers should be communicated
   early and progress should be kept current on the project board.
7. The MVP scope is account access, role-based permissions, students, courses,
   enrollments, grades, and academic history.

## Responsibilities

| Team member | Responsibilities |
| --- | --- |
| Emmanuel Bassey | Registration, login, sessions, password security, roles, permissions, protected routes, and protected API endpoints |
| Abdullahi Mohammed | Student registration and profiles, student CRUD, search/filtering, and student form validation |
| David Antonio Fajardo Ponce | Course CRUD and validation, project coordination, integration, and deployment |
| Obiri Bempa Asiedu | Enrollment CRUD, duplicate-enrollment prevention, and student/course reference validation |
| Christina Dobbins | Grade entry and management, grade validation, authorized grade modifications, and academic history |

### Coordination and dependencies

- Authentication and authorization are foundational dependencies for all
  protected modules.
- Shared data-model and API conventions must be agreed on before dependent
  features are integrated.
- The student model and validation rules precede student CRUD API work.
- The student API precedes student pages, forms, and search/filtering.
- Course and student identifiers must be available before enrollment validation
  can be completed.
- Enrollment data must exist before grade and academic-history features can be
  completed.
- Team members will work in feature branches, push changes regularly, open
  pull requests, review one another's work, and merge through `main`.
- The team agreed to maintain regular project-board updates and communicate
  blockers early. A specific daily check-in schedule was not recorded and
  should be confirmed asynchronously in Teams.

## Project setup and workflow

### Local setup

```bash
git clone https://github.com/dantonifa/ism-records-api.git
cd ism-records-api
npm install
npm run dev
```

Open `http://localhost:3000` to verify the local application. The application
uses `MONGODB_URI` for database access. A local `.env.local` file should be
used for development and must never be committed.

### Branch and pull-request workflow

1. Start from an updated `main` branch.
2. Create a focused branch, such as `feat/student-management`.
3. Make a small, reviewable change.
4. Run the smallest relevant validation command.
5. Commit with a clear message and push the branch.
6. Open a pull request against `main`.
7. Request review from a teammate.
8. Resolve feedback and merge only after approval.

Abdullahi's active branch is
[`feat/student-management`](https://github.com/dantonifa/ism-records-api/tree/feat/student-management).

## MVP pages and routes

These are the target MVP routes. Existing legacy pages and Express routes are
being consolidated gradually rather than migrated as unrelated work.

| Route | Purpose | Priority |
| --- | --- | --- |
| `/` | Application landing/dashboard entry point | P0 |
| `/login` | Sign in | P0 |
| `/register` | Account registration | P0 |
| `/students` | Search and browse student records | P0 |
| `/students/new` | Create a student profile | P0 |
| `/students/[id]` | View a student profile and academic history | P0 |
| `/students/[id]/edit` | Update a student profile | P0 |
| `/courses` | Browse and manage courses | P0 |
| `/courses/new` | Create a course | P0 |
| `/courses/[id]` | View, update, or remove a course | P0 |
| `/enrollments` | Manage student-course enrollments | P0 |
| `/grades` | Enter and manage grades | P0 |
| `/students/[id]/history` | View enrollment and grade history | P0 |
| `/account` | Manage the signed-in user's account | P1 |

## Component architecture

```text
App
├── AppShell
│   ├── Header
│   │   ├── BrandLogo
│   │   ├── Navigation
│   │   └── MobileMenuButton
│   ├── MainContent
│   └── Footer
├── Auth
│   ├── LoginForm
│   ├── RegistrationForm
│   └── ProtectedRoute / RoleGuard
├── Shared UI
│   ├── FormField
│   ├── Button
│   ├── DataTable
│   ├── SearchFilter
│   ├── LoadingState
│   ├── EmptyState
│   ├── ErrorMessage
│   └── ConfirmDialog
├── Students
│   ├── StudentList
│   ├── StudentTable
│   ├── StudentForm
│   ├── StudentProfile
│   └── AcademicHistory
├── Courses
│   ├── CourseList
│   ├── CourseForm
│   └── CourseDetails
├── Enrollments
│   ├── EnrollmentForm
│   └── EnrollmentList
└── Grades
    ├── GradeForm
    ├── GradeList
    └── GradeHistory
```

The highest-priority Week 04 components are the application shell, login and
registration forms, reusable form/feedback components, student list and
student form, course list/form, and the protected API boundary.

## Data model decision

MongoDB with Mongoose is the selected database solution. The core entities and
relationships are:

```text
Student 1 ───────< Enrollment >─────── 1 Course
                       │
                       └──────────────< Grade >────── 1 User (teacher)
```

### User

- `_id`
- authentication-provider identifier
- name and email
- role: `administrator`, `teacher`, or `staff`
- account status and timestamps

### Student

- `_id`
- unique student identifier
- name and contact/profile information
- grade level, section, and year where applicable
- timestamps and normal-use/archival status

### Course

- `_id`
- unique course identifier
- name, description, and status
- instructor or responsible staff reference where required
- timestamps

### Enrollment

- `_id`
- `studentId` reference
- `courseId` reference
- enrollment status and enrollment dates
- unique compound rule for the student-course pair

### Grade

- `_id`
- `enrollmentId` reference
- score or grading-period values
- teacher/user reference
- validation and audit timestamps

Student, course, enrollment, and grade references must be validated before
writes. Required fields, valid score ranges, unique identifiers, and duplicate
enrollment rules must be enforced at the service or database boundary.

## API conventions

The planned resource endpoints are:

```text
GET    /api/students
POST   /api/students
GET    /api/students/:id
PATCH  /api/students/:id
DELETE /api/students/:id

GET    /api/courses
POST   /api/courses
GET    /api/courses/:id
PATCH  /api/courses/:id
DELETE /api/courses/:id

GET    /api/enrollments
POST   /api/enrollments
GET    /api/enrollments/:id
PATCH  /api/enrollments/:id
DELETE /api/enrollments/:id

GET    /api/grades
POST   /api/grades
GET    /api/grades/:id
PATCH  /api/grades/:id
DELETE /api/grades/:id
```

Protected endpoints must perform server-side authentication and role checks.
Invalid input, duplicate enrollments, missing references, unauthorized
requests, and missing records must return explicit client-safe errors.

## Design, branding, and layout plan

### Brand direction

The application should retain Instituto Salvador Moncada branding, including
the school logo, Honduras imagery, and a clean academic records interface.
Existing image assets are in [`public/images`](../public/images/).

### Color palette

The following palette provides a consistent baseline from the existing project
diagram and current styles:

| Use | Color | Hex |
| --- | --- | --- |
| Primary navy | Headings, primary navigation, important actions | `#143B59` |
| Blue-gray | Borders, secondary text, diagrams | `#52728A` |
| Light background | Page background and workspace surfaces | `#F3F6FA` |
| Teal accent | Success states, selected controls, supportive highlights | `#2A9D8F` |
| Pale teal | Badges, informational surfaces, selected backgrounds | `#E9F4F4` |
| White | Cards, forms, tables, and content surfaces | `#FFFFFF` |
| Error red | Validation and destructive-action feedback | `#B42318` |

The current legacy pages also contain bright turquoise, lime, and yellow
values. These should be treated as existing legacy styling; new MVP
components should use the consistent palette above unless the team approves a
different branding pass.

### Typography

- Primary typeface: **Roboto**, matching the current site styles.
- Use a clear heading hierarchy: page title, section heading, card heading, and
  body text.
- Body text should prioritize readability with a line height near `1.5`.
- Use bold text for labels and navigation, not for long paragraphs.
- Use responsive sizing rather than fixed text sizes that cause mobile
  overflow.

### Layout and spacing

- Use a centered, responsive application shell with a maximum readable content
  width.
- Use a consistent spacing scale based on 4px units: `4px`, `8px`, `16px`,
  `24px`, and `32px`.
- Use cards or panels with white backgrounds, subtle borders, rounded corners,
  and clear grouping of related fields.
- Use a desktop two-column layout for text/detail and supporting content when
  appropriate; collapse to one column on small screens.
- Keep navigation horizontal on desktop and provide a clear mobile menu button
  and vertical menu on small screens.
- Make controls touch-friendly with comfortable padding and visible focus
  states.
- Keep tables usable on mobile through responsive columns, horizontal
  scrolling, or a stacked-card alternative.
- Every data page must include loading, empty, validation, and error states.

The current implementation demonstrates a responsive header, logo, navigation,
hero area, content cards, footer, and mobile menu in
[`app/page.jsx`](../app/page.jsx), [`app/layout.js`](../app/layout.js), and
[`public/styles`](../public/styles/).

## GitHub project management

The [ISM Records API Tasks project board](https://github.com/users/dantonifa/projects/3)
contains more than the required eight issues and is used for ownership and
progress tracking. The Week 04 milestone is attached to the highest-priority
work.

Important project issues include:

- [#10 Authentication and Role-Based Access](https://github.com/dantonifa/ism-records-api/issues/10)
- [#11 Student Management parent issue](https://github.com/dantonifa/ism-records-api/issues/11)
- [#12 Course Management](https://github.com/dantonifa/ism-records-api/issues/12)
- [#14 Enrollment Management](https://github.com/dantonifa/ism-records-api/issues/14)
- [#15 Grades and Academic History](https://github.com/dantonifa/ism-records-api/issues/15)
- [#18 Student model and validation](https://github.com/dantonifa/ism-records-api/issues/18)
- [#19 Student CRUD API](https://github.com/dantonifa/ism-records-api/issues/19)
- [#20 Student pages and forms](https://github.com/dantonifa/ism-records-api/issues/20)
- [#21 Student search and filtering](https://github.com/dantonifa/ism-records-api/issues/21)

Issues `#10`, `#11`, and `#18`-`#21` are assigned to the Week 04 milestone.
The four student child issues are linked to #11 and assigned to Abdullahi
Mohammed.

## Copilot instructions

The initial repository guidance is available in
[`.github/copilot-instructions.md`](../.github/copilot-instructions.md).
It records the project context, MongoDB decision, pending authentication
decision, domain model, API conventions, team ownership, and delivery
checklist.

## Submission evidence

- **Public repository:** https://github.com/dantonifa/ism-records-api
- **Project board:** https://github.com/users/dantonifa/projects/3
- **Local setup screenshot:** [ScreenshotHost300011-13.png](../ScreenshotHost300011-13.png)
- **Data model diagram:** [`project-diagram.svg`](./project-diagram.svg)
- **Project specification:** [`project-specification.md`](./project-specification.md)
- **Code review PR:** Add the URL of the pull request where your assigned
  teammate's Week 03 code review comments were submitted.

Before submitting in Canvas, confirm that the repository README lists all team
members and replace the code-review placeholder with the actual pull-request
URL. Confirm the next meeting's group leader and the team's exact async
check-in cadence in Teams if those decisions were made after the recorded
meeting.
