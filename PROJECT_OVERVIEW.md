
# Project Overview

This document provides a detailed overview of the univ.live project, including its architecture, technologies, and structure. It is intended to help new contributors understand the project and get started with development.

## Technologies Used

### Frontend

*   **Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
*   **Routing**: [React Router](https://reactrouter.com/)
*   **State Management**: [TanStack Query](https://tanstack.com/query/latest) (for server state) and React Context (for global state).

### Backend

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: Serverless functions deployed on [Vercel](https://vercel.com/).
*   **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (a NoSQL, document-based database).
*   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth).
*   **Image Management**: [ImageKit](https://imagekit.io/)
*   **Payment Gateway**: [Razorpay](https://razorpay.com/)

### Deployment

*   **Platform**: [Vercel](https://vercel.com/)

## Project Structure

The project is a monorepo with the frontend and backend code in the same repository.

```
univ-live-new/
├── api/                  # Backend serverless functions
│   ├── _lib/             # Shared backend utilities
│   ├── admin/            # Admin-related endpoints
│   ├── ai/               # AI-related endpoints
│   ├── billing/          # Billing and subscription endpoints
│   ├── razorpay/         # Razorpay webhooks
│   └── tenant/           # Tenant-related endpoints
├── src/                  # Frontend application source code
│   ├── assets/           # Static assets like images and fonts
│   ├── components/       # Reusable React components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Top-level page components for different routes
│   ├── services/         # Functions for making API calls
│   └── themes/           # Theme configuration
├── public/               # Publicly accessible files
├── package.json          # Project dependencies and scripts
├── vite.config.ts        # Vite configuration
└── vercel.json           # Vercel deployment configuration
```

## Database

The project uses **Firebase Firestore** as its database. Firestore is a NoSQL, document-oriented database. The database structure is not explicitly defined in the codebase, as is common with NoSQL databases. The structure is inferred from the data access patterns in the serverless functions.

Based on the file structure, we can infer the following collections:

*   **Users**: For storing user data.
*   **Tenants**: For storing tenant (coaching institute) data.
*   **Courses**: For storing course information.
*   **Students**: For storing student data.
*   **Tests**: For storing test and question data.
*   **Payments**: For storing payment and subscription information.

## Authentication

Authentication is handled by **Firebase Authentication**. The frontend uses the Firebase client SDK to manage user sessions, and the backend uses the Firebase Admin SDK to protect routes and manage user roles. The `api/_lib/requireUser.ts` file likely contains middleware for checking user authentication and authorization.

## Deployment

The project is deployed on **Vercel**. The `vercel.json` file configures the deployment, including the serverless functions in the `api` directory. The project is continuously deployed, with new commits to the main branch triggering a new build and deployment.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later)
*   [Bun](https://bun.sh/) (as indicated by `bun.lockb`)

### Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    bun install
    ```

### Running the Development Server

To start the frontend development server, run:

```bash
bun run dev
```

This will start the Vite development server, and you can view the application at `http://localhost:8080`.

### Building the Project

To build the project for production, run:

```bash
bun run build
```

This will create a `dist` directory with the optimized and minified production build.
