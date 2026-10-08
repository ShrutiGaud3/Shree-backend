# Rules for this existing project (Frontend + Backend, ADDITIVE ONLY)

## Golden rule
Every new feature must be built END-TO-END: backend (model, validator, service,
controller, route, auth) AND frontend (UI, service call, state). Never leave a
frontend feature on mock data if the backend can be added.

## Protect existing code (never break)
- DO NOT delete or rename existing files, routes, models, collections or components.
- DO NOT change the request/response shape of any existing API endpoint.
- DO NOT remove or rename existing fields in Mongoose models. New fields must be
  OPTIONAL or have a default value so old documents keep working.
- DO NOT rewrite existing pages. Extend them or add new ones.
- DO NOT change existing env variable names. New variables go in .env.example only.
- DO NOT run destructive DB commands (drop, delete many, reseed over real data).
- Prefer NEW files (new model/route/controller/page). If an existing file must be
  edited, make the smallest possible change and mention it in the summary.
- New API routes only under new paths or new methods; never alter existing ones.
- If a change could affect existing behaviour, STOP and ask me first.

## Backend conventions (follow what already exists)
Node + Express + TypeScript/JS (match current), MongoDB + Mongoose. Keep the same
layering and error handling as existing code. Validate input (Zod/existing method).
Admin routes protected with existing admin middleware. Roles: only "user" and
"admin". No staff/manager/RBAC. Totals and prices are calculated on the server.
Add indexes for new query fields. Register new routes in the existing router file
with one added line each.

## Frontend conventions
React + TypeScript + Tailwind. Reuse existing components, hooks, API client and
types. Every screen needs loading, empty and error states, fully responsive
(320px to 1920px), accessible (WCAG AA).

## Design tokens
cream #FFFBF5 / #FFF4E6 / #FBE7D0, pink #FFE4EC / #F9A8C4 / #EC5E95 / #D6457F,
ink #2B2024 / #6B5B61. Gradient: linear-gradient(135deg,#FFFBF5,#FFE4EC).
Fonts: Playfair Display (headings), Poppins (body). Rounded-2xl, soft shadows, minimal.

## After every feature
1. Run type-check and lint for both apps and fix errors.
2. Test new endpoints (curl/supertest) and confirm the UI uses them.
3. Add new endpoints to API docs (Swagger/README) if they exist.
4. Report: files created, files modified (with reason), new env vars, new endpoints.
