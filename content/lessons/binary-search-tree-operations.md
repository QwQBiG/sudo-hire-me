---
slug: "binary-search-tree-operations"
title: "二叉搜索树的查找、插入与删除"
subject: "数据结构与算法"
description: "在一棵具体的搜索树上追踪比较路径与删除三种节点情况，理解复杂度为何依赖树高。"
order: 57
minutes: 24
lab: "workbench"
objectives: ["用左小右大不变量追踪查找与插入", "区分删除叶子、单孩子、双孩子", "解释普通 BST 退化与平衡树的不同"]
prerequisites: ["tree-traversal", "binary-search-boundary"]
---

# 二叉搜索树的查找、插入与删除

## 左边小，右边大

二叉搜索树（Binary Search Tree，BST）是满足顺序约束的二叉树：本课规定键**互不重复**，每个节点的**整个左子树**的键都小于它，整个右子树都大于它。不是只比较直接左右孩子。若允许重复键，必须事先约定“替换旧值、计数、或统一放一侧”，否则插入与查找行为不明确。

初始按 `8,4,12,2,6,10,14` 插入，得到：

```text
        8
      /   \
     4     12
    / \   /  \
   2   6 10  14
```

中序遍历（左子树→根→右子树）得到 `2,4,6,8,10,12,14`。**中序有序**是 BST 的结果，不是所有普通二叉树都自动有序。

## 逐步推演

### 查找 6

从根 8 比较：`6<8` 走左到 4；`6>4` 走右到 6，命中。若找 5，则走 `8→4→6→左侧空链接`，说明当前树里没有 5。每一步只排除一个子树，不扫描同层所有节点。

### 插入 5

沿查找 5 的相同路径 `8→4→6`；6 的左链接为空，把新节点 5 接在那里。插入后 4 的右子树里有 6 和 5，且 `4<5<6<8`，整个子树约束仍成立。

### 删除有两个孩子的 4

此时 4 的左孩子是 2，右孩子是 6（6 的左孩子为 5）。不能直接把 4 的某一个孩子抬上去而丢掉另一个。本课选**中序后继**：右子树中最小的键 5。把 4 位置的键（以及关联值，若有）改为 5，再从 6 的左侧删除原来的 5 节点。

### 检查新树

根 8 的左孩子现在是 5，5 的孩子为 2、6；右侧仍是 12、10、14。中序序列变为 `2,5,6,8,10,12,14`，正好少了原来的 4，没有两个 5。

### 对照另两种删除

在**原树**中，删叶子 2 只需把 `4.left` 设空。插入 5 后若**另作一次独立操作**删除 6，6 只有左孩子 5，可让 `4.right` 直接指向 5。三种删除情形不能在同一棵树的连续状态里随意混用；前两种是与删除 4 不同的假设分支。

## 为什么 O(log n) 不是无条件保证

查找、插入和删除都只沿一条从根向下的路径做常数次工作，或在双孩子删除时再沿右子树找后继，代价是 `O(h)`，`h` 为树高。树近似平衡时 `h=O(log n)`；按 `1,2,3,4,5` 依次插入**普通未平衡 BST**，会形成一直向右的链，`h=O(n)`。AVL 树、红黑树等平衡 BST 才提供自己的高度保证，不能把它们的复杂度直接记到普通 BST 上。

## 面试回答

BST 满足任一节点左子树键都小于该键、右子树键都大于该键。查找按比较结果走左或右；插入沿同一路径直到空链接；删除时分叶子、单孩子和双孩子，双孩子可用右子树最小节点作中序后继替换，再删除后继原节点。普通 BST 的这些操作代价为 `O(h)`，树退化时最坏 `O(n)`，不能无条件说 `O(log n)`；中序遍历会输出升序键。

## 多语言示例

两段程序都对唯一整数键执行“建初始树→查找 6→插入 5→删除 4”，预期依次得到 `true` 与中序 `2 5 6 8 10 12 14`。重复键直接忽略。实际保存键值对时，后继替换要一起处理对应的值。

### C++

```cpp
#include <iostream>
#include <initializer_list>

struct Node { int key; Node* left = nullptr; Node* right = nullptr; };

Node* insert(Node* root, int key) {
    if (!root) return new Node{key};
    if (key < root->key) root->left = insert(root->left, key);
    else if (key > root->key) root->right = insert(root->right, key);
    return root;
}
bool contains(Node* root, int key) {
    while (root) {
        if (key == root->key) return true;
        root = key < root->key ? root->left : root->right;
    }
    return false;
}
Node* erase(Node* root, int key) {
    if (!root) return nullptr;
    if (key < root->key) root->left = erase(root->left, key);
    else if (key > root->key) root->right = erase(root->right, key);
    else {
        if (!root->left) { Node* right = root->right; delete root; return right; }
        if (!root->right) { Node* left = root->left; delete root; return left; }
        Node* successor = root->right;
        while (successor->left) successor = successor->left;
        root->key = successor->key;
        root->right = erase(root->right, successor->key);
    }
    return root;
}
void printInorder(Node* root) {
    if (!root) return;
    printInorder(root->left);
    std::cout << root->key << ' ';
    printInorder(root->right);
}
void destroy(Node* root) {
    if (!root) return;
    destroy(root->left); destroy(root->right); delete root;
}
int main() {
    Node* root = nullptr;
    for (int key : {8, 4, 12, 2, 6, 10, 14}) root = insert(root, key);
    std::cout << std::boolalpha << contains(root, 6) << '\n';
    root = insert(root, 5);
    root = erase(root, 4);
    printInorder(root); std::cout << '\n';
    destroy(root);
}
```

### Python 3

```python
class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    elif key > root.key:
        root.right = insert(root.right, key)
    return root

def contains(root, key):
    while root is not None:
        if key == root.key:
            return True
        root = root.left if key < root.key else root.right
    return False

def erase(root, key):
    if root is None:
        return None
    if key < root.key:
        root.left = erase(root.left, key)
    elif key > root.key:
        root.right = erase(root.right, key)
    else:
        if root.left is None:
            return root.right
        if root.right is None:
            return root.left
        successor = root.right
        while successor.left is not None:
            successor = successor.left
        root.key = successor.key
        root.right = erase(root.right, successor.key)
    return root

def inorder(root):
    return inorder(root.left) + [root.key] + inorder(root.right) if root else []

root = None
for key in (8, 4, 12, 2, 6, 10, 14):
    root = insert(root, key)
print(contains(root, 6))  # True
root = erase(insert(root, 5), 4)
print(*inorder(root))  # 2 5 6 8 10 12 14
```

## 选择题

普通未平衡 BST 按 `1,2,3,4,5` 插入后，查找 5 的最坏路径长度属于哪种量级？

- A. `O(1)`，因为二叉树最多两个孩子
- B. `O(log n)`，所有 BST 自动平衡
- C. `O(n)`，树可能退化成单侧链
- D. `O(n²)`，因为每层都扫描全部节点

**答案：C。** 每次新键都比已有键大，会落在最右侧，使树高随节点数线性增长。A、B 忽略树高；D 误把沿一条路径查找当成逐层全扫。

## 参考资料

- [Princeton Algorithms：Binary Search Trees 的查找、删除与树高代价](https://algs4.cs.princeton.edu/32bst/)
