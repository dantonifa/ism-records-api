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
- TypeScript strict mode for the target application
- MongoDB with Mongoose
- Responsive CSS/Tailwind design direction
- Render as the proposed deployment platform

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

## Proposed account permissions

These roles are a proposal pending team approval. New accounts are inactive
until an administrator approves them. Administrators manage accounts, teacher
records, and class assignments. Staff manage students and academic records and
review grades. Teachers can view assigned students and records and submit
grades for assigned classes. Submitted grades cannot be edited; a rejected
grade must be submitted again.

To establish the first administrator, register an account and have a trusted
database administrator verify it and securely set its role to `admin` and
`isActive` to true. Review any existing user accounts before deployment; this
change does not deactivate previously stored accounts automatically. The admin
page can then approve accounts, link teacher accounts to teacher records, and
assign classes and students. The legacy Express server is separate and does not
use these Next.js access controls; do not deploy it with sensitive records.

## Secretary grade review

Only approved staff and administrators can review submissions. Grade review
requires MongoDB transaction support (a replica set or sharded cluster).

- `PUT /api/secretary/grades/:submissionId/approve` takes `{ "year": 2026 }`. The year must match the submission when present. The pending roster's `Q1`–`Q4` term selects `parcial1`–`parcial4`. Each student must match exactly one existing record by student ID, subject (the record's `course`), section, and year. If any match is missing or ambiguous, no grades are saved.
- `PUT /api/secretary/grades/:submissionId/reject` takes `{ "rejectionReason": "Please verify the roster." }`. It saves the reason and marks the pending submission `REJECTED` without changing student records.

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
