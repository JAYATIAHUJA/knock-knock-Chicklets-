# CHICKLETS

An Indian childhood knock-knock game in a multiplayer mohalla courtyard.

## Run

Requires Node 20.19+.

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. Create an adda, copy the link, and join with different nicknames. Enable **Practice with 2–4 friends** for small groups; use at least three players to try name transfers. In a normal room, 5–8 players are needed. Use WASD or arrow keys to move and Shift to sprint; touch devices show a direction pad and RUN button. Refreshing a tab within 20 seconds restores its player while the server remains running.

## How to play

1. Everyone readies up. The DENNER chooses a category, such as Cars.
2. Other players choose unique secret names, such as Maruti and BMW.
3. The DENNER approaches a player and knocks with a guessed name. That player sees “Knock knock! Kya tum Maruti ho?” and can type a reply or tap a quick comeback.
4. The server checks the actual secret after the reply, or after a 12-second timeout. A wrong guess resumes knocking; a correct guess starts the chase.
5. The runner sees only assigned, connected players' secret names in the centre relay panel. Tap one or use its number key while moving to transfer the chase. Own, unassigned or disconnected names are rejected without eliminating the caller. Choices are private to the current runner; the DENNER cannot see the list.
6. Each new runner gets a 3.5-second head start with the DENNER held still. Active safe spots protect runners and other players from tags until the spots rotate. A tag outside safety, crossing the square chalk boundary, or failing to relay within 20 seconds makes the runner the next DENNER. A fresh round follows.

Replies are plain text, visible in character speech bubbles. They cannot override whether the guessed name matches. A player disconnecting during their knock cancels that exchange.

```sh
npm test
npm run build
```

For deployment, serve `apps/client/dist` as static files and start the server with `npm run start -w @chicklets/server`. Set `PORT` for the server and `VITE_SERVER_URL` at client build time to its public URL. Rooms are in memory and require sticky routing or a single server instance.

### Computer friends
Choose **2 computer friends** or **3 computer friends** on the start screen, create the room, then press Ready. Bots pick names, knock and reply, chase and flee, and attempt relays. They are server-controlled rule-based opponents, clearly marked in the roster. Bot DENNER guesses do not read human secrets; uncertain relay calls can make bots out. Bots currently select Cars as DENNER. Friends may join a bot room while it is in the lobby. Rooms are removed once the last human session expires.

---

## 📚 Documentation & Contributing

- 📖 [Contributing Guide](CONTRIBUTING.md): Setup, workflow, PR conventions, and guidelines.
- 🤖 [Agents Guide (AGENTS.md)](AGENTS.md): Architecture principles and operational rules for AI coding assistants.
- 🎨 [Game & Design Philosophy (DESIGN.md)](DESIGN.md): Aesthetic mood, 3D courtyard vision, and state diagrams.
- 📄 [License](LICENSE): MIT License.


### Vercel deployment
Import the repository root. vercel.json builds the shared package and client. Set VITE_SERVER_URL to the HTTPS URL of your persistent Node multiplayer server before deployment. Run the server separately using npm run start -w @chicklets/server after building the shared and server workspaces. Verify its /health endpoint before inviting players.
