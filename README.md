# Nothing Finer | Field Operations — Sprint 1 interactive demo

A client-facing demonstration of the Sprint 1 acceptance journey:

**Owner logs in → invites a technician → creates a customer → adds a job site → creates a job → adds a note**,
then switches to the technician to show their assigned job and notes.

> This is an **interactive demo with sample data**, not the production application.
> Sign-in, invitations and password-reset delivery are simulated in the browser.
> Role rules are applied consistently in the demo but are not a security boundary.

## Run locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel (framework preset **Vite** is detected; `vercel.json` is included).
   Or from this folder: `npx vercel` then `npx vercel --prod`.
2. No environment variables, database or email service are required.

The page sets `noindex` so the demo URL isn't indexed by search engines.

## Presenting the demo

- The link opens straight into the app as the owner, on the **Sprint 1 review** page. It maps every Sprint 1 scope item to a working screen and shows the client's acceptance script as a live checklist that ticks itself off from the activity log.
- To show authentication, use **Show login screen** (or Log out). From there, **Enter demo as owner** or log in with any sample account, password `FieldOps1`.
- The amber bar at the top holds presenter controls: **Switch account**, **Demo inbox**, **Reset demo**.
- Data is saved in the browser's localStorage, so it survives a refresh. **Reset demo** restores the original sample data.

### Suggested five-minute script

1. Open the link → Sprint 1 review (scope + acceptance checklist), then the Dashboard.
2. **Invite technician** → open the invitation from the demo inbox → accept it → return to the owner.
3. **Add customer** → follow the **Add site** next step → follow the **Create job** next step, assign the new technician.
4. Add an owner note on the job.
5. **Switch account** → the new technician: only their job is visible; add a technician note.
6. Switch back to the owner → both notes on the job, every step in **Activity**.

## What's simulated

| Area | In this demo | In production (Sprint 1 build) |
| --- | --- | --- |
| Authentication | Checked against sample accounts in the browser | Server-side auth with hashed passwords and sessions |
| Invitations & password reset | Messages appear in the labeled demo inbox | Sent by a transactional email provider |
| Permissions | Applied in shared action handlers and the UI | Enforced by the API / database |
| Data | Browser localStorage | PostgreSQL |

## Project structure

- `src/lib/store.ts` — demo data layer: shared state, persistence, role checks, activity logging
- `src/lib/seed.ts` — fictional sample data
- `src/components/AppLayout.tsx` — hash routing, shared dialogs, invite/reset flows
- `src/components/fieldops/` — pages and UI components
