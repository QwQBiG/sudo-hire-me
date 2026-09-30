---
slug: "graph-dfs"
title: "图的深度优先搜索"
subject: "数据结构与算法"
description: "在有环和孤立点的无向图中手算 DFS 的访问与回退，区分可达性和最短路径。"
order: 62
minutes: 20
lab: "workbench"
objectives: ["写出有环图的 DFS 访问顺序", "解释已访问标记和递归回退", "区分 DFS 可达性与 BFS 最短边数"]
prerequisites: ["graph-bfs", "recursion"]
---

# 图的深度优先搜索

## 一直走到走不动，再回头

深度优先搜索（Depth-First Search，DFS）从一个顶点出发，沿尚未访问的邻点继续深入；当前顶点再无未访问邻点时，退回上一个顶点，继续检查其余邻点。可以用递归调用栈或显式栈实现。它常用于判断可达性、枚举连通分量、寻找环及构造拓扑序的部分算法；这些应用还有各自的条件与记录方式。

仍用无向图，邻点始终按表中从左到右检查。`X` 是孤立点。顺序固定只是为了便于手算；换邻接表顺序会改变 DFS 遍历序列，却不会改变“可达或不可达”的事实。

| 点 | 邻点顺序 |
| --- | --- |
| A | B、C |
| B | A、D、E |
| C | A、E |
| D | B、F |
| E | B、C、F |
| F | D、E |
| X | 无 |

## 访问与回退的区别

从 A 起步，**进入顶点时立即标记已访问**，然后逐个检查邻点。这样遇到环 `A-B-E-C-A` 时，不会再进入已经访问过的 A。递归函数返回表示“这个顶点的邻点都检查完了”，不意味着它刚刚才被访问。

按上述顺序首次访问为 `A → B → D → F → E → C`；递归完成并返回的顺序为 `C → E → F → D → B → A`。从 A 只覆盖这个连通部分，不会访问 X；若题目要求遍历整张图，还要按顶点顺序对每个**尚未访问**的顶点再启动一次 DFS，最后会单独处理 X。

## 逐步推演

### 进入 A、B、D

调用路径依次是 `A → B → D`，已访问集合 `{A,B,D}`。B 检查到邻点 A 时跳过；D 检查到 B 时也跳过。此时三个函数都还在栈上，尚未返回。

### 从 D 沿 F 到 E

D 的下一邻点是 F，F 的下一未访问邻点是 E。调用路径变成 `A → B → D → F → E`；已访问 `{A,B,D,F,E}`。E 的邻点 B 已访问，接着将进入 C。

### C 没有新邻点

C 的邻点 A、E 均已访问，于是 C 返回给 E。此时首次访问序列是 `A,B,D,F,E,C`，调用路径缩回 `A → B → D → F → E`；这一步“返回”不应在访问序列里再写一次 C。

### 一层层回退

E 的剩余邻点 F 已访问，E 返回；F 返回；D 返回。B 的剩余邻点 E 已访问，B 返回；A 的剩余邻点 C 已访问，A 返回。返回序列因此是 `C,E,F,D,B,A`，递归栈清空。

### 补上不连通的 X

如果题目要求**整图遍历**，外层扫描顶点时发现 X 尚未访问，再从 X 单独调用 DFS。X 没有邻点，立刻返回。整图的首次访问序列可写为 `A,B,D,F,E,C | X`，竖线表示另一个连通分量。

## 面试回答

DFS 用递归或显式栈沿未访问邻点深入，在进入顶点时标记已访问，走不动再回退；已访问集合阻止环中的重复访问。邻接表表示下，从一个起点遍历其可达部分或加外层循环遍历整图，时间 `O(V+E)`、已访问与调用栈的额外空间 `O(V)`。DFS 能回答是否可达，但普通 DFS 首次找到的路径不保证无权图的最短边数；需要无权最短路径时通常用 BFS。

## 为什么这条 DFS 路径不是最短

如果在第一次进入 C 时，用递归父节点回溯，得到 `A-B-D-F-E-C`，共有 5 条边；图里明明还有直连 `A-C`，只需 1 条边。DFS 偏向先深入 B 分支，并不按距离层级搜索。这是面试中“DFS 能否求最短路径”的直接反例，而不只是记住一个结论。

## 多语言示例

两段独立程序都按邻点表顺序遍历**整张无向图**，预期输出 `A B D F E C X`。`seen` 在递归进入时设置，而不是返回时设置。

### C++

```cpp
#include <iostream>
#include <string>
#include <vector>

void dfs(int u, const std::vector<std::vector<int>>& graph, std::vector<bool>& seen) {
    seen[u] = true;
    const std::string labels = "ABCDEFX";
    std::cout << labels[u] << ' ';
    for (int v : graph[u]) if (!seen[v]) dfs(v, graph, seen);
}

int main() {
    std::vector<std::vector<int>> graph{
        {1, 2}, {0, 3, 4}, {0, 4}, {1, 5}, {1, 2, 5}, {3, 4}, {}
    };
    std::vector<bool> seen(graph.size(), false);
    for (int u = 0; u < static_cast<int>(graph.size()); ++u)
        if (!seen[u]) dfs(u, graph, seen);
    std::cout << '\n';
}
```

### Python 3

```python
graph = [[1, 2], [0, 3, 4], [0, 4], [1, 5], [1, 2, 5], [3, 4], []]
labels = 'ABCDEFX'
seen = [False] * len(graph)
order = []

def dfs(u):
    seen[u] = True
    order.append(labels[u])
    for v in graph[u]:
        if not seen[v]:
            dfs(v)

for u in range(len(graph)):
    if not seen[u]:
        dfs(u)
print(' '.join(order))  # A B D F E C X
```

递归实现最坏可能深入 `V` 层；在 Python 等有递归深度限制的运行环境，大图宜改成显式栈。改写时需注意“压栈顺序”可能让访问次序与递归版相反。

## 常见误区

- **“找到目标就是最短路径。”** C 的 5 边 DFS 父链与 1 边直连构成反例。
- **“从 A 跑完就是整图遍历。”** X 不与 A 连通，需要外层循环。
- **“函数返回时才标记访问。”** 环会在标记前把同一顶点反复压入调用栈。
- **“有一个 visited 就足以判断所有有向图里的环。”** 有向环检测通常还需区分“正在递归路径上”和“已完成”的状态；单一 visited 不足以区分两类边。

## 选择题

在本课固定的邻点顺序下，从 A 运行 DFS，下面哪一个是**首次访问序列**？

- A. `A,B,C,D,E,F,X`
- B. `A,B,D,F,E,C`
- C. `C,E,F,D,B,A`
- D. `A,C,E,F,D,B`

**答案：B。** A 近似 BFS 分层顺序且错误包含 X；C 是回退顺序；D 改成先检查 C，与本课邻点顺序不符。

## 参考资料

- [MIT 6.006：Depth-First Search 与 Topological Sort](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-14-depth-first-search-dfs-topological-sort/)
