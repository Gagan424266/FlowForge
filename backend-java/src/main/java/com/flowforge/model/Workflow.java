package com.flowforge.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Workflow {
  private String id = UUID.randomUUID().toString();
  private String name;
  private String description;
  private List<WorkflowNode> nodes = new ArrayList<>();
  private boolean enabled = true;
  private Instant createdAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public List<WorkflowNode> getNodes() { return nodes; }
  public void setNodes(List<WorkflowNode> nodes) { this.nodes = nodes; }
  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
