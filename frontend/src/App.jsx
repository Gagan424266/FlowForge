import { useEffect, useState } from 'react';
import {
  listWorkflows,
  triggerWorkflow,
  createWorkflow,
  listRuns,
  nlToWorkflow,
} from './api/client';
import WorkflowCanvas from './components/WorkflowCanvas';

export default function App() {
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [runs, setRuns] = useState([]);
  const [prompt, setPrompt] = useState(
    'On webhook, wait 2 seconds then POST https://httpbin.org/post'
  );
  const [msg, setMsg] = useState('');

  async function refresh() {
    const [w, r] = await Promise.all([listWorkflows(), listRuns()]);
    setWorkflows(w);
    setRuns(r.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')));
    if (!selected && w[0]) setSelected(w[0]);
  }

  useEffect(() => {
    refresh().catch((e) => setMsg(e.message));
  }, []);

  async function onTrigger() {
    if (!selected) return;
    const run = await triggerWorkflow(selected.id);
    setMsg(`Run ${run.status} · attempt ${run.attempt}`);
    await refresh();
  }

  async function onGenerate() {
    setMsg('Generating…');
    const wf = await nlToWorkflow(prompt);
    const created = await createWorkflow(wf);
    setSelected(created);
    setMsg('Workflow created from natural language');
    await refresh();
  }

  return (
    <div className="shell">
      <header className="top">
        <div>
          <h1 className="brand">FlowForge</h1>
          <p className="tag">Automation engine · DAG · retries · NL builder</p>
        </div>
        <button type="button" onClick={onTrigger} disabled={!selected}>
          Run selected
        </button>
      </header>

      <section className="nl">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button type="button" className="secondary" onClick={onGenerate}>
          NL → Workflow
        </button>
      </section>
      {msg && <p className="msg">{msg}</p>}

      <div className="layout">
        <aside className="panel">
          <h2>Workflows</h2>
          <ul>
            {workflows.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={selected?.id === w.id ? 'active' : 'ghost'}
                  onClick={() => setSelected(w)}
                >
                  {w.name}
                </button>
              </li>
            ))}
          </ul>
          <h2>Recent runs</h2>
          <ul className="runs">
            {runs.slice(0, 8).map((r) => (
              <li key={r.id}>
                <span className={`st ${r.status}`}>{r.status}</span>
                <code>{r.id.slice(0, 8)}</code>
              </li>
            ))}
          </ul>
        </aside>
        <main className="panel grow">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <p className="muted">{selected.description}</p>
              <WorkflowCanvas nodes={selected.nodes || []} />
              {runs
                .filter((r) => r.workflowId === selected.id)
                .slice(0, 1)
                .map((r) => (
                  <pre key={r.id} className="logs">
                    {(r.logs || []).join('\n')}
                  </pre>
                ))}
            </>
          ) : (
            <p className="muted">Select or generate a workflow</p>
          )}
        </main>
      </div>
    </div>
  );
}
