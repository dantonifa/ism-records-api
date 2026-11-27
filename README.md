# Instituto Salvador Moncada Records

Instituto Salvador Moncada Records is a full-stack academic records platform
for administrators, teachers, and staff. The MVP supports secure account
access, role-based permissions, student profiles, courses, enrollments, grades,
and academic history.

The repository includes a Next.js app, MongoDB models, and an older Express
server with static pages under `public/`.

## Team members

- Abdullahi Bolutife Mohammed
- Emmanuel Okon Bassey
- David Antonio Fajardo Ponce
- Obiri Bempa Asiedu
- Christina Dobbins
- Pascal Okezie

## Technology

- Next.js App Router and React
- JavaScript and TypeScript with strict checking for TypeScript files
- MongoDB with Mongoose
- Responsive CSS/Tailwind design direction
- Vercel for the current Next.js deployment

## Local setup

```bash
git clone https://github.com/dantonifa/ism-records-api.git
cd ism-records-api
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `MONGODB_URI` and
`AUTH_SECRET` in a local environment file and in the deployment environment.
Obtain both securely; do not commit credentials or tokens.

## Deployment

The GitHub-connected Next.js app is deployed on Vercel at
[ism-records-api.vercel.app](https://ism-records-api.vercel.app/). Configure
`MONGODB_URI` and `AUTH_SECRET` securely in the appropriate Vercel environments.
Deploy the Next.js application from the repository's `main` branch after review,
and verify the deployment and its database connection before use.
The older Express server is separate and references a Render deployment; do not
assume it shares the Next.js deployment or its access controls.

## Account permissions

New accounts are inactive until an administrator approves them. Administrators
manage accounts, teacher records, and class assignments. Staff can create and
view students, enrollments, and academic records and review grades. Only
administrators can edit or archive those records. Teachers can view assigned
students and records and submit grade entries, corrections, or removal requests
for review. A rejected request must be submitted again.

To establish the first administrator, register an account and have a trusted
database administrator verify it and securely set its role to `admin` and
`isActive` to true. Review any existing user accounts before deployment; this
change does not deactivate previously stored accounts automatically. The admin
page can then approve accounts, link teacher accounts to teacher records, and
assign classes and students. The legacy Express server is separate and does not
use these Next.js access controls; do not deploy it with sensitive records.

## Student and account API

- `POST /api/register` requests an inactive account. Authentication uses
  Auth.js credentials; an administrator must approve the account before login.
- `GET /api/students` lists active students; `POST /api/students` creates one.
- `GET /api/students/:id` reads a profile; `PATCH` updates it and `DELETE`
  archives it. Staff and administrators can create and view students; only
  administrators can update or archive them. Teachers can view only students
  assigned to them.
- `GET /api/students/:id/history` returns enrollments and academic records,
  including archived items, to staff and administrators. Enrollment records do
  not contain a school-year snapshot.
- `GET /api/admin/users`, `PATCH /api/admin/users`, and the administrator
  teacher and assignment routes support account approval and class assignment.
- `GET /api/account` returns the signed-in user's name, email, and role;
  `PATCH /api/account` updates only the name. `PUT /api/account/password`
  takes `currentPassword` and `newPassword` and changes the password only when
  the current one is correct. The `/account` page uses these routes.

## Course management

The course module stores a unique code, name, optional description, and
active or archived status. Codes are trimmed, normalized to uppercase, and
cannot be changed or reused after archiving. MongoDB must have the model's unique
code index in place. Grade assignments use the course code.

Approved administrators, staff, and teachers can browse active courses at
`/courses`; only administrators can create, edit, or archive them.

- `GET /api/courses` lists active courses; `POST /api/courses` creates a course
  from `code`, `name`, and an optional `description`.
- `GET /api/courses/:id` reads an active course; `PATCH /api/courses/:id`
  updates its name or description.
- `DELETE /api/courses/:id` archives a course rather than deleting its data.

## Enrollment management

Approved administrators and staff can create and view enrollments at
`/enrollments`; only administrators can change, archive, or restore them.
Teachers do not have enrollment access.

An enrollment links one student to one course. The pair is unique across active
and archived enrollments; restore an archived enrollment instead of creating a
duplicate. MongoDB must have the model's unique student/course compound index
in place before use. The student and course must both be active when creating
or restoring an enrollment. Archiving either does not automatically archive
existing enrollments. Enrollment references cannot be changed after creation.

- `GET /api/enrollments` lists active and archived enrollments; `POST` creates
  one from MongoDB `studentId` and `courseId` values.
- `GET /api/enrollments/:id` reads an enrollment; `PATCH` changes its `status`
  to `active` or `archived` for administrators.
- `DELETE /api/enrollments/:id` archives an enrollment for administrators.

## Academic records

Staff and administrators can create records for active students with an active
enrollment in the specified course, section, and year. Only administrators can
change the name or grade level or archive or restore a record; its identifying
fields cannot be changed. Direct grade edits are rejected. Archived academic
records remain in history and cannot be recreated with the same student, course,
section, and year. Restoring requires an active student, course, and enrollment.
`GET /api/records` accepts `studentId` to filter results, and
`GET`, `PATCH`, and `DELETE /api/records/:studentId` accept `recordId` as a
query parameter to select one record when a student has multiple records.
Administrators can list archived records with `?status=archived` and restore one
with `PATCH` and `{ "status": "active" }`. `PUT` remains supported for non-grade updates. Missing grades are displayed as
ungraded; a recorded zero is a grade.

Before deploying, back up and audit existing `Record` documents. Course codes
must be normalized to their matching uppercase course codes, and duplicates for
the same student, course, section, and year must be resolved by an authorized
administrator before the new unique compound index is created. Do not discard
or merge records automatically. Audit existing teaching assignments as well:
assignments must use active course codes and students must be actively enrolled.
Unmatched assignments and archived or ambiguous records require manual review.

## Secretary grade review

Only approved staff and administrators can review submissions. Grade review
requires MongoDB transaction support (a replica set or sharded cluster).

- `GET /api/grades` lists recorded grades; `GET /api/grades/:id` reads one.
  Grade IDs combine the academic record ID and term, for example
  `507f1f77bcf86cd799439011:Q1`. Teachers can only view assigned records.
- `POST /api/grades` accepts the same teacher roster as `/api/grades/submit`.
  `PATCH /api/grades/:id` accepts `{ "score": 85, "comments": "Correction" }`;
  `DELETE /api/grades/:id` requests removal. These teacher-only operations create
  pending review requests; they do not immediately change the recorded grade.
- `POST /api/grades/submit` accepts grade entries, corrections, or removals from assigned teachers. Each student must be actively enrolled in the assignment's active course, and the assignment must use its course code. The current score is captured for review.
- `PUT /api/secretary/grades/:submissionId/approve` takes `{ "year": 2026 }`. The year must match the submission when present. The pending roster's `Q1`–`Q4` term selects `parcial1`–`parcial4`. Approval creates a missing record without inventing grades, or updates the one matching record. It rejects ambiguous, archived, or stale records and inactive references. Legacy requests without a captured score cannot overwrite an existing grade; resubmit them for review.
- `PUT /api/secretary/grades/:submissionId/reject` takes `{ "rejectionReason": "Please verify the roster." }`. It saves the reason and marks the pending submission `REJECTED` without changing student records.
- `GET /api/secretary/grades` returns up to 100 pending submissions, newest first. Optional `teacherId`, `subjectId`, and `term` query parameters are exact filters and can be combined.
- `PUT /api/secretary/grades/batch-approve` takes a `year` and 1–50 unique `submissionIds`. Every submission is reviewed in one transaction; if any fails or two target the same grade, none are saved.

Reviewed submissions retain the action, previous score, reviewer, and review
time. A removal clears the current score but preserves the reviewed submission.

The grade-review integration test runs when `GRADE_REVIEW_MONGO_TEST_URI` points
to an isolated local MongoDB replica set. It creates and removes a uniquely named
test database; the standard test run skips it when the variable is unset.

## Demo and access

Instituto Salvador Moncada Records helps school staff organize student
profiles, courses, enrollments, and academic records in one application.
Administrators, teachers, and staff have different responsibilities, so
account approval and role-based access help limit who can see or change
information.

In a demo, an administrator approves a requested account and creates a course.
Staff can create a student profile and enroll the student in the course; an
administrator then assigns the enrolled student to a teacher using that course
code. The assigned teacher can submit grades for staff review.
The workflow keeps submitted grades pending until an authorized reviewer
approves them.

Before a demo, configure the deployment and provision approved demo accounts
for the roles being demonstrated. Use fictional student information and share
temporary credentials securely with the grader; do not put credentials in the
repository. Tell the grader the application uses Auth.js v5 and provide the
deployment URL and role-specific steps needed to access the demo.

## Known issues and opportunities

- TypeScript coverage is partial: the app still contains JavaScript files, and
  the remaining pages, components, and APIs have not all been migrated.
- Live authentication, database indexes, and the complete deployment workflow
  need verification in the target environment.
- Archiving a student or course does not automatically archive its enrollments.
- Grade review requires MongoDB transaction support. The integration test
  requires an isolated local replica set and is skipped without one.
- The legacy Express server does not share the Next.js access controls.

## Project resources

- [Project specification](docs/project-specification.md)
- [Week 03 team meeting documentation](docs/week-03-team-meeting.md)
- [Project diagram](docs/project-diagram.svg)
- [Copilot instructions](.github/copilot-instructions.md)
- [GitHub Project Board](https://github.com/users/dantonifa/projects/3)
- [Week 04 milestone](https://github.com/dantonifa/ism-records-api/milestone/1)

## Collaboration workflow

Work on focused feature branches, commit regularly, push changes, and open a
pull request against `main`. Every pull request should receive teammate review
before it is merged.
