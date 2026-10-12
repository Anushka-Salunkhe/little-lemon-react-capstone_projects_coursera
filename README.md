# Little Lemon — Interactive React Capstone

A multi-view restaurant website built with React + Vite and an Express API. Features separate Home, Menu and Book Table views; food photos and prices; quantity controls and basket; live table availability; and a booking API that rejects occupied tables for the same date/time.

## Requirements
- Node.js 18+ (Node.js 20 LTS recommended)
- npm
- Git / VS Code

## Run locally
1. Extract the ZIP and open the extracted project root in VS Code. The root folder must contain `package.json`.
2. Open Terminal → New Terminal.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the React development server and booking API together:

   ```bash
   npm run dev
   ```

5. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The Express API runs at `http://localhost:3001`; Vite proxies `/api` calls to it. Keep the terminal running while you use the website.

## Tests and production build
```bash
npm test
npm run build
```

## How table booking works
- The API has a demo inventory of 10 tables with different capacities.
- Availability is checked for the chosen date, time and guest count.
- When a booking is submitted, the server rechecks availability and returns HTTP 409 with a clear message if no suitable table remains.
- Successful bookings are written to `server/data/bookings.json`. That file is ignored by Git.
- To test conflict handling, book the last suitable table for a particular date/time, then try the same date/time and party size again. Choose a different time or date to continue.

## Menu basket
The Menu view includes category filters, item photos, prices, quantity increment/decrement, and a basket drawer with item subtotals and total.

## Important production note
This is a local educational demo, not a production-ready booking service. JSON-file storage is suitable for demonstrating the flow on one running server, but is not safe for simultaneous writes at scale and is not shared between different computers when each runs its own local server. For real public use, replace it with a managed database and atomic transaction/unique constraint for `(date, time, table_id)`, deploy the API to a persistent server, add authentication/authorization and privacy protections, and integrate email/SMS confirmation. Images are loaded from remote Unsplash URLs and require an internet connection.

## GitHub
Create an empty public repository, then run these commands in the project root (replace the URL with your repository):

```bash
git init
git add .
git commit -m "Build interactive Little Lemon React capstone"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/little-lemon-react-capstone.git
git push -u origin main
```

## Peer-review checklist
- [ ] Home, Menu and Book Table are separate views
- [ ] Menu has images, prices, categories and quantity controls
- [ ] Basket quantity and subtotal update correctly
- [ ] Booking availability responds to date, time and guest count
- [ ] Duplicate/occupied table attempt shows a conflict message
- [ ] Accessible labels and responsive layout work
- [ ] `npm test` passes and `npm run build` succeeds
- [ ] Public GitHub repo and setup instructions are available
