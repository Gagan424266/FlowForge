/**
 * Natural language → workflow JSON (rule-based scaffold; swap LLM later).
 * Port of aiml/app/main.py
 */
import { v4 as uuidv4 } from 'uuid';

export function nlToWorkflow(prompt) {
  const text = (prompt || '').toLowerCase();
  const nodes = [];
  const trigger = {
    id: 'trigger',
    type: 'trigger',
    label: text.includes('webhook') ? 'Webhook' : 'Manual',
    config: {},
    next: [],
  };
  nodes.push(trigger);
  let prev = 'trigger';

  if (text.includes('email') || text.includes('mail')) {
    const nid = 'email1';
    let to = 'user@example.com';
    const m = (prompt || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (m) to = m[0];
    nodes.push({
      id: nid,
      type: 'email',
      label: `Email ${to}`,
      config: { to, subject: 'FlowForge notification' },
      next: [],
    });
    nodes[nodes.length - 2].next = [nid];
    prev = nid;
  }

  if (
    text.includes('http') ||
    text.includes('api') ||
    text.includes('post') ||
    text.includes('get')
  ) {
    const nid = 'http1';
    let url = 'https://httpbin.org/post';
    const m = (prompt || '').match(/https?:\/\/\S+/);
    if (m) url = m[0].replace(/[.,)]+$/, '');
    const method = text.includes('post') ? 'POST' : 'GET';
    nodes.push({
      id: nid,
      type: 'http',
      label: `${method} request`,
      config: { url, method },
      next: [],
    });
    for (const n of nodes) {
      if (n.id === prev) n.next = [nid];
    }
    prev = nid;
  }

  if (text.includes('delay') || text.includes('wait')) {
    const nid = 'delay1';
    let ms = 1000;
    const m = text.match(/(\d+)\s*(ms|sec|s|seconds?)/);
    if (m) {
      const val = parseInt(m[1], 10);
      const unit = m[2];
      ms = unit === 'ms' ? val : val * 1000;
    }
    nodes.push({
      id: nid,
      type: 'delay',
      label: `Wait ${ms}ms`,
      config: { ms },
      next: [],
    });
    for (const n of nodes) {
      if (n.id === prev) n.next = [nid];
    }
  }

  if (nodes.length === 1) {
    nodes.push({
      id: 'http1',
      type: 'http',
      label: 'POST notify',
      config: { url: 'https://httpbin.org/post', method: 'POST' },
      next: [],
    });
    nodes[0].next = ['http1'];
  }

  return {
    id: uuidv4(),
    name: 'Generated from NL',
    description: (prompt || '').slice(0, 200),
    nodes,
    enabled: true,
  };
}
