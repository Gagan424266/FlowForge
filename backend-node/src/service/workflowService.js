/**
 * In-memory workflow store + DAG execution with retries / DLQ.
 * Port of WorkflowService.java
 */
import { v4 as uuidv4 } from 'uuid';
import { validateAcyclic, topologicalOrder } from '../engine/dagEngine.js';

const MAX_RETRIES = Number(process.env.FLOWFORGE_MAX_RETRIES || 3);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createWorkflowShell(partial = {}) {
  return {
    id: partial.id || uuidv4(),
    name: partial.name || 'Untitled',
    description: partial.description || '',
    nodes: partial.nodes || [],
    enabled: partial.enabled !== false,
    createdAt: partial.createdAt || new Date().toISOString(),
  };
}

function createRun(workflowId) {
  return {
    id: uuidv4(),
    workflowId,
    status: 'QUEUED',
    attempt: 0,
    logs: [],
    startedAt: null,
    finishedAt: null,
    log(msg) {
      this.logs.push(`[${new Date().toISOString()}] ${msg}`);
    },
  };
}

function toPublicRun(run) {
  const { log, ...rest } = run;
  return rest;
}

export class WorkflowService {
  constructor() {
    this.workflows = new Map();
    this.runs = new Map();
    this.deadLetter = [];
    this.seedSample();
  }

  seedSample() {
    const w = createWorkflowShell({
      name: 'Webhook → HTTP notify',
      description: 'On webhook, call downstream API',
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          label: 'Webhook',
          config: {},
          next: ['http1'],
        },
        {
          id: 'http1',
          type: 'http',
          label: 'POST notify',
          config: { url: 'https://httpbin.org/post', method: 'POST' },
          next: [],
        },
      ],
    });
    this.workflows.set(w.id, w);
  }

  list() {
    return [...this.workflows.values()];
  }

  get(id) {
    return this.workflows.get(id) || null;
  }

  create(body) {
    const workflow = createWorkflowShell(body);
    validateAcyclic(workflow);
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async trigger(workflowId) {
    const wf = this.workflows.get(workflowId);
    if (!wf) {
      const err = new Error('Workflow not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const run = createRun(workflowId);
    this.runs.set(run.id, run);
    await this.executeWithRetry(wf, run);
    return toPublicRun(run);
  }

  async executeWithRetry(wf, run) {
    while (run.attempt < MAX_RETRIES) {
      run.attempt += 1;
      run.status = 'RUNNING';
      run.startedAt = new Date().toISOString();
      try {
        await this.executeOnce(wf, run);
        run.status = 'SUCCESS';
        run.finishedAt = new Date().toISOString();
        return;
      } catch (e) {
        run.log(`Attempt ${run.attempt} failed: ${e.message}`);
        await sleep(100 * 2 ** (run.attempt - 1));
      }
    }
    run.status = 'DEAD_LETTER';
    run.finishedAt = new Date().toISOString();
    this.deadLetter.push(run.id);
    run.log('Moved to dead-letter queue');
  }

  async executeOnce(wf, run) {
    const order = topologicalOrder(wf);
    const byId = new Map((wf.nodes || []).map((n) => [n.id, n]));

    for (const id of order) {
      const node = byId.get(id);
      if (!node) continue;
      run.log(`Executing ${node.type}:${node.label}`);
      const config = node.config || {};
      switch (node.type) {
        case 'trigger':
          run.log('Trigger fired');
          break;
        case 'http':
          run.log(`HTTP ${config.method || 'GET'} ${config.url || ''}`);
          break;
        case 'email':
          run.log(`Email to ${config.to || 'n/a'}`);
          break;
        case 'delay': {
          const ms = Number(config.ms ?? 100);
          await sleep(ms);
          run.log(`Delayed ${ms}ms`);
          break;
        }
        case 'condition':
          run.log('Condition evaluated (scaffold always true)');
          break;
        default:
          run.log('Unknown node type — skipped');
      }
    }
  }

  getRun(id) {
    const run = this.runs.get(id);
    return run ? toPublicRun(run) : null;
  }

  listRuns() {
    return [...this.runs.values()].map(toPublicRun);
  }

  deadLetterIds() {
    return [...this.deadLetter];
  }
}
