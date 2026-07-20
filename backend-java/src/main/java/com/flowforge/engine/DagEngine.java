package com.flowforge.engine;

import com.flowforge.model.Workflow;
import com.flowforge.model.WorkflowNode;

import java.util.*;

/**
 * DAG utilities: cycle detection (DFS colors) + topological order (Kahn).
 */
public final class DagEngine {
  private DagEngine() {}

  public static void validateAcyclic(Workflow workflow) {
    Map<String, WorkflowNode> byId = index(workflow);
    Map<String, Integer> color = new HashMap<>(); // 0=white 1=gray 2=black
    for (WorkflowNode n : workflow.getNodes()) {
      color.put(n.getId(), 0);
    }
    for (WorkflowNode n : workflow.getNodes()) {
      if (color.get(n.getId()) == 0 && hasCycle(n.getId(), byId, color)) {
        throw new IllegalArgumentException("Workflow contains a cycle at node " + n.getId());
      }
    }
  }

  private static boolean hasCycle(String id, Map<String, WorkflowNode> byId, Map<String, Integer> color) {
    color.put(id, 1);
    WorkflowNode node = byId.get(id);
    if (node != null) {
      for (String next : node.getNext()) {
        int c = color.getOrDefault(next, 0);
        if (c == 1) return true;
        if (c == 0 && hasCycle(next, byId, color)) return true;
      }
    }
    color.put(id, 2);
    return false;
  }

  /** Kahn's algorithm — returns node ids in execution order. */
  public static List<String> topologicalOrder(Workflow workflow) {
    Map<String, WorkflowNode> byId = index(workflow);
    Map<String, Integer> indegree = new HashMap<>();
    for (WorkflowNode n : workflow.getNodes()) {
      indegree.putIfAbsent(n.getId(), 0);
      for (String next : n.getNext()) {
        indegree.put(next, indegree.getOrDefault(next, 0) + 1);
      }
    }
    Deque<String> q = new ArrayDeque<>();
    for (Map.Entry<String, Integer> e : indegree.entrySet()) {
      if (e.getValue() == 0) q.add(e.getKey());
    }
    List<String> order = new ArrayList<>();
    while (!q.isEmpty()) {
      String u = q.removeFirst();
      order.add(u);
      WorkflowNode node = byId.get(u);
      if (node == null) continue;
      for (String v : node.getNext()) {
        int d = indegree.get(v) - 1;
        indegree.put(v, d);
        if (d == 0) q.add(v);
      }
    }
    if (order.size() != workflow.getNodes().size()) {
      throw new IllegalArgumentException("Cannot topologically sort — cycle present");
    }
    return order;
  }

  private static Map<String, WorkflowNode> index(Workflow workflow) {
    Map<String, WorkflowNode> map = new HashMap<>();
    for (WorkflowNode n : workflow.getNodes()) {
      map.put(n.getId(), n);
    }
    return map;
  }
}
