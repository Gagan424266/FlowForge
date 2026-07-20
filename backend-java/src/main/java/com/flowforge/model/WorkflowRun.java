package com.flowforge.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class WorkflowRun {
  public enum Status { QUEUED, RUNNING, SUCCESS, FAILED, DEAD_LETTER }

  private String id = UUID.randomUUID().toString();
  private String workflowId;
  private Status status = Status.QUEUED;
  private int attempt = 0;
  private List<String> logs = new ArrayList<>();
  private Instant startedAt;
  private Instant finishedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getWorkflowId() { return workflowId; }
  public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }
  public Status getStatus() { return status; }
  public void setStatus(Status status) { this.status = status; }
  public int getAttempt() { return attempt; }
  public void setAttempt(int attempt) { this.attempt = attempt; }
  public List<String> getLogs() { return logs; }
  public void setLogs(List<String> logs) { this.logs = logs; }
  public Instant getStartedAt() { return startedAt; }
  public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
  public Instant getFinishedAt() { return finishedAt; }
  public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }

  public void log(String msg) {
    logs.add("[" + Instant.now() + "] " + msg);
  }
}
