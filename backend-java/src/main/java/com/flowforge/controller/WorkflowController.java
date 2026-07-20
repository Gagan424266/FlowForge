package com.flowforge.controller;

import com.flowforge.model.Workflow;
import com.flowforge.model.WorkflowRun;
import com.flowforge.service.WorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
public class WorkflowController {
  private final WorkflowService service;

  public WorkflowController(WorkflowService service) {
    this.service = service;
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "ok", "service", "flowforge-java");
  }

  @GetMapping("/workflows")
  public List<Workflow> list() {
    return service.list();
  }

  @GetMapping("/workflows/{id}")
  public Workflow get(@PathVariable String id) {
    Workflow w = service.get(id);
    if (w == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return w;
  }

  @PostMapping("/workflows")
  public Workflow create(@RequestBody Workflow workflow) {
    try {
      return service.create(workflow);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    }
  }

  @PostMapping("/workflows/{id}/trigger")
  public WorkflowRun trigger(@PathVariable String id) {
    try {
      return service.trigger(id);
    } catch (NoSuchElementException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }

  @GetMapping("/runs")
  public List<WorkflowRun> runs() {
    return service.listRuns();
  }

  @GetMapping("/runs/{id}")
  public WorkflowRun run(@PathVariable String id) {
    WorkflowRun r = service.getRun(id);
    if (r == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return r;
  }

  @GetMapping("/dlq")
  public List<String> dlq() {
    return service.deadLetterIds();
  }
}
