---
slug: "binary-tree-level-order"
title: "二叉树按层遍历"
subject: "数据结构与算法"
description: "用队列分清每层的边界，解释为什么必须在处理当前层之前固定队列长度。"
order: 61
minutes: 18
lab: "workbench"
objectives: ["按左到右输出每一层节点", "用队列长度固定当前层边界", "分析空树、时间和最大队列空间"]
prerequisites: ["tree-traversal", "stack-queue", "graph-bfs"]
---

# 二叉树按层遍历

## 从“一个总序列”到“每层一组”

仍用前面树遍历课的二叉树，但本题不问前序、中序、后序；要求从上到下、每层从左到右返回分组：

```text
        A
       / \
      B   C
     / \   \
    D   E   F
```

正确输出是 `[[A],[B,C],[D,E,F]]`，不是仅把所有节点摊平成 `A,B,C,D,E,F`。层序遍历（Level-Order Traversal）使用先进先出队列（First In, First Out，FIFO）：先入队的节点先出队，处理父节点时再把它的左、右孩子依次入队。

**关键是冻结本层节点数。** 每轮外层循环开始时，队列中刚好是当前层所有尚待处理节点；先记 `count=queue.size`，只处理这 `count` 个。处理时入队的孩子属于**下一层**，不能在同一轮里继续处理。

## 逐步推演

### 根节点入队

初始队列 `[A]`，外层循环冻结 `count=1`，当前层结果 `[]`。空树则不入队，直接返回空列表 `[]`，不会产生一个空层 `[[]]`。

### 处理第一层 A

取 A，当前层收集 `[A]`；先把左孩子 B、再把右孩子 C 入队，队列变 `[B,C]`。本轮冻结数为 1，虽然队列还有两项，本层已经处理完，输出第一组 `[A]`。

### 处理第二层 B 和 C

新一轮冻结 `count=2`。取 B，收集 `[B]`，把 D、E 入队，队列从 `[C]` 变 `[C,D,E]`。再取 C，收集 `[B,C]`，把 F 入队，队列变 `[D,E,F]`。本轮仅取了原先的两项，所以第二组是 `[B,C]`。

### 处理第三层并结束

冻结 `count=3`，依次取 D、E、F；它们没有孩子，第三组 `[D,E,F]`，队列为空。输出 `[[A],[B,C],[D,E,F]]`。

## 面试回答

二叉树层序遍历用队列保存待处理节点。每轮开始先记录当前队列长度，恰好取这么多个节点组成一层，并按左、右顺序将孩子入队；新增孩子留到下一轮。每个节点入队和出队各一次，时间 `O(n)`；队列最多容纳一层附近的节点，空间 `O(w)`，其中 `w` 为最大层宽，最坏可到 `O(n)`。若把输出结果也计入，另需 `O(n)` 空间。空树返回空层列表。

## 多语言示例

两段程序都构造上图并输出三层 `A / B C / D E F`。示例树无共享子节点和环；若把同一代码用于一般图，需要额外的已访问集合。

### C++

```cpp
#include <iostream>
#include <queue>
#include <vector>

struct Node { char value; Node* left = nullptr; Node* right = nullptr; };

std::vector<std::vector<char>> levels(Node* root) {
    std::vector<std::vector<char>> result;
    if (root == nullptr) return result;
    std::queue<Node*> ready;
    ready.push(root);
    while (!ready.empty()) {
        int count = static_cast<int>(ready.size());
        std::vector<char> level;
        for (int i = 0; i < count; ++i) {
            Node* node = ready.front(); ready.pop();
            level.push_back(node->value);
            if (node->left) ready.push(node->left);
            if (node->right) ready.push(node->right);
        }
        result.push_back(level);
    }
    return result;
}

int main() {
    Node a{'A'}, b{'B'}, c{'C'}, d{'D'}, e{'E'}, f{'F'};
    a.left=&b; a.right=&c; b.left=&d; b.right=&e; c.right=&f;
    for (const auto& level : levels(&a)) {
        for (char value : level) std::cout << value << ' ';
        std::cout << '\n';
    }
}
```

### Python 3

```python
from collections import deque

class Node:
    def __init__(self, value, left=None, right=None):
        self.value, self.left, self.right = value, left, right

def levels(root):
    if root is None:
        return []
    ready = deque([root])
    result = []
    while ready:
        count = len(ready)
        level = []
        for _ in range(count):
            node = ready.popleft()
            level.append(node.value)
            if node.left is not None:
                ready.append(node.left)
            if node.right is not None:
                ready.append(node.right)
        result.append(level)
    return result

root = Node('A', Node('B', Node('D'), Node('E')), Node('C', None, Node('F')))
print(levels(root))  # [['A'], ['B', 'C'], ['D', 'E', 'F']]
```

## 错误反例

若在处理 A 的那轮写成“只要队列不空就继续取”，B、C 刚入队便会被取走，又把 D、E、F 加进来，最后所有节点混成一层。若改用栈，后入的右孩子可能先于左孩子处理，也不符合题目的从左到右。

## 选择题

处理第二层 `[B,C]` 时，取出 B 后队列是 `[C,D,E]`。下一步应怎样做？

- A. 只取 C，完成第二层；D、E 等下一轮
- B. 把 D、E 也都取出，因为它们已在队列里
- C. 先取 E，因为它最后入队
- D. 立即返回，不处理 C

**答案：A。** 本层开始时队列长度为 2，所以本轮只处理 B、C。新增的 D、E 与稍后加入的 F 属于第三层。

## 参考资料

- [LeetCode 102：Binary Tree Level Order Traversal 的按层输出与队列提示](https://leetcode.com/problems/binary-tree-level-order-traversal/description/)
