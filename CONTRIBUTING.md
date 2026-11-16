# Contributing to Chicklets

Welcome to Chicklets! We're excited that you want to contribute to this nostalgic Indian multiplayer childhood game. Whether you're fixing bugs, adding new features, improving 3D visuals, or writing tests, all contributions are welcome.

---

## 🛠️ Tech Stack & Workspace Overview

Chicklets is organized as an npm monorepo with three core workspaces:

- **`apps/client`**: Vite + React 19 + Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`) + Tailwind/CSS modules.
- **`apps/server`**: Node.js authoritative game server + WebSocket/HTTP + rule-based bot engine.
- **`packages/shared`**: Shared TypeScript types, game states, protocol packets, and round constants.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.19+` (LTS recommended)
- **npm**: `v10+`
- **Git**

### Installation & Development Setup

1. **Fork & Clone** the repository:
   ```sh
   git clone https://github.com/<your-username>/knock-knock-Chicklets-.git
   cd knock-knock-Chicklets-
   ```

2. **Install Dependencies**:
   ```sh
   npm install
   ```

3. **Configure Environment Variables**:
   ```sh
   cp .env.example .env
   ```

4. **Run Development Server**:
   ```sh
   npm run dev
   ```
   This runs both the WebSocket backend server and the Vite client concurrently.
   - Client: `http://localhost:5173`
   - Server: `http://localhost:3000`

---

## 🧪 Testing & Building

Before committing your changes, make sure all tests pass and the packages build cleanly:

```sh
# Run server test suites (unit + integration + bot tests)
npm test

# Build all packages and applications (shared -> server -> client)
npm run build
```

---

## 📐 Project Conventions & Guidelines

### Architecture & Authority Rules
- **Authoritative Server**: All positions, boundaries, hitboxes, knock resolves, roles, and state transitions belong to the server. The client should never decide game rules.
- **Shared Contracts**: If you change or add WebSocket packet types, update them in `packages/shared/src/index.ts` first and run `npm run build -w @chicklets/shared`.
- **Bot Behavior**: If introducing new rules or game phases, ensure bot handlers in `apps/server/src/bots.ts` are updated and tested in `apps/server/src/bots.test.ts`.

### Git Workflow & Commit Guidelines
1. Create a feature branch:
   ```sh
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. Commit message format follows [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add sound effect manager for knock responses`
   - `fix: prevent runner freeze on simultaneous knock timeout`
   - `docs: update setup guide in CONTRIBUTING.md`
   - `perf: optimize instanced leaf rendering in courtyard`
3. Push to your fork and submit a Pull Request describing your changes, screenshots (if UI/3D changes), and testing steps.

---

## 🎨 Asset & Licensing Guidelines
- Only use CC0 or open-source assets with clear attribution.
- Update `docs/ASSET_CREDITS.md` or attribution sections whenever adding audio, textures, or 3D models.
