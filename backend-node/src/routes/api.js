import { Router } from 'express';
import { WorkflowService } from '../service/workflowService.js';
import { nlToWorkflow } from '../aiml/nlToWorkflow.js';

const service = new WorkflowService();
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'flowforge-node' });
});

router.get('/workflows', (_req, res) => {
  res.json(service.list());
});

router.get('/workflows/:id', (req, res) => {
  const w = service.get(req.params.id);
  if (!w) return res.status(404).json({ message: 'Not found' });
  res.json(w);
});

router.post('/workflows', (req, res) => {
  try {
    res.status(201).json(service.create(req.body || {}));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/workflows/:id/trigger', async (req, res) => {
  try {
    const run = await service.trigger(req.params.id);
    res.json(run);
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Not found' });
    }
    res.status(500).json({ message: e.message });
  }
});

router.get('/runs', (_req, res) => {
  res.json(service.listRuns());
});

router.get('/runs/:id', (req, res) => {
  const r = service.getRun(req.params.id);
  if (!r) return res.status(404).json({ message: 'Not found' });
  res.json(r);
});

router.get('/dlq', (_req, res) => {
  res.json(service.deadLetterIds());
});

router.post('/nl-to-workflow', (req, res) => {
  const prompt = req.body?.prompt ?? '';
  res.json(nlToWorkflow(prompt));
});

export default router;
