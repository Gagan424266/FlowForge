package com.flowforge.service;

import com.flowforge.engine.DagEngine;
import com.flowforge.model.Workflow;
import com.flowforge.model.WorkflowNode;
import com.flowforge.model.WorkflowRun;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WorkflowService {
  private final Map<String, Workflow> workflows = new ConcurrentHashMap<>();
  private final Map<String, WorkflowRun> runs = new ConcurrentHashMap<>();
  private final Deque<String> deadLetter = new ArrayDeque<>();

  @Value("${flowforge.max-retries:3}")
  private int maxRetries;

  public WorkflowService() {
    seedSample();
  }

  private void seedSample() {
    Workflow w = new Workflow();
    w.setName("Webhook → HTTP notify");
    w.setDescription("On webhook, call downstream API");
    WorkflowNode t = new WorkflowNode();
    t.setId("trigger");
    t.setType("trigger");
    t.setLabel("Webhook");
    t.setNext(List.of("http1"));
    WorkflowNode h = new WorkflowNode();
    h.setId("http1");
    h.setType("http");
    h.setLabel("POST notify");
    h.getConfig().put("url", "https://httpbin.org/post");
    h.getConfig().put("method", "POST");
    w.setNodes(List.of(t, h));
    workflows.put(w.getId(), w);
  }

  public List<Workflow> list() {
    return new ArrayList<>(workflows.values());
  }

  public Workflow get(String id) {
    return workflows.get(id);
  }

  public Workflow create(Workflow workflow) {
    DagEngine.validateAcyclic(workflow);
    workflows.put(workflow.getId(), workflow);
    return workflow;
  }

  public WorkflowRun trigger(String workflowId) {
    Workflow wf = workflows.get(workflowId);
    if (wf == null) throw new NoSuchElementException("Workflow not found");
    WorkflowRun run = new WorkflowRun();
    run.setWorkflowId(workflowId);
    runs.put(run.getId(), run);
    executeWithRetry(wf, run);
    return run;
  }

  private void executeWithRetry(Workflow wf, WorkflowRun run) {
    while (run.getAttempt() < maxRetries) {
      run.setAttempt(run.getAttempt() + 1);
      run.setStatus(WorkflowRun.Status.RUNNING);
      run.setStartedAt(Instant.now());
      try {
        executeOnce(wf, run);
        run.setStatus(WorkflowRun.Status.SUCCESS);
        run.setFinishedAt(Instant.now());
        return;
      } catch (Exception e) {
        run.log("Attempt " + run.getAttempt() + " failed: " + e.getMessage());
        // exponential backoff placeholder
        try { Thread.sleep(100L * (1L << (run.getAttempt() - 1))); } catch (InterruptedException ignored) {}
      }
    }
    run.setStatus(WorkflowRun.Status.DEAD_LETTER);
    run.setFinishedAt(Instant.now());
    deadLetter.add(run.getId());
    run.log("Moved to dead-letter queue");
  }

  private void executeOnce(Workflow wf, WorkflowRun run) {
    List<String> order = DagEngine.topologicalOrder(wf);
    Map<String, WorkflowNode> byId = new HashMap<>();
    for (WorkflowNode n : wf.getNodes()) byId.put(n.getId(), n);

    for (String id : order) {
      WorkflowNode node = byId.get(id);
      run.log("Executing " + node.getType() + ":" + node.getLabel());
      switch (node.getType()) {
        case "trigger" -> run.log("Trigger fired");
        case "http" -> run.log("HTTP " + node.getConfig().getOrDefault("method", "GET")
            + " " + node.getConfig().getOrDefault("url", ""));
        case "email" -> run.log("Email to " + node.getConfig().getOrDefault("to", "n/a"));
        case "delay" -> {
          Object ms = node.getConfig().getOrDefault("ms", 100);
          try { Thread.sleep(Long.parseLong(ms.toString())); } catch (Exception ignored) {}
          run.log("Delayed " + ms + "ms");
        }
        case "condition" -> run.log("Condition evaluated (scaffold always true)");
        default -> run.log("Unknown node type — skipped");
      }
    }
  }

  public WorkflowRun getRun(String id) {
    return runs.get(id);
  }

  public List<WorkflowRun> listRuns() {
    return new ArrayList<>(runs.values());
  }

  public List<String> deadLetterIds() {
    return new ArrayList<>(deadLetter);
  }
}
