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
manage accounts, teacher records, and class assignments. Staff manage students
and academic records and review grades. Teachers can view assigned students and
records and submit grades for assigned classes. Submitted grades cannot be
edited; a rejected grade must be submitted again.

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
  archives it. Staff and administrators manage students; teachers can view
  only students assigned to them.
- `GET /api/admin/users`, `PATCH /api/admin/users`, and the administrator
  teacher and assignment routes support account approval and class assignment.

## Course management

The course module stores a unique code, name, optional description, and
active or archived status. Codes are trimmed, normalized to uppercase, and
cannot be changed or reused after archiving. MongoDB must have the model's unique
code index in place. Course records are not yet linked to grade assignments.

Approved administrators, staff, and teachers can browse active courses at
`/courses`; only administrators can create, edit, or archive them.

- `GET /api/courses` lists active courses; `POST /api/courses` creates a course
  from `code`, `name`, and an optional `description`.
- `GET /api/courses/:id` reads an active course; `PATCH /api/courses/:id`
  updates its name or description.
- `DELETE /api/courses/:id` archives a course rather than deleting its data.

## Enrollment management

Approved administrators and staff can manage enrollments at `/enrollments`;
teachers do not have enrollment access.

An enrollment links one student to one course. The pair is unique across active
and archived enrollments; restore an archived enrollment instead of creating a
duplicate. MongoDB must have the model's unique student/course compound index
in place before use. The student and course must both be active when creating
or restoring an enrollment. Archiving either does not automatically archive
existing enrollments. Enrollment references cannot be changed after creation.

- `GET /api/enrollments` lists active and archived enrollments; `POST` creates
  one from MongoDB `studentId` and `courseId` values.
- `GET /api/enrollments/:id` reads an enrollment; `PATCH` changes its `status`
  to `active` or `archived`.
- `DELETE /api/enrollments/:id` archives an enrollment rather than deleting it.

## Secretary grade review

Only approved staff and administrators can review submissions. Grade review
requires MongoDB transaction support (a replica set or sharded cluster).

- `PUT /api/secretary/grades/:submissionId/approve` takes `{ "year": 2026 }`. The year must match the submission when present. The pending roster's `Q1`–`Q4` term selects `parcial1`–`parcial4`. Each student must match exactly one existing record by student ID, subject (the record's `course`), section, and year. If any match is missing or ambiguous, no grades are saved.
- `PUT /api/secretary/grades/:submissionId/reject` takes `{ "rejectionReason": "Please verify the roster." }`. It saves the reason and marks the pending submission `REJECTED` without changing student records.
- `GET /api/secretary/grades` returns up to 100 pending submissions, newest first. Optional `teacherId`, `subjectId`, and `term` query parameters are exact filters and can be combined.
- `PUT /api/secretary/grades/batch-approve` takes a `year` and 1–50 unique `submissionIds`. Every submission is reviewed in one transaction; if any fails or two target the same grade, none are saved.

The grade-review integration test runs when `GRADE_REVIEW_MONGO_TEST_URI` points
to an isolated local MongoDB replica set. It creates and removes a uniquely named
test database; the standard test run skips it when the variable is unset.

## Demo and access

Instituto Salvador Moncada Records helps school staff organize student
profiles, courses, enrollments, and academic records in one application.
Administrators, teachers, and staff have different responsibilities, so
account approval and role-based access help limit who can see or change
information.

In a demo, an administrator approves a requested account, creates a course,
and assigns a teacher. Staff can create a student profile and enroll the
student in a course; an assigned teacher can submit grades for staff review.
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
- Course records are not linked to grade assignments, and archiving a student
  or course does not automatically archive its enrollments.
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
