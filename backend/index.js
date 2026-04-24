const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const USER_ID = "baibhavbaidya_30112004"; 
const EMAIL_ID = "baibhav_baidya@srmap.edu.in";
const COLLEGE_ROLL = "AP23110010756";

function isValidEntry(entry) {
  if (typeof entry !== 'string') return false;
  const trimmed = entry.trim();
  const regex = /^[A-Z]->[A-Z]$/;
  return regex.test(trimmed);
}

function buildHierarchies(edges) {
  // Track children and parents
  const children = {}; // parent -> [child]
  const parentOf = {}; // child -> parent (first-encountered wins)
  const allNodes = new Set();

  for (const edge of edges) {
    const [parent, child] = edge.split('->');
    allNodes.add(parent);
    allNodes.add(child);

    if (!children[parent]) children[parent] = [];

    // Multi-parent: first-encountered parent wins
    if (parentOf[child] === undefined) {
      parentOf[child] = parent;
      children[parent].push(child);
    }
    // silently discard subsequent parent edges for same child
  }

  // Find roots: nodes that never appear as a child
  const roots = [];
  for (const node of allNodes) {
    if (parentOf[node] === undefined) {
      roots.push(node);
    }
  }

  // Group nodes into connected components
  // Build adjacency (undirected) for grouping
  const adj = {};
  for (const node of allNodes) {
    adj[node] = new Set();
  }
  for (const edge of edges) {
    const [p, c] = edge.split('->');
    adj[p].add(c);
    adj[c].add(p);
  }

  const visited = new Set();
  const components = [];

  function bfsComponent(start) {
    const comp = new Set();
    const queue = [start];
    while (queue.length) {
      const node = queue.shift();
      if (comp.has(node)) continue;
      comp.add(node);
      for (const nb of adj[node]) {
        if (!comp.has(nb)) queue.push(nb);
      }
    }
    return comp;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const comp = bfsComponent(node);
      for (const n of comp) visited.add(n);
      components.push(comp);
    }
  }

  const hierarchies = [];

  for (const comp of components) {
    // Find root of this component
    const compRoots = [...comp].filter(n => parentOf[n] === undefined);
    let root;

    if (compRoots.length === 0) {
      // Pure cycle - use lex smallest
      root = [...comp].sort()[0];
    } else {
      root = compRoots.sort()[0]; // lex smallest root if multiple
    }

    // Cycle detection using DFS
    function hasCycle() {
      const color = {}; // 0=white, 1=gray, 2=black
      for (const n of comp) color[n] = 0;

      function dfs(node) {
        color[node] = 1;
        for (const child of (children[node] || [])) {
          if (!comp.has(child)) continue;
          if (color[child] === 1) return true;
          if (color[child] === 0 && dfs(child)) return true;
        }
        color[node] = 2;
        return false;
      }

      return dfs(root);
    }

    const cycleFound = hasCycle();

    if (cycleFound) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      // Build nested tree object
      function buildTree(node) {
        const obj = {};
        for (const child of (children[node] || [])) {
          obj[child] = buildTree(child);
        }
        return obj;
      }

      function calcDepth(node) {
        const kids = children[node] || [];
        if (kids.length === 0) return 1;
        return 1 + Math.max(...kids.map(calcDepth));
      }

      const tree = { [root]: buildTree(root) };
      const depth = calcDepth(root);

      hierarchies.push({ root, tree, depth });
    }
  }

  return hierarchies;
}

app.post('/bfhl', (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'data must be an array' });
  }

  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const validEdges = [];

  for (const item of data) {
    if (typeof item !== 'string') {
      invalid_entries.push(String(item));
      continue;
    }

    const trimmed = item.trim();

    // Validate format: single uppercase letter -> single uppercase letter
    const regex = /^[A-Z]->[A-Z]$/;
    if (!regex.test(trimmed)) {
      invalid_entries.push(item); // push original
      continue;
    }

    // Self-loop check
    const [parent, child] = trimmed.split('->');
    if (parent === child) {
      invalid_entries.push(item);
      continue;
    }

    // Duplicate check
    if (seenEdges.has(trimmed)) {
      // Only push once to duplicate_edges
      if (!duplicate_edges.includes(trimmed)) {
        duplicate_edges.push(trimmed);
      }
      continue;
    }

    seenEdges.add(trimmed);
    validEdges.push(trimmed);
  }

  const hierarchies = validEdges.length > 0 ? buildHierarchies(validEdges) : [];

  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic = hierarchies.filter(h => h.has_cycle);

  let largest_tree_root = '';
  if (nonCyclic.length > 0) {
    const sorted = [...nonCyclic].sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root.localeCompare(b.root); // lex tiebreak
    });
    largest_tree_root = sorted[0].root;
  }

  return res.json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));