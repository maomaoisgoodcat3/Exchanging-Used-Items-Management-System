# Exchanging-Used-Items-Management-System

This is an application for exchanging, donating, and selling used items at financially autonomous private schools.

## Frontend

The frontend is built with Next.js and uses the App Router. Key folders include:

- `src/app`: page routes and layouts
- `src/components`: UI components and shared modules
- `src/hooks`: custom hooks such as `useAuth`
- `src/store`: global state with Zustand
- `src/types`: shared TypeScript interfaces

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Notes

- The project uses TypeScript and Next.js App Router.
- Mock authentication state is handled through `src/store/authStore.ts`.
- Ignore generated build artifacts such as `.next/` and `node_modules`.

