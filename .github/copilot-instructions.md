# Repository instructions

## Project

- This repository contains a school website and student records application for Instituto Privado Salvador Moncada.
- The current development command runs Next.js with React and JavaScript. MongoDB access uses Mongoose.
- Treat the existing Express server and `public/` static site as separate existing code; do not assume they run when using `npm run dev`.

## Structure

- `app/` contains the Next.js layout, home page, and API route handlers.
- `models/` contains the Mongoose record, teacher, and grade submission models.
- `lib/db.js` provides the Next.js MongoDB connection; `controllers/` and `middleware/` contain shared grade-submission logic.
- `public/` contains static pages, assets, scripts, and styles. `server.js`, `routes/`, and `config/` support the older Express server.
- `tests/` contains Node.js tests for grade submissions.

## Working practices

- Preserve existing behavior and follow the conventions in the code being changed. Add focused tests for new or changed behavior.
- Run `npm install` after cloning, `npm run dev` for local development, and `npm run build` to check a production build. Run the existing tests with `node --test`.
- The Next.js database helper reads `MONGODB_URI` or defaults to local MongoDB. Never include credentials in code, documentation, examples, or commits.
- Student records and grades are sensitive: avoid exposing real data in examples, logs, tests, or public responses.
- The team must still agree on MVP routes, component hierarchy, ownership, design system, and any changes to the data model. Do not treat proposals as established decisions.
