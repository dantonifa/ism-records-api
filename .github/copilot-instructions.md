# Instituto Salvador Moncada Records

## Project context

This project manages student records, courses, enrollments, grades, and academic
history for authorized administrators, teachers, and staff. The MVP prioritizes
authentication, role-based access, student and course management, enrollments,
grades, and academic history.

Read `docs/project-specification.md` before proposing or implementing a feature.
Use its user stories and acceptance criteria as the source of truth for MVP
behavior.

## Technology decisions

- The target application uses Next.js App Router, React, and TypeScript in
  strict mode.
- Use Tailwind CSS for responsive styling and preserve the existing visual
  language unless a design decision has been documented.
- MongoDB is the team database decision. Use Mongoose for schemas and database
  access. The connection string is provided through `MONGODB_URI`; never commit
  credentials or hard-code a deployment URI.
- Render is the proposed deployment platform.
- Authentication provider selection is still pending. Do not add Auth.js,
  Clerk, or a custom authentication system without a documented team decision.
- Authorization must be enforced server-side with role checks and input
  validation for protected records and API requests.

The repository currently contains both Next.js App Router code and an existing
Express/Mongoose API. Preserve the behavior of the area being changed and
follow its established entry point. Do not migrate unrelated code as part of a
feature.

## Domain model

The planned core entities are:

- **User:** account identity, password/session data supplied by the selected
  authentication solution, and a role such as administrator, teacher, or staff.
- **Student:** profile and contact/identifying information.
- **Course:** course identity, name, description, and status.
- **Enrollment:** a relationship between one student and one course, including
  enrollment status and dates. A student-course pair must not be duplicated.
- **Grade:** grade data belonging to an enrollment, with the authorized teacher
  and audit information where required.

Use references between related documents where appropriate. Validate referenced
student, course, and enrollment records before writes, and enforce uniqueness
for identifiers and duplicate-prevention rules at the database or service
boundary.

## API and implementation conventions

- Use the existing API resource naming: `/api/students`, `/api/courses`,
  `/api/enrollments`, and `/api/grades`, with collection and `/:id` operations.
- Use the HTTP methods specified in the project specification: `GET`, `POST`,
  `PATCH`, and `DELETE`.
- Validate request bodies before database writes and return clear client errors
  for invalid input, missing resources, unauthorized access, and duplicate
  enrollments.
- Keep database connection logic reusable and safe for Next.js development
  reloads. Read configuration from environment variables.
- Keep secrets in local environment files that are excluded from source
  control. Do not print connection strings, passwords, or tokens in logs.
- Use loading, empty, validation, and error states in the UI.
- Prefer reusable components for navigation, form fields, data tables, search
  filters, and feedback messages.
- Keep changes focused. Follow existing naming, formatting, and module
  conventions in the directory being changed.

## Team ownership

- **Emmanuel Bassey:** authentication, sessions, roles, permissions, and
  protected routes/API endpoints.
- **Abdullahi Mohammed:** student registration, profiles, CRUD, search/filtering,
  and student form validation.
- **David Antonio:** course CRUD and validation; project coordination,
  integration, and deployment.
- **Obiri Bempa Asiedu:** enrollment CRUD, duplicate prevention, and reference
  validation.
- **Christina Dobbins:** grade entry/management, grade validation,
  authorization, and academic history.

Coordinate cross-cutting changes with the affected owner. Work on feature
branches, commit focused changes, and use pull requests for review before
merging into `main`.

## Delivery checklist

Before considering a feature complete:

1. Verify the related acceptance criteria in
   `docs/project-specification.md`.
2. Confirm unauthorized and invalid-input paths fail safely.
3. Check responsive UI states where the feature has a page or form.
4. Update API documentation or project documentation when the public behavior
   changes.
5. Run the smallest relevant lint, build, or test command and report failures
   explicitly.
