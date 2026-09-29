---
slug: "graph-bfs"
title: "图的广度优先搜索"
subject: "数据结构与算法"
description: "在有环、可重复到达且存在孤立点的图里，追踪队列、已发现集合和最短边数。"
order: 60
minutes: 20
lab: "graph-bfs"
objectives: ["用邻接表表示一个无向图", "逐轮推导 BFS 的队列与已发现集合", "判断可达性并解释无权最短路径"]
prerequisites: ["stack-queue", "tree-traversal", "complexity"]
---

# 图的广度优先搜索

## 从树走到图

图（Graph）由顶点（Vertex）和边（Edge）组成。树也是一种特殊的图；一般图却可以有环，可以从不同路径到达同一顶点，也可以有与起点不连通的部分。遍历图时仅靠“沿孩子继续走”不够，还得记住哪些顶点已经发现。

本课使用**无向、无权**图：每条边可双向通过，经过一条边的代价都算 1。相邻顶点的顺序固定按下面的邻接表（Adjacency List）从左到右；换一种邻接顺序可能得到不同的同层访问次序，但不改变最短距离。

| 顶点 | 邻点（按检查顺序） |
| --- | --- |
| A | B、C |
| B | A、D、E |
| C | A、E |
| D | B、F |
| E | B、C、F |
| F | D、E |
| X | 无 |

这里有环 `A → B → E → C → A`，也有从 A 到 E 的两条等长路线；X 是孤立点。只从 A 出发，不应该声称“遍历完成就访问了图中每个顶点”。

## 为什么是队列

广度优先搜索（Breadth-First Search，BFS）使用先进先出队列（First In, First Out，FIFO）。先发现的顶点先出队，距离起点 1 条边的顶点，会先于距离 2 条边的顶点处理。

每个顶点在**入队时**就加入已发现集合（Visited Set）。这样 B 和 C 都遇到 E 时，E 只会入队一次。若等到出队才标记，重复到达的顶点可能在队列里出现多次；在有环图中若不检查是否已发现，还可能沿环不断重复。

本课把“发现”定义为第一次入队，把“处理”定义为从队首取出并检查邻点。一个顶点可以已经发现、尚未处理，例如第一轮后的 B、C。

## 从 A 开始逐轮手算

初始：标记 A，队列为 `[A]`，A 到自己的距离为 0。每轮只从队首取一个顶点；新邻点入队时记录它的前驱和距离。

| 轮次 | 本轮出队 | 新发现并入队 | 本轮结束的队列 | 已发现集合 |
| --- | --- | --- | --- | --- |
| 初始 | — | A | `[A]` | A |
| 1 | A | B、C | `[B,C]` | A、B、C |
| 2 | B | D、E | `[C,D,E]` | A、B、C、D、E |
| 3 | C | 无；E 已发现 | `[D,E]` | A、B、C、D、E |
| 4 | D | F | `[E,F]` | A、B、C、D、E、F |
| 5 | E | 无；F 已发现 | `[F]` | A、B、C、D、E、F |
| 6 | F | 无 | `[]` | A、B、C、D、E、F |

发现 E 时，它的前驱记为 B、距离记为 2；以后 C 再遇到 E，不会覆盖第一次记录。发现 F 时，它的前驱是 D、距离是 3。沿前驱反向追溯再翻转，得到 `A → B → D → F`，经过 3 条边。

也有等长路线 `A → C → E → F`；当前结果由固定的邻点检查顺序决定。X 始终没有被发现，因此**从 A 不可达 X**。若把起点改成 X，队列只处理 X 一次，A 至 F 都不可达。

## 最短的是边数，不是任意权重

所有边代价都为 1 时，队列保证先处理距离小的层。一个顶点第一次被发现时，当前顶点已有最短边数，再加 1 就是该邻点的最短边数；后来路径不可能更短，因此无需再次入队。这个结论也适用于所有边权相同且为正的情形，路径距离需按边权换算。

若边权不同，层数不等于权重和。例如 A 到 B 的直连边权为 10，A 经 C 到 B 的两条边各为 1；BFS 按边数会优先给出直连，权重和却更大。非负但不相等的边权通常考虑 Dijkstra 算法；不能把本课的结论直接移过去。

## 面试回答

BFS 用队列按离起点的边数逐层探索，并在顶点第一次入队时标记已发现，避免环和多条路径造成重复入队。邻接表配合常数期望时间的已发现集合时，完整遍历起点可达部分的时间是 `O(V + E)`，额外空间为 `O(V)`；在无权图中，首次发现得到最短边数，前驱可还原一条最短路径。只从一个起点运行时，不会自动覆盖不连通的顶点；不同权边的最小权重路径也不能直接用普通 BFS 求。

## 用流程对照队列与前驱

输入须是有限图的邻接表，表里每个邻点也应有自己的条目。下面的流程会遍历起点可达的全部顶点；若任务只需找目标，也可以在首次发现目标时提前停止。目标不可达与目标顶点根本不在图中是两种不同情况，接口应区分。

```text
标记起点已发现，距离为 0，前驱为空，并让起点入队
当队列不空：
    从队首取出顶点 u
    按邻接表顺序检查 u 的每个邻点 v：
        若 v 已发现，跳过
        否则标记 v 已发现，记录 parent[v]=u、distance[v]=distance[u]+1，再入队
若目标未发现，返回“不可达”
否则沿 parent 从目标回到起点，再翻转得到路径
```

“先标记，后入队”是一组不可拆开的操作。前驱只在首次发现时记录，所以本课邻接顺序下 F 的前驱是 D，结果路径为 `A → B → D → F`。

## 多语言示例

两段代码都使用上面的邻接顺序，分别输出从 A 到 F 的一条最短边数路径 `A B D F (3 edges)`，以及从 A 到 X 的 `unreachable`。它们完成可达部分的遍历后再判断目标，便于与实验的完整队列过程对照。

### C++

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <map>
#include <queue>
#include <set>
#include <stdexcept>
#include <vector>

using Graph = std::map<char, std::vector<char>>;

std::vector<char> bfsPath(const Graph& graph, char start, char target) {
    if (!graph.count(start) || !graph.count(target)) {
        throw std::invalid_argument("unknown vertex");
    }
    std::queue<char> queue;
    std::set<char> seen{start};
    std::map<char, char> parent;
    queue.push(start);
    while (!queue.empty()) {
        char current = queue.front();
        queue.pop();
        for (char next : graph.at(current)) {
            if (!seen.insert(next).second) continue;
            parent[next] = current;
            queue.push(next);
        }
    }
    if (!seen.count(target)) return {};
    std::vector<char> path;
    for (char node = target;; node = parent.at(node)) {
        path.push_back(node);
        if (node == start) break;
    }
    std::reverse(path.begin(), path.end());
    return path;
}

void show(const Graph& graph, char target) {
    auto path = bfsPath(graph, 'A', target);
    if (path.empty()) { std::cout << "unreachable\n"; return; }
    for (std::size_t i = 0; i < path.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << path[i];
    }
    std::cout << " (" << path.size() - 1 << " edges)\n";
}

int main() {
    const Graph graph{
        {'A', {'B', 'C'}}, {'B', {'A', 'D', 'E'}}, {'C', {'A', 'E'}},
        {'D', {'B', 'F'}}, {'E', {'B', 'C', 'F'}}, {'F', {'D', 'E'}}, {'X', {}}
    };
    show(graph, 'F');
    show(graph, 'X');
}
```

`std::queue` 提供真正的队首出队；`std::set` 保证已发现顶点不重复。本例还使用 `std::map` 保存邻接表和前驱，映射、集合操作单次可为 `O(log V)`，因此这段具体 C++ 代码的时间上界可写为 `O((V+E) log V)`。若邻接表、集合和前驱改用平均常数时间的哈希容器，才得到通常讲的 `O(V+E)` 期望时间。

### Python 3

```python
from collections import deque


def bfs_path(graph, start, target):
    if start not in graph or target not in graph:
        raise ValueError("unknown vertex")
    queue = deque([start])
    seen = {start}
    parent = {start: None}
    while queue:
        current = queue.popleft()
        for next_vertex in graph[current]:
            if next_vertex in seen:
                continue
            seen.add(next_vertex)
            parent[next_vertex] = current
            queue.append(next_vertex)
    if target not in seen:
        return None
    path = []
    node = target
    while node is not None:
        path.append(node)
        node = parent[node]
    path.reverse()
    return path


graph = {
    "A": ["B", "C"], "B": ["A", "D", "E"], "C": ["A", "E"],
    "D": ["B", "F"], "E": ["B", "C", "F"], "F": ["D", "E"], "X": []
}
for target in ("F", "X"):
    path = bfs_path(graph, "A", target)
    if path is None:
        print("unreachable")
    else:
        print(" ".join(path), f"({len(path) - 1} edges)")
```

Python 的 `deque.popleft()` 是队首出队，`set` 用来在入队前去重。按哈希集合平均常数时间操作分析，这个版本完成单源遍历的期望时间为 `O(V+E)`。

## 复杂度从哪里来

设 `V` 为顶点数、`E` 为边数，使用邻接表和平均常数时间的集合查找。每个可达顶点至多入队、出队一次，每条无向边最多从两个端点各检查一次，因此完整单源遍历的时间上界为 `O(V + E)`，存放队列、集合、距离和前驱的额外空间为 `O(V)`。对不连通图，从某一起点实际只扫描可达部分，但通常仍用整个图的 `V`、`E` 表达上界。

如果改用邻接矩阵并逐行寻找邻点，扫描成本会不同。若用普通连续数组反复删除首项，后续元素搬移也可能让实际成本高于抽象队列模型；上面代码分别采用队列和双端队列。网站演示为了保存每一步画面会复制少量状态，不能把演示器的开销当作通用 BFS 的复杂度。

## 常见误区

- **“出队后才把顶点标记为已发现。”** 如果 B、C 都指向 E，E 可能重复入队。入队时标记能直接保证每个顶点最多进队一次。
- **“访问顺序只有一种。”** 同一层的次序随邻接表顺序改变；最短边数不变。
- **“队列空了说明整张图都访问过。”** 从 A 出发时，孤立点 X 不会出现。
- **“BFS 是所有图上的最短路径算法。”** 本课结论是无权图的最少边数，不是不同权重的最小权重和。
- **“发现目标前必须把队列全部处理完。”** 为了找一条最短边数路径，第一次发现目标即可停；为了解释整个可达部分，本课演示继续运行。

## 选择题

按本课邻接表顺序，从 A 开始，处理完 B 后，队列和已发现集合分别是什么？

- A. 队列 `[C,D,E]`；已发现 A、B、C、D、E
- B. 队列 `[A,C,D,E]`；已发现 A、B、C、D、E
- C. 队列 `[C,D,D,E]`；已发现 A、B、C、D、E
- D. 队列 `[D,E]`；已发现 A、B、D、E

**答案：A。** A 已经出队，B 出队后把尚未发现的 D、E 接到 C 后面。B 的邻点 A 已发现，不再入队；C 尚未处理但仍在队首。B 把已出队的 A 又放回队列；C 重复入队 D；D 漏了先前从 A 发现的 C。

## 面试追问

**怎样遍历整张可能不连通的图？**

对每个顶点检查是否已发现，尚未发现就以它为新起点启动一次 BFS。各次搜索共用已发现集合，所有顶点和边总共仍只按常数次数处理。在本例中，从 A 处理完可达部分后，X 会作为另一个起点启动搜索。

## 参考资料

- [MIT OpenCourseWare：BFS、图表示与图搜索](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-13-breadth-first-search-bfs/)
- [MIT 6.006：BFS 课堂讲义](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/196a95604877d326c6586e60477b59d4_MIT6_006S20_lec9.pdf)
