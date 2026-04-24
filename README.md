# BFHL Tree Explorer

A full-stack application built for the **Bajaj Finserv Health Labs (BFHL) SRM Full Stack Engineering Challenge**.

## Live Demo

- **Frontend**: https://bfhl-project-tau.vercel.app
- **Backend API**: https://bfhl-backend-r9pj.onrender.com

## What it does

Takes an array of node edge strings like `A->B`, `A->C`, `B->D` and:

- Parses and validates each entry
- Builds hierarchical tree structures from valid edges
- Detects cycles in node groups
- Calculates depth of each tree
- Identifies invalid entries and duplicate edges
- Returns structured JSON with full hierarchy and summary

## API

**POST** `/bfhl`

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"]
}
```

**Response:**
```json
{
  "user_id": "fullname_ddmmyyyy",
  "email_id": "youremail",
  "college_roll_number": "AP231100XXXXX",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {}, "C": {} } }, "depth": 2 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": ["hello"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## Tech Stack

- **Backend**: Node.js, Express, CORS — deployed on Render
- **Frontend**: HTML, CSS, Vanilla JS — deployed on Vercel

## Project Structure

```
bfhl-project/
├── backend/
│   ├── index.js        # Express API
│   └── package.json
└── frontend/
    └── index.html      # Single page frontend
```

## Running Locally

**Backend:**
```bash
cd backend
npm install
node index.js
# runs on http://localhost:3000
```

**Frontend:**
```bash
# open frontend/index.html with Live Server in VS Code
# or just open in browser after updating API_URL to localhost
```

## Processing Rules

- Valid edges: `X->Y` where X and Y are single uppercase letters (A–Z)
- Self-loops (`A->A`) are treated as invalid
- Duplicate edges: only first occurrence used, rest tracked separately
- Multi-parent nodes: first-encountered parent wins
- Cycle detection: DFS-based, cyclic groups return `has_cycle: true` and empty tree
- Depth: number of nodes on longest root-to-leaf path
- Pure cycles (no natural root): lexicographically smallest node used as root