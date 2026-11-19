# ISM Records API

A school website and student records application for Instituto Privado Salvador Moncada. The repository includes a Next.js app, MongoDB models, and an older Express server.

## Team members

Team member names:
Abdullahi 
Emmanuel Bassey  
David Antonio  
Obiri Bempa Asiedu  
Christina Dobbins 


## Local setup

1. Clone the repository: `git clone https://github.com/dantonifa/ism-records-api.git`
2. Enter the project directory: `cd ism-records-api`
3. Install dependencies: `npm install`
4. Start the Next.js development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000).

Database-backed features need a MongoDB connection. The Next.js database helper reads `MONGODB_URI` from the environment and otherwise uses a local MongoDB instance. Obtain connection details securely from a teammate; never commit credentials.

## Secretary grade review

These routes return `503` until a server-side Secretary/Page Administrator role check from [#10](https://github.com/dantonifa/ism-records-api/issues/10) is wired into both handlers. Do not use a client-supplied role. Grade review requires MongoDB transaction support (a replica set or sharded cluster).

- `PUT /api/secretary/grades/:submissionId/approve` takes `{ "year": 2026 }`. The pending roster's `Q1`–`Q4` term selects `parcial1`–`parcial4`. Each student must match exactly one existing record by student ID, subject (the record's `course`), section, and year. If any match is missing or ambiguous, no grades are saved.
- `PUT /api/secretary/grades/:submissionId/reject` takes `{ "rejectionReason": "Please verify the roster." }`. It saves the reason and marks the pending submission `REJECTED` without changing student records.

## Project planning

The team still needs to confirm the project specifications, MVP scope, architecture, design, ownership, and project board. The repository-wide Copilot instructions are in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
