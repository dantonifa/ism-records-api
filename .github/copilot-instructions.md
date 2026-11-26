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
  strict mode. TypeScript is installed, but the current Next.js app uses
  JavaScript. WDD 430 requires TypeScript typing; coordinate the transition
  with the team rather than assuming it is complete. Preserve the language of
  the file being changed.
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
feature. Treat the Express server and `public/` static site as separate
existing code; do not assume they run when using `npm run dev`.

## Repository structure

- `app/` contains the Next.js layout, pages, and API route handlers.
- `app/grades/entry/` contains a client-side grade-entry preview and its CSS
  module; it does not submit or save grades.
- `models/` contains Mongoose models (records, teachers, grade submissions,
  and related entities).
- `lib/db.js` provides the Next.js MongoDB connection; `controllers/` and
  `middleware/` contain shared grade-submission logic.
- `public/` contains static pages, assets, scripts, and styles. `server.js`,
  `routes/`, and `config/` support the older Express server.
- `tests/` contains Node.js tests for grade submissions.
- `docs/` contains the project specification and team meeting notes.

## Existing data and conventions

- The record model stores a student ID, name, course, four partial grades,
  grade level, section, and year. The teacher model stores a teacher ID and
  contact details.
- Grade submissions identify a teacher, subject, course section, optional term,
  and student scores. They default to pending review; approval and rejection
  fields are also present.
- Follow existing names and casing when changing code or data. Existing
  JavaScript identifiers and model fields generally use camelCase, with some
  Spanish record field names; do not rename stored fields without team agreement
  and a migration plan.
- Next.js route handlers use the App Router's `route.js` convention. Models and
  shared grade-submission modules use CommonJS; Next.js app files use ES modules.

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
- Student records and grades are sensitive: avoid exposing real data in
  examples, logs, tests, or public responses.
- Use loading, empty, validation, and error states in the UI.
- Prefer reusable components for navigation, form fields, data tables, search
  filters, and feedback messages.
- Keep changes focused. Follow existing naming, formatting, and module
  conventions in the directory being changed. Add focused tests for new or
  changed behavior.

## Local commands

- Run `npm install` after cloning.
- Run `npm run dev` for local Next.js development.
- Run `npm run build` to check a production build.
- Run existing tests with `node --test`.

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
