# Repository instructions

## Project

- This repository contains a school website and student records application for Instituto Privado Salvador Moncada.
- The current Next.js app uses React and JavaScript. TypeScript is installed, but the existing app has not yet been converted. WDD 430 requires TypeScript typing; coordinate the transition with the team rather than assuming it is complete. MongoDB access uses Mongoose.
- Treat the existing Express server and `public/` static site as separate existing code; do not assume they run when using `npm run dev`.

## Structure

- `app/` contains the Next.js layout, home page, and API route handlers.
- `app/grades/entry/` contains a client-side grade-entry preview and its CSS module; it does not submit or save grades.
- `models/` contains the Mongoose record, teacher, and grade submission models.
- `lib/db.js` provides the Next.js MongoDB connection; `controllers/` and `middleware/` contain shared grade-submission logic.
- `public/` contains static pages, assets, scripts, and styles. `server.js`, `routes/`, and `config/` support the older Express server.
- `tests/` contains Node.js tests for grade submissions.

## Existing data and conventions

- The record model stores a student ID, name, course, four partial grades, grade level, section, and year. The teacher model stores a teacher ID and contact details.
- Grade submissions identify a teacher, subject, course section, optional term, and student scores. They default to pending review; approval and rejection fields are also present.
- Follow existing names and casing when changing code or data. Existing JavaScript identifiers and model fields generally use camelCase, with some Spanish record field names; do not rename stored fields without team agreement and a migration plan.
- Next.js route handlers use the App Router's `route.js` convention. Existing models and shared grade-submission modules use CommonJS; Next.js app files use ES modules.

## Working practices

- Preserve existing behavior and follow the conventions in the code being changed. Add focused tests for new or changed behavior.
- Run `npm install` after cloning, `npm run dev` for local development, and `npm run build` to check a production build. Run the existing tests with `node --test`.
- The Next.js database helper reads `MONGODB_URI` or defaults to local MongoDB. Never include credentials in code, documentation, examples, or commits.
- Student records and grades are sensitive: avoid exposing real data in examples, logs, tests, or public responses.
- The team must still agree on MVP routes, component hierarchy, ownership, design system, and any changes to the data model. Do not treat proposals as established decisions.
