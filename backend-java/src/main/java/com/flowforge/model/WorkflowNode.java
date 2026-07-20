package com.flowforge.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WorkflowNode {
  private String id;
  private String type; // trigger | http | email | delay | condition
  private String label;
  private Map<String, Object> config = new HashMap<>();
  private List<String> next = new ArrayList<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
  public Map<String, Object> getConfig() { return config; }
  public void setConfig(Map<String, Object> config) { this.config = config; }
  public List<String> getNext() { return next; }
  public void setNext(List<String> next) { this.next = next; }
}
