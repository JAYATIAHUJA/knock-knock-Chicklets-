# AGENTS.md

Instructions, architecture constraints, and operational context for AI Coding Agents (such as Claude Code, Antigravity, Cursor, GitHub Copilot Workspace, Codex, etc.) working in the **Chicklets** codebase.

---

## 🏛️ System Architecture & Mental Model

Chicklets is a multiplayer Indian childhood game ("Knock-knock Chicklets / Mohalla courtyard chase") structured as a clean TypeScript npm monorepo:

```text
├── apps/
│   ├── client/     # React 19, Three.js, @react-three/fiber, @react-three/drei, Zustand/Store
│   └── server/     # Node.js authoritative game loop, WebSocket networking, rule-based AI bots
├── packages/
│   └── shared/     # Authoritative shared types, contracts, round phases, protocol messages
├── docs/           # Architecture diagrams, asset credits, design notes
└── scripts/        # Dev and utility scripts
```

### Critical Rules for AI Agents

1. **Authoritative Server Rule**:
   - The server (`apps/server`) has 100% authority over game logic, boundaries, player roles, secret identities, knock resolution, tags, and relays.
   - The client (`apps/client`) is strictly an input emitter and renderer. **NEVER** calculate game outcomes, secret validation, or winner states on the client.
2. **Deterministic Protocol & Type Safety**:
   - All network events, state packets, and player snapshot shapes originate in `packages/shared/src/index.ts`.
   - Whenever editing or adding client-server communication, check `packages/shared` first and ensure cross-package type compatibility.
3. **Tick & Snapshot Model**:
   - Fixed 60 Hz server tick for game simulation, 20 Hz public state snapshot broadcasts.
   - Disconnected players retain their state for a 20-second grace period with session tokens. Do not inadvertently break session reconciliation in `game.ts`.
4. **Bot Simulation Alignment**:
   - If game phases, categories, or knock-chase mechanics change, update the bot decision trees in `apps/server/src/bots.ts` and test them with `apps/server/src/bots.test.ts`.

---

## 🛠️ Build & Test Commands

Agents should verify changes using these commands:

```bash
# Clean build across all packages in dependency order
npm run build

# Run server unit, integration, and bot test suites
npm test

# Run a specific test suite
npm run test -w @chicklets/server -- apps/server/src/game.test.ts
npm run test -w @chicklets/server -- apps/server/src/bots.test.ts
```

---

## 📁 Key File Locations

| File | Purpose |
|---|---|
| `packages/shared/src/index.ts` | Shared interfaces, packet schemas, game phases (`LOBBY`, `CATEGORY`, `IDENTITY`, `GUESSING`, `KNOCK`, `CHASE`, `CAUGHT`). |
| `apps/server/src/game.ts` | Authoritative room manager, player sessions, 60Hz loop, boundary enforcement. |
| `apps/server/src/bots.ts` | Bot strategy: secret selection, knocking, replies, evasive fleeing, chase transfers. |
| `apps/server/src/index.ts` | WebSocket server setup and connection handlers. |
| `apps/client/src/World.tsx` | 3D Mohalla scene, procedural architecture, lighting, PBR materials. |
| `apps/client/src/Avatar.tsx` | Character rendering, skeletal procedural animations, sprint/speech states. |
| `apps/client/src/KnockPlay.tsx` | 2D HUD overlays for category choice, knocking dialogues, and quick comebacks. |
| `apps/client/src/network.ts` | WebSocket client connection and reconciliation handlers. |

