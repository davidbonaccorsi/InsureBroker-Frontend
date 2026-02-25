# InsureBroker  - Frontend Client 🎨

The user-facing portal of the InsureBroker platform. Built for speed, productivity, and modern user experience. It's a React SPA built with Vite and styled via Tailwind CSS, offering a clean, enterprise-grade UI for brokers, managers, and administrators.

## 🛠️ Tech Stack

- **React 18** (with Hooks & Context API)
- **Vite** (Because Webpack is too slow)
- **TypeScript** (Strict typing for fewer runtime surprises)
- **Tailwind CSS** (Utility-first styling)
- **Shadcn/UI & Radix UI** (Accessible, unstyled components wrapped in Tailwind)
- **Axios** (With interceptors for JWT auth & auto-logout)
- **React Router v6** (Protected routing & layout wrapping)

## 🧠 Under the Hood

This frontend isn't just a pretty face. It handles complex business logic and state synchronization with the backend:

- **Dynamic Form Generation**: The `NewPolicy` module doesn't use hardcoded forms. It fetches `CustomFields` from the backend API for a specific insurance product and dynamically renders inputs (Dropdowns, Checkboxes, Numbers) to construct the pricing variables.
- **Smart Date Math**: Real-time evaluation of insurance terms. You pick the start date and a duration (e.g., 6 months), and it auto-calculates the end date. It even intercepts CNP (Romanian ID) data to prevent Life Insurance policies from extending past the client's 80th birthday.
- **Role-Based Access Control (RBAC)**: Deeply integrated with the `AuthContext`. Components and routes are conditionally rendered or blocked entirely based on whether you are an `ADMINISTRATOR`, `BROKER_MANAGER`, or `BROKER`.
- **Global Settings Context**: Implements a `SettingsContext` tied to `localStorage`, allowing the user to dynamically switch currency displays (e.g., USD to EUR) across the entire application instantly.
- **Activity & Document Viewing**: Embedded document handling. Brokers can upload proofs of payment natively and download or preview system-generated PDFs (like official policies) via blob streaming from the backend.

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+ recommended)
- `npm` or `bun`

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or if you use bun
   bun install

2. **Configure API Endpoint**
The application defaults to `http://localhost:8081/api` to communicate with the Spring Boot backend. If your backend runs on a different port, update the `API_BASE_URL` inside `src/lib/api.ts`.
3. **Fire it up**
```bash
npm run dev
```


*The app will be available at `http://localhost:8080` (or whichever port Vite assigns).*

## 🏗️ Project Structure

* `/src/components` - Reusable UI components (buttons, tables, dialogs). Heavily relies on Shadcn/ui.
* `/src/contexts` - The heart of the state. Contains `AuthContext`, `DataContext`, and `SettingsContext`.
* `/src/pages` - View-level components mapped directly to routes.
* `/src/lib` - Core utilities, including the Axios instance with JWT interceptors.
* `/src/types` - TypeScript interfaces mapping the backend entities exactly.

---

*Fast. Secure. Built for the modern insurance broker.*
