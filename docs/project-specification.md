## Project Title & Description

Instituto Salvador Moncada Records is a full-stack web application that helps educational administrators, teachers, and staff manage student records in one centralized system. It replaces fragmented, manual, and paper-based record-keeping with secure access to student profiles, course enrollments, grades, and academic history.

The initial release focuses on account access, role-based permissions, student and course management, enrollments, and grades.

## Purpose & Target Audience

- **Audience:** Educational administrators, teachers, and staff at Instituto Salvador Moncada.
- **Purpose:** Reduce administrative bottlenecks and data-entry errors while providing authorized users with timely access to student records and academic history.

## User Stories

1. As a staff member, I want to create an account and sign in so that I can access the application according to my assigned role.
2. As an administrator, I want to manage user roles so that only authorized people can access or modify student records.
3. As an authorized staff member, I want to create and view student profiles so that I can maintain and find student information.
4. As an authorized staff member, I want to update and delete student profiles so that student records remain accurate and can be removed when appropriate.
5. As an administrator, I want to create, view, update, and delete courses so that the course catalog stays current.
6. As an authorized staff member, I want to manage student enrollments so that each student's courses are recorded accurately.
7. As an authorized teacher, I want to record and manage grades so that student academic performance is documented.
8. As an authorized staff member, I want to view a student's academic history so that I can quickly find their enrollments and grades.

## Acceptance Criteria

### Story 1: Create an account and sign in

- Given a new user, when they submit valid registration information, then the system creates an account.
- Given invalid registration information, when the form is submitted, then the system displays a validation message and does not create an account.
- Given a user with valid credentials, when they sign in, then they can access the application according to their assigned role.
- Given invalid credentials, when a user attempts to sign in, then the system denies access and displays an error.

### Story 2: Manage user roles

- Given an administrator, when they assign or change a user's role, then the system saves the updated permissions.
- Given a user without permission, when they attempt to access or change a protected record, then the system denies the request.
- Given a newly registered account, when it has not been granted a privileged role, then it cannot manage protected records.

### Story 3: Create and view student profiles

- Given an authorized staff member, when they submit a student profile with valid required information, then the system saves the profile.
- Given missing required information, when the profile is submitted, then the system highlights the errors and does not save it.
- Given an authorized staff member, when they search or browse student records, then the system displays matching profiles or an empty-state message.

### Story 4: Update and delete student profiles

- Given an authorized staff member, when they submit valid changes to a student profile, then the system saves and displays those changes.
- Given an authorized staff member, when they confirm the removal of a student profile, then the system removes it from normal use.
- Given a user without permission, when they attempt to update or delete a profile, then the system denies the request.

### Story 5: Manage courses

- Given an administrator, when they create a course with valid required information, then the system saves it and displays it in the course list.
- Given an administrator, when they view, update, or confirm removal of a course, then the system shows the course, saves valid changes, or removes it from normal use, respectively.
- Given missing or invalid course information, when the form is submitted, then the system displays a validation message and does not save it.

### Story 6: Manage enrollments

- Given an authorized staff member, when they enroll a student in a course, then the system saves the enrollment and displays it in the student's records.
- Given an existing enrollment for the same student and course, when another identical enrollment is submitted, then the system rejects the duplicate.
- Given an authorized staff member, when they view, update, or remove an enrollment, then the system displays it or saves the requested change.

### Story 7: Manage grades

- Given an authorized teacher, when they enter a valid grade for an enrollment, then the system saves and displays the grade.
- Given an invalid grade, when the teacher submits it, then the system displays a validation message and does not save it.
- Given an authorized teacher, when they view, update, or remove a grade, then the system displays it or saves the requested change.
- Given a user without permission, when they attempt to modify a grade, then the system denies the request.

### Story 8: View academic history

- Given an authorized staff member, when they open a student's academic history, then the system displays that student's enrollments and available grades.
- Given a student with no recorded enrollments or grades, when their history is opened, then the system displays an empty-state message.

## Technical Requirements

- **Framework:** Next.js App Router.
- **Language:** TypeScript in strict mode.
- **Styling:** Tailwind CSS with a consistent, responsive design for desktop and mobile.
- **Data:** PostgreSQL, MongoDB, or Supabase; the team will confirm the database.
- **Authentication:** Auth.js v5 (NextAuth.js) or Clerk for sign-in and session management; the team will confirm the provider.
- **Authorization:** Server-side role checks and input validation for protected records and API requests. Specific role permissions and account approval procedures require team confirmation.
- **Views:** Sign-in and account management, student records, courses and enrollments, and grades and academic history.
- **Components:** At least five reusable components across multiple pages, such as navigation, form fields, data tables, search filters, and feedback messages.
- **Rendering and feedback:** Use server and client components where appropriate, with loading states, validation messages, and error feedback.
- **Deployment:** Render is proposed for hosting; the team will confirm deployment and database compatibility.

## Core API Endpoints

- `GET /api/students` — list or search students.
- `POST /api/students` — create a student profile.
- `GET /api/students/:id` — view a student profile.
- `PATCH /api/students/:id` — update a student profile.
- `DELETE /api/students/:id` — remove a student profile from normal use.
- `GET /api/courses` and `POST /api/courses` — list and create courses.
- `GET /api/courses/:id`, `PATCH /api/courses/:id`, and `DELETE /api/courses/:id` — view, update, and remove a course.
- `GET /api/enrollments` and `POST /api/enrollments` — list and create enrollments.
- `GET /api/enrollments/:id`, `PATCH /api/enrollments/:id`, and `DELETE /api/enrollments/:id` — view, update, and remove an enrollment.
- `GET /api/grades` and `POST /api/grades` — list and create grades.
- `GET /api/grades/:id`, `PATCH /api/grades/:id`, and `DELETE /api/grades/:id` — view, update, and remove a grade.
- Authentication and session endpoints will follow the selected authentication provider.

All record endpoints require appropriate authentication and authorization. The team will decide whether removal is implemented as a soft delete and how related records are retained.

## Implementation Priority

- **P0:** Account creation and sign-in; role-based access; student and course CRUD; enrollment management; grade management; basic academic history.
- **P1:** Improved search and filtering, user profile management, and usability refinements.
- **P2:** Expanded academic reporting and other enhancements selected by the team.
