/**
 * DAG utilities: cycle detection (DFS colors) + topological order (Kahn).
 * Port of DagEngine.java
 */

function index(workflow) {
  const map = new Map();
  for (const n of workflow.nodes || []) {
    map.set(n.id, n);
  }
  return map;
}

/**
 * DFS 3-color cycle detection. Throws if a cycle is found.
 */
export function validateAcyclic(workflow) {
  const byId = index(workflow);
  const color = new Map(); // 0=white 1=gray 2=black
  for (const n of workflow.nodes || []) {
    color.set(n.id, 0);
  }
  for (const n of workflow.nodes || []) {
    if (color.get(n.id) === 0 && hasCycle(n.id, byId, color)) {
      throw new Error(`Workflow contains a cycle at node ${n.id}`);
    }
  }
}

function hasCycle(id, byId, color) {
  color.set(id, 1);
  const node = byId.get(id);
  if (node) {
    for (const next of node.next || []) {
      const c = color.get(next) ?? 0;
      if (c === 1) return true;
      if (c === 0 && hasCycle(next, byId, color)) return true;
    }
  }
  color.set(id, 2);
  return false;
}

/** Kahn's algorithm — returns node ids in execution order. */
export function topologicalOrder(workflow) {
  const byId = index(workflow);
  const indegree = new Map();
  for (const n of workflow.nodes || []) {
    if (!indegree.has(n.id)) indegree.set(n.id, 0);
    for (const next of n.next || []) {
      indegree.set(next, (indegree.get(next) ?? 0) + 1);
    }
  }
  const q = [];
  for (const [id, d] of indegree) {
    if (d === 0) q.push(id);
  }
  const order = [];
  while (q.length) {
    const u = q.shift();
    order.push(u);
    const node = byId.get(u);
    if (!node) continue;
    for (const v of node.next || []) {
      const d = indegree.get(v) - 1;
      indegree.set(v, d);
      if (d === 0) q.push(v);
    }
  }
  if (order.length !== (workflow.nodes || []).length) {
    throw new Error('Cannot topologically sort — cycle present');
  }
  return order;
}
