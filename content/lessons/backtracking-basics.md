---
slug: "backtracking-basics"
title: "回溯入门：枚举不重复排列"
subject: "数据结构与算法"
description: "用 A、B、C 的全排列看清做选择、递归、撤销选择和必要的去重边界。"
order: 73
minutes: 20
lab: "workbench"
objectives: ["用 path 和 used 描述部分排列", "手算选择与撤销后的状态", "解释输出规模、重复值和剪枝的区别"]
prerequisites: ["recursion", "graph-dfs"]
---

# 回溯入门：枚举不重复排列

## 从三张不同的牌开始

给三张**不同**的牌 A、B、C，列出所有顺序：`ABC, ACB, BAC, BCA, CAB, CBA`。第一位有 3 种选择，第二位剩 2 种，第三位剩 1 种，共 `3!=6` 种。枚举时需要一条当前路径 `path`，以及每张牌是否已被当前路径使用的标记 `used`。

回溯（Backtracking）是在搜索树上做深度优先探索：**做选择 → 递归探索 → 撤销选择**。撤销不是删除已输出的完整结果，而是把共享的临时状态恢复到进入这一分支前，以便试下一个候选。这里选 A 时令 `path=[A]`、`used[A]=true`；当 A 开头的所有排列都处理完，才弹出 A 并设 `used[A]=false`。

## 逐步推演

### 选第一个 A

初始 `path=[]`、`used={}`；按 A、B、C 顺序试。选 A 后 `path=[A]`、`used={A}`；第二层不能再选 A，只能先选 B。

### 深入到 ABC

选 B 后 `path=[A,B]`、`used={A,B}`；再选 C 后 `path=[A,B,C]`，长度为 3，输出 `ABC`。这个完整路径只输出一次，随后要返回上层。

### 撤销 C、B，再试 C

先撤销 C，`path=[A,B]`、`used={A,B}`；B 分支无其他候选，再撤销 B，回到 `path=[A]`、`used={A}`。第二层改选 C、第三层选 B，输出 `ACB`。

### 撤销 A，展开 B

A 开头的两条路径已处理，撤销 C、A 后恢复 `path=[]`、`used={}`。接着选 B，按候选顺序得到 `BAC` 与 `BCA`。若漏掉撤销 A，B 分支会错误地认为 A 已用过。

### 展开 C 并结束

最后选 C 得到 `CAB` 与 `CBA`。返回根节点时状态再次是 `path=[]`、`used={}`；总输出 6 条。完整顺序为 `ABC,ACB,BAC,BCA,CAB,CBA`。

## 什么算剪枝

本例的 `used` 检查阻止同一张牌在一条路径里出现两次，是**可行性约束**。在更复杂问题中，还可以在某个部分状态已经不可能完成目标时提前停止该分支，这叫剪枝（Pruning）。例如 N 皇后中，若新皇后已与前面皇后同列或同斜线，就不必继续摆后面的行。不是所有回溯问题都必须有额外剪枝；剪枝也必须证明不会丢掉合法答案。

回溯与图 DFS 都可按“先深入、后回退”组织；区别在于这里搜索的是**选择构成的状态树**，回退时要撤销临时选择，不能把 `used` 当作对所有分支永久有效的全局访问集合。若把 A 在第一条路径用过后永久标记，剩下含 A 的排列都会丢失。

## 面试回答

回溯用递归遍历选择树；每层从未用候选中选一个，加入当前路径并标记，递归后恢复路径和标记，再试下一项。对 `n` 个互不相同元素的全排列，输出共有 `n!` 条，每条长度 `n`，枚举与输出至少需要 `Ω(n·n!)` 时间；这种逐项扫描候选的实现可用 `O(n·n!)` 时间，递归路径和标记的辅助空间 `O(n)`，若把全部结果留在内存中还要 `O(n·n!)` 输出空间。输入有重复值时仅按下标 `used` 会产生重复排列，需单独设计去重。

## 多语言示例

两段独立程序都按 A、B、C 候选顺序输出六行 `ABC`、`ACB`、`BAC`、`BCA`、`CAB`、`CBA`。输入假定三个字符互不相同。

### C++

```cpp
#include <iostream>
#include <string>
#include <vector>

void generate(const std::string& items, std::string& path, std::vector<bool>& used) {
    if (path.size() == items.size()) {
        std::cout << path << '\n';
        return;
    }
    for (std::size_t i = 0; i < items.size(); ++i) {
        if (used[i]) continue;
        used[i] = true;
        path.push_back(items[i]);
        generate(items, path, used);
        path.pop_back();
        used[i] = false;
    }
}

int main() {
    std::string items = "ABC", path;
    std::vector<bool> used(items.size(), false);
    generate(items, path, used);
}
```

### Python 3

```python
items = 'ABC'
used = [False] * len(items)
path = []

def generate():
    if len(path) == len(items):
        print(''.join(path))
        return
    for i, value in enumerate(items):
        if used[i]:
            continue
        used[i] = True
        path.append(value)
        generate()
        path.pop()
        used[i] = False

generate()
```

## 边界与反例

- 输入 `"AA"` 时两个下标不同，但两条生成路径显示的字符串同为 `AA`；“不同下标”不等于“不同结果”，需要排序后跳过同层重复选择或使用集合去重。
- 输入空序列在组合数学里通常有**一个空排列**；若产品需求不展示空字符串，应把显示规则与数学计数分开。
- 枚举所有排列的 `n!` 增长很快；不能把它误称为 `O(n²)`，也不能用“有剪枝”就保证一般情况变成多项式时间。
- 若只问“是否存在一个满足条件的排列”，找到一条解后可以提前返回；若要求全部结果，就必须继续探索其他分支。

## 选择题

在生成 `ABC` 并返回后，程序准备探索 `ACB`。从 `path=[A,B,C]` 回到 `path=[A]` 时，必须做什么？

- A. 只删掉输出列表里的 `ABC`
- B. 弹出 C 和 B，并把它们在当前路径中的 used 标记恢复为 false
- C. 永久保留 B、C 的 used 标记，以免重复输出
- D. 清空 A 的 used 标记但仍保留 `path=[A]`

**答案：B。** 返回上一层需要恢复共享临时状态。A 改错对象；C 会丢失后续排列；D 让路径和标记不一致。

## 参考资料

- [Princeton COS 226：Combinatorial Search 的排列与回溯](https://www.cs.princeton.edu/courses/archive/spring08/cos226/lectures/24CombinatorialSearch-2x2.pdf)
