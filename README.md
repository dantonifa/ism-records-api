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

Open [http://localhost:3000](http://localhost:3000). Set `MONGODB_URI` in a
local environment file before using database-backed features. The Next.js
database helper reads `MONGODB_URI` and otherwise uses a local MongoDB
instance. Do not commit credentials or tokens.

## Secretary grade review

These routes return `503` until a server-side Secretary/Page Administrator role check from [#10](https://github.com/dantonifa/ism-records-api/issues/10) is wired into the handlers. Do not use a client-supplied role. Approval and rejection require MongoDB transaction support (a replica set or sharded cluster).

- `PUT /api/secretary/grades/:submissionId/approve` takes `{ "year": 2026 }`. The pending roster's `Q1`–`Q4` term selects `parcial1`–`parcial4`. Each student must match exactly one existing record by student ID, subject (the record's `course`), section, and year. If any match is missing or ambiguous, no grades are saved.
- `PUT /api/secretary/grades/:submissionId/reject` takes `{ "rejectionReason": "Please verify the roster." }`. It saves the reason and marks the pending submission `REJECTED` without changing student records.
- `GET /api/secretary/grades` lists pending roster summaries with grade counts, newest first. Optional query parameters `teacherId`, `subjectId`, and `term` are exact matches and can be combined.
- `PUT /api/secretary/grades/batch-approve` takes `year` and an array of 1–50 unique `submissionIds`. It uses the single-roster approval rules in one transaction. If a submission fails or two rosters target the same grade, nothing in the batch is saved.

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
