export default function WorkflowCanvas({ nodes }) {
  // Simple vertical DAG visualization (upgrade to React Flow later)
  return (
    <div className="canvas">
      {nodes.map((n, i) => (
        <div key={n.id} className="node-wrap">
          <div className={`node type-${n.type}`}>
            <span className="type">{n.type}</span>
            <strong>{n.label || n.id}</strong>
            {n.next?.length > 0 && (
              <span className="next">→ {n.next.join(', ')}</span>
            )}
          </div>
          {i < nodes.length - 1 && <div className="edge" />}
        </div>
      ))}
    </div>
  );
}
