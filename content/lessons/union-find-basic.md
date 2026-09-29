---
slug: "union-find-basic"
title: "并查集：合并与连通查询"
subject: "数据结构与算法"
description: "用父节点森林维护一组会逐步合并的集合，观察按规模合并和路径压缩。"
order: 71
minutes: 21
lab: "union-find"
objectives: ["解释 find、union 与同集合查询", "手算父节点变化和路径压缩", "正确表述摊还复杂度及不适用的删除操作"]
prerequisites: ["tree-traversal", "graph-bfs"]
---

# 并查集：合并与连通查询

## 维护“谁和谁是一组”

有 0 到 5 六个元素，初始各自独立。随着关系加入，例如“0 与 1 连通”“2 与 3 连通”，我们需要频繁回答“0 与 3 是否已在同一组”。并查集（Disjoint Set Union，DSU；也称 Union-Find）维护**互不重叠**的集合，支持查找代表元 `find(x)`、合并两个集合 `union(a,b)`，通过比较两个代表元判断是否同组。

每个元素有 `parent[x]`。根节点满足 `parent[root]=root`；其他元素沿父节点可到达唯一的根。不同根代表不同集合。这里的“连通”是通过持续**加边或合并**得到的关系，并查集本身不存路径顺序，不能直接给出从 0 到 3 的一条图路径。

## 用六个元素手算

实验采用“按规模合并”：把元素数较少的树挂到较多的树下；规模相等时，把第二个根挂到第一个根下。只有**根的 size** 有效。

| 操作 | 关键父节点变化 | 集合 |
| --- | --- | --- |
| 初始 | `parent[i]=i` | `{0},{1},{2},{3},{4},{5}` |
| `union(0,1)` | `parent[1]=0` | `{0,1},{2},{3},{4},{5}` |
| `union(2,3)` | `parent[3]=2` | `{0,1},{2,3},{4},{5}` |
| `union(0,2)` | 两树规模都为 2，`parent[2]=0` | `{0,1,2,3},{4},{5}` |
| `find(3)` | 路径原为 `3→2→0`，改 `parent[3]=0` | 集合成员**不变** |

最后 `find(3)` 返回 0，而 `find(4)` 返回 4，所以 3 与 4 仍不连通。再次 `union(1,3)` 时两者已经同根，不应再减少集合数量，也不应把规模加倍。

## 路径压缩不是合并

查找 3 的根时，经过 3、2、0；路径压缩（Path Compression）使沿途元素直接指向根。它加速以后查询，但没有引入新关系：3 与 2 本来就在同一集合。按规模合并（Union by Size）则限制树的高度；两者共同使用时，一串 `m` 次操作的摊还时间常写为 `O(m α(n))`，`α` 是增长极慢的反阿克曼函数。面试里可以说“实际使用中非常接近常数”，但不能严格说**每次操作最坏都是 O(1)**。

只用按规模合并、不用路径压缩也能保证树高 `O(log n)`：一个节点深度增加一次，它所在集合大小至少翻倍。两种优化的复杂度不能随意混写。

## 面试回答

并查集用父节点森林表示互不相交的集合，`find` 找代表元，`union` 先找两边的根，不同根才合并；两个元素代表元相同就连通。通常结合按规模或按秩合并与路径压缩，一系列操作的摊还复杂度为 `O(α(n))` 每次，空间 `O(n)`。它适合动态加入连接并查询连通，不直接支持删边后拆分集合，也不能直接还原具体路径。

## 多语言示例

两段程序都执行 `union(0,1)`、`union(2,3)`、`union(0,2)`；查询 0 与 3 为真，0 与 4 为假；随后 `find(3)` 压缩路径。预期输出 `true false`（Python 为 `True False`）。

### C++

```cpp
#include <iostream>
#include <numeric>
#include <utility>
#include <vector>

class DSU {
    std::vector<int> parent, size;
public:
    explicit DSU(int n) : parent(n), size(n, 1) { std::iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }
    void unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return;
        if (size[a] < size[b]) std::swap(a, b);
        parent[b] = a;
        size[a] += size[b];
    }
    bool connected(int a, int b) { return find(a) == find(b); }
};

int main() {
    DSU dsu(6);
    dsu.unite(0, 1); dsu.unite(2, 3); dsu.unite(0, 2);
    std::cout << std::boolalpha << dsu.connected(0, 3) << ' ' << dsu.connected(0, 4) << '\n';
    dsu.find(3);
}
```

### Python 3

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b:
            return False
        if self.size[a] < self.size[b]:
            a, b = b, a
        self.parent[b] = a
        self.size[a] += self.size[b]
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)

dsu = DSU(6)
dsu.union(0, 1)
dsu.union(2, 3)
dsu.union(0, 2)
print(dsu.connected(0, 3), dsu.connected(0, 4))  # True False
dsu.find(3)
```

这两段代码假设参数下标合法；实际接口若面对不可信输入，应先检查 `0≤x<n`。Python 的负下标会指向列表末尾，不能靠默认列表行为把 `-1` 当合法元素。

## 哪些题不能直接套

- **删边**：合并已把两组信息压成一组；普通 DSU 不知道删除后应拆成哪些集合。
- **求路径或最短路径**：父节点边是集合表示，不一定是原图中的边；应使用图搜索等算法。
- **带方向的依赖关系**：DSU 只维护“同组”这一对称关系，不能表达 `A` 必须在 `B` 之前。

## 选择题

执行表中的三次合并后，`parent[3]=2`、`parent[2]=0`。此时调用 `find(3)` 并做路径压缩，哪一项正确？

- A. 返回 2，集合数量从 3 变 2
- B. 返回 0，`parent[3]` 可改为 0，集合数量仍为 3
- C. 返回 0，必须把 3 从集合中删除
- D. 返回 3，因为父节点不是原图边

**答案：B。** 3 沿父链到根 0，压缩只改表示形式；三次有效合并把 6 组降为 3 组，查找不会继续减少组数。

## 参考资料

- [Princeton Algorithms：Union-Find 的 API 与复杂度](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/UF.html)
- [cp-algorithms：DSU 的按规模合并与路径压缩](https://cp-algorithms.com/data_structures/disjoint_set_union.html)
