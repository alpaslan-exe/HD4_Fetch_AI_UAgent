# HD4 Scheduler Frontend Demo

This demo showcases a Material UI driven dashboard experience for an academic scheduling tool. It ships with a faux authentication gate and a multi-section layout designed to feel modern, animated, and responsive.

## Key Screens

- **Login** – A gradient glassmorphism panel that accepts any credentials for easy demo access.
- **Overview** – Interactive semester cards with cursor-aware hover effects, inline class management, and professor insights complete with Rate My Professor links.
- **Schedule Uploads** – Three upload dropzones (pathway plan, previous classes, current semester) to outline the flow for future file ingestion.
- **Previous Classes** – A gallery of completed coursework with quick-add support for grades and instructor details.
- **Settings** – A polished profile form that demonstrates how user preferences could be edited in a real application.

## Visual Language

- Dark theme with layered gradients and glowing highlights.
- Material UI components styled for soft corners, glass surfaces, and floating action buttons.
- Cursor-follow hover animations that bring depth to cards and list items.

## Demo Notes

- Authentication, uploads, and profile edits are client-side only; no data persists.
- Semester generation and class lists are stateful in-session, making it easy to explore different planning scenarios.
- File inputs accept common formats (`.pdf`, `.csv`, `.xlsx`, images) but do not upload to a server in this demo.

Use `npm run dev` to explore the experience locally and `npm run build` to produce the production bundle.***
