const API = '/api';

export async function listWorkflows() {
  const res = await fetch(`${API}/workflows`);
  return res.json();
}

export async function triggerWorkflow(id) {
  const res = await fetch(`${API}/workflows/${id}/trigger`, { method: 'POST' });
  return res.json();
}

export async function createWorkflow(body) {
  const res = await fetch(`${API}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Create failed');
  return data;
}

export async function listRuns() {
  const res = await fetch(`${API}/runs`);
  return res.json();
}

export async function nlToWorkflow(prompt) {
  const res = await fetch(`${API}/nl-to-workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return res.json();
}
