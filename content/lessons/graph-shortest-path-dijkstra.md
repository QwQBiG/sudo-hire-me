---
slug: "graph-shortest-path-dijkstra"
title: "Dijkstra：非负权图的最短路径"
subject: "数据结构与算法"
description: "逐轮选出暂定距离最小的节点，观察松弛如何把 A 到 E 的路径改得更短。"
order: 64
minutes: 24
lab: "dijkstra-path"
objectives: ["说明非负边权这一前提", "逐轮执行选点与松弛并还原路径", "区分线性扫描与优先队列实现的复杂度"]
prerequisites: ["graph-bfs", "heap-priority-queue"]
---

# Dijkstra：非负权图的最短路径

## 从 BFS 走到带权图

广度优先搜索（Breadth-First Search，BFS）在无权图或所有边权相同的图中，按边数求最短路。若边有不同的**非负**权重，仅按经过几条边就可能错：A→B 权重 4，A→C→B 权重 `1+2=3`，两条边反而更短。Dijkstra 算法求单源最短路径：从源点 A 出发，维护每个节点当前已知的最短候选距离 `dist`；每轮选**尚未定型、暂定距离最小**的节点，把它的距离定型，再检查出边能否改善别人的候选距离。这次改善叫松弛（Relaxation）。

实验的有向边是 `A→B(4), A→C(1), C→B(2), C→D(5), C→E(10), B→D(1), D→E(3)`，另有孤立节点 X。括号内为权重。起初 `dist[A]=0`，其他为 `∞`，前驱（Predecessor）均为空。

## 为什么能定型

选中暂定距离最小的未定型点 u 时，若有一条尚未发现的更短路径绕过其他未定型点再到 u，这段绕行必须增加**非负**权重，不可能让 u 的距离比当前所有未定型点的最小候选更小。因此 u 的当前候选就可定为最短距离。这个推理对负权边不成立。

定型 u 后，对出边 `u→v`、权重 w，比较 `dist[u]+w` 与 `dist[v]`。若前者更小，就更新 `dist[v]`，并记 `parent[v]=u`；若相等，本课保留原有前驱，所以相等最短路时只展示其中一条。不可达节点始终是 `∞`，不需要把它们当成有限距离定型。

| 定型节点 | 本轮有效松弛 | 本轮后已知距离 B / C / D / E |
| --- | --- | --- |
| A(0) | B←4，C←1 | 4 / 1 / ∞ / ∞ |
| C(1) | B←3，D←6，E←11 | 3 / 1 / 6 / 11 |
| B(3) | D←4 | 3 / 1 / 4 / 11 |
| D(4) | E←7 | 3 / 1 / 4 / 7 |
| E(7) | 无 | 3 / 1 / 4 / 7 |

每轮待选节点的最小值依次是 A、C、B、D、E。沿最终前驱从 E 回走：E←D←B←C←A，反转得到 `A→C→B→D→E`，总权重 `1+2+1+3=7`。X 始终不可达。

## 面试回答

Dijkstra 适用于**边权非负**的单源最短路径。初始化源点 0、其他无穷；反复取未定型且暂定距离最小的点，将其定型，再用它的出边松弛邻点并保存前驱。终点定型后可沿前驱还原路径；若所有剩余暂定距离都是无穷，则它们从源点不可达。邻接表加线性扫描选最小点需 `O(V²+E)` 时间、`O(V+E)` 存储；使用二叉堆与过期条目跳过策略时，通常写作 `O((V+E)log(V+E))` 时间，简单图中可化为 `O((V+E)log V)`，队列最坏可存 `O(E)` 条目。

## 负边权与实现边界

反例：`A→B(2), A→C(5), C→B(-4)`。按暂定距离先定型 B=2，随后才从 C 发现到 B 的真实距离 1；已定型标签不能这样被改正。所以不要把负权图交给标准 Dijkstra。若有可达负环，“最短距离”甚至可能没有有限下界；负边但无可达负环时可考虑 Bellman–Ford 等算法。

另一常见误区是把“找到终点的第一个候选距离”当作最终答案。本例 A 定型后可能尚无到 E 的候选，C 定型后先得到 E=11，D 定型才改为 7。只有终点被选为**当前全局最小未定型点并定型**时，才能提前结束并确认结果。

## 多语言示例

下面均使用小根堆（Min-Heap），把更新后的 `(距离, 节点)` 再压入队列；旧条目弹出时若距离不等于当前 `dist` 就跳过。对本课六个节点，输出 E 的距离 `7` 和路径 `A C B D E`；X 保持不可达。边权非负，固定宽度整数还需防止距离加法溢出。

### C++

```cpp
#include <algorithm>
#include <functional>
#include <iostream>
#include <limits>
#include <queue>
#include <utility>
#include <vector>

int main() {
    using Edge = std::pair<int, int>; // 终点、权重
    std::vector<std::vector<Edge>> graph(6);
    graph[0] = {{1,4},{2,1}}; // A
    graph[1] = {{3,1}};       // B
    graph[2] = {{1,2},{3,5},{4,10}}; // C
    graph[3] = {{4,3}};       // D；E 与 X 无出边
    const long long INF = std::numeric_limits<long long>::max() / 4;
    std::vector<long long> dist(6, INF);
    std::vector<int> parent(6, -1);
    using Entry = std::pair<long long, int>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;
    dist[0] = 0; pq.push({0, 0});
    while (!pq.empty()) {
        auto [distance, u] = pq.top(); pq.pop();
        if (distance != dist[u]) continue;
        for (auto [v, weight] : graph[u]) {
            if (distance + weight < dist[v]) {
                dist[v] = distance + weight;
                parent[v] = u;
                pq.push({dist[v], v});
            }
        }
    }
    std::vector<int> path;
    for (int v = 4; v != -1; v = parent[v]) path.push_back(v);
    std::reverse(path.begin(), path.end());
    std::cout << dist[4] << '\n';
    for (int v : path) std::cout << "ABCDEX"[v] << ' ';
    std::cout << '\n' << (dist[5] == INF ? "X unreachable" : "X reachable") << '\n';
}
```

### Python 3

```python
from heapq import heappop, heappush
from math import inf

graph = {
    'A': [('B', 4), ('C', 1)], 'B': [('D', 1)],
    'C': [('B', 2), ('D', 5), ('E', 10)], 'D': [('E', 3)],
    'E': [], 'X': [],
}
dist = {vertex: inf for vertex in graph}
parent = {vertex: None for vertex in graph}
dist['A'] = 0
queue = [(0, 'A')]
while queue:
    distance, u = heappop(queue)
    if distance != dist[u]:
        continue
    for v, weight in graph[u]:
        candidate = distance + weight
        if candidate < dist[v]:
            dist[v], parent[v] = candidate, u
            heappush(queue, (candidate, v))

path, vertex = [], 'E'
while vertex is not None:
    path.append(vertex)
    vertex = parent[vertex]
print(dist['E'], *reversed(path))  # 7 A C B D E
print('X unreachable' if dist['X'] == inf else 'X reachable')
```

代码为便于比较跑完全部可达节点；若只求 E，可以在 E 的有效最小堆条目弹出时停止。Python 的 `inf` 用作未到达标记，不能对它做有效路径加法；循环只处理有限距离的堆条目。

## 选择题

从 A 出发，先发现到 E 的候选距离 11，后来更新为 7。何时能把 E 的距离判为最终最短距离？

- A. 第一次把 E 放进优先队列时
- B. 只要 E 的前驱不是空时
- C. E 作为当前距离最小的未定型节点被取出时
- D. 一定要把不可达的 X 也定型后

**答案：C。** 候选距离可经后续松弛降低；非负权前提下，最小未定型节点被选中时才可定型。X 不可达，无需定型。

## 参考资料

- [cp-algorithms：Dijkstra 算法及非负边权前提](https://cp-algorithms.com/graph/dijkstra.html)
