---
slug: "topological-sort"
title: "拓扑排序与入度"
subject: "数据结构与算法"
description: "把依赖关系画成有向图，用零入度队列安排先后，并用处理数量识别环。"
order: 63
minutes: 21
lab: "workbench"
objectives: ["解释有向边和入度代表的先修关系", "逐轮执行 Kahn 算法", "判断环与多种合法拓扑序"]
prerequisites: ["graph-bfs", "graph-dfs"]
---

# 拓扑排序与入度

## 先做什么，后做什么

假设任务 A、B 都必须先于 C，C 先于 D，B 和 D 都先于 E。画成有向边：`A→C`、`B→C`、`C→D`、`B→E`、`D→E`。一条 `u→v` 表示必须先完成 u 再完成 v，方向不能反。

拓扑排序（Topological Sort）要给**有向无环图**（Directed Acyclic Graph，DAG）的所有顶点排一个线性顺序，使每条边的起点都出现在终点之前。本图的 `A,B,C,D,E` 是合法顺序，`B,A,C,D,E` 也合法；A 和 B 之间无依赖，不必强行说答案唯一。

顶点的入度（In-degree）是指向它的边数。入度为 0 表示当前没有尚未完成的前置任务，可以开始。Kahn 算法把所有零入度顶点先入队，每次取出一个，移除它的出边；因这些前置关系已满足，对后继的入度减 1，减到 0 就入队。

## 逐步推演

### 建表并放入初始队列

初始入度为 `A:0, B:0, C:2, D:1, E:2`。按字母序扫描，队列从左到右是 `[A,B]`；输出为空 `[]`。队列中各点已经没有未处理的前驱。

### 取 A

输出 `[A]`；移除边 `A→C`，于是 C 的剩余入度由 2 变 1。队列成为 `[B]`，C 还不能入队，因为它仍依赖 B。

### 取 B

输出 `[A,B]`；移除 `B→C` 和 `B→E`，C 的剩余入度变 0，E 从 2 变 1。C 入队，队列为 `[C]`；E 还在等 D。

### 取 C 再取 D

取 C 后输出 `[A,B,C]`，D 从入度 1 变 0，队列 `[D]`。取 D 后输出 `[A,B,C,D]`，E 从 1 变 0，队列 `[E]`。

### 取 E 并检查数量

取 E 后输出 `[A,B,C,D,E]`，队列空；处理数 `5=V`，得到一个合法拓扑序。如果额外加边 `E→B`，则 B、C、D、E 形成环，初始只能处理 A，队列随后为空且处理数 `1<5`，无法给全部点排序。

## 为什么有环时不能完成

环上的每个点都有环中一个尚未完成的前驱，没人能先成为零入度；算法会停在处理数小于顶点数的位置。因此 Kahn 算法的结束判据必须是“输出长度等于 V”，不能只说“队列为空就是排序成功”。队列为空可能表示正常做完，也可能表示剩余图有环。

若只需要判定有无环，也可以使用 DFS 的递归路径状态；但本课的具体工具是入度队列。注意无向图普通边不代表先后关系，不能把无向图直接当依赖图做拓扑排序。

## 面试回答

拓扑排序在有向无环图中给出一个满足所有 `u→v` 都先 u 后 v 的顺序，不一定唯一。Kahn 算法计算各点入度，把零入度点入队；每次输出队首并对其出边的终点入度减 1，新出现的零入度点再入队。结束后若输出顶点数小于 `V`，剩余部分有环，不存在覆盖全部顶点的拓扑序。邻接表实现时间 `O(V+E)`、额外空间 `O(V+E)`，其中邻接表本身占 `O(V+E)`；若只计运行时辅助数组与队列则为 `O(V)`。

## 多语言示例

两段程序都按字母序准备初始零入度顶点，按邻接表给出的后继顺序处理；输入如上，预期输出 `A B C D E`。若检测到环则输出 `cycle`。

### C++

```cpp
#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::vector<std::vector<int>> graph{{2}, {2, 4}, {3}, {4}, {}};
    std::vector<int> indegree(graph.size(), 0), order;
    for (const auto& neighbors : graph) for (int v : neighbors) ++indegree[v];
    std::queue<int> ready;
    for (int v = 0; v < static_cast<int>(graph.size()); ++v)
        if (indegree[v] == 0) ready.push(v);
    while (!ready.empty()) {
        int u = ready.front(); ready.pop();
        order.push_back(u);
        for (int v : graph[u]) if (--indegree[v] == 0) ready.push(v);
    }
    if (order.size() != graph.size()) std::cout << "cycle\n";
    else {
        for (int v : order) std::cout << static_cast<char>('A' + v) << ' ';
        std::cout << '\n';
    }
}
```

### Python 3

```python
from collections import deque

graph = [[2], [2, 4], [3], [4], []]
indegree = [0] * len(graph)
for neighbors in graph:
    for v in neighbors:
        indegree[v] += 1
ready = deque(v for v, degree in enumerate(indegree) if degree == 0)
order = []
while ready:
    u = ready.popleft()
    order.append(u)
    for v in graph[u]:
        indegree[v] -= 1
        if indegree[v] == 0:
            ready.append(v)
print('cycle' if len(order) != len(graph) else ' '.join(chr(ord('A') + v) for v in order))
```

## 错误反例与追问

- **直接把任意一个顶点先排进去**：如果它有前驱，会违反边约束；必须从零入度顶点中选择。
- **输入有环时仍返回局部结果当完整答案**：额外 `E→B` 后输出只有 A，不能称为拓扑序。
- **误以为拓扑序一定唯一**：A 和 B 可交换；只有额外约束使每一步恰好一个可选点时才可能唯一。

## 选择题

在原依赖图里，处理完 A 但还没处理 B 时，C 能入队吗？

- A. 能，因为 A 已完成
- B. 不能，因为 C 的剩余入度是 1，还依赖 B
- C. 能，因为 C 是字母序第三个
- D. 不能，因为图中出现了环

**答案：B。** `A→C` 只满足 C 的一个前驱，`B→C` 仍未满足。字母序只决定多个可选点的入队顺序，不代替依赖条件。

## 参考资料

- [MIT 6.006：DFS 与 Topological Sort](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-14-depth-first-search-dfs-topological-sort/)
