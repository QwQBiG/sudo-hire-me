---
slug: "dynamic-programming-knapsack"
title: "0/1 背包：每件只选一次"
subject: "数据结构与算法"
description: "用三件物品和容量五填完整张状态表，理解不选与选的来源为何都在上一行。"
order: 75
minutes: 24
lab: "knapsack-grid"
objectives: ["定义前 i 件物品与容量 w 的状态", "填出 0/1 背包表并还原所选物品", "解释容量倒序压缩与伪多项式复杂度"]
prerequisites: ["dynamic-programming-intro", "array-linked-list"]
---

# 0/1 背包：每件只选一次

## 先把“最多值”说准确

有背包容量 `W=5`，三件物品只能各选 0 次或 1 次：A 重 2、价值 3；B 重 3、价值 4；C 重 4、价值 5。总重量不超过 5，问最大总价值。选择 A+B，重 `2+3=5`、值 `3+4=7`；只选 C 值 5，因此答案为 7。

0/1 背包（0/1 Knapsack）中的“0/1”指**每件物品不可重复选**。这与完全背包允许同一件物品重复拿不同。不要只背一个转移式，先定义状态：`dp[i][w]` 表示只考虑前 `i` 件物品、容量上限为 `w` 时的**最大价值**。容量是上限，不要求恰好装满。

## 只看上一行的两种选择

对第 i 件物品，重量 `weight_i`、价值 `value_i`：

- **不选**：答案是上一行同容量 `dp[i-1][w]`。
- **选**：仅当 `w≥weight_i`，答案候选是 `value_i+dp[i-1][w-weight_i]`。

两种都引用 `i-1` 行，保证同一件物品在这一轮只使用一次。若重量超过容量，只能不选。初始 `dp[0][w]=0`（没有物品时价值为 0），`dp[i][0]=0`（本课所有重量均为正）。

| 已考虑物品 / 容量 | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 无 | 0 | 0 | 0 | 0 | 0 | 0 |
| A | 0 | 0 | 3 | 3 | 3 | 3 |
| A、B | 0 | 0 | 3 | 4 | 4 | 7 |
| A、B、C | 0 | 0 | 3 | 4 | 5 | 7 |

例如 `dp[2][5]=max(dp[1][5]=3, 4+dp[1][2]=7)=7`；`dp[3][5]=max(dp[2][5]=7, 5+dp[2][1]=5)=7`，所以容量 5 时 C 不提高答案。实验逐格填写、点选已算格子可看到它依赖的上一行值。

## 从右下角还原选择

从 `dp[3][5]=7` 逆推：它等于 `dp[2][5]=7`，按本课平局优先“不选”的规则跳过 C。`dp[2][5]=7` 不等于 `dp[1][5]=3`，因此选 B，剩余容量 `5-3=2`。`dp[1][2]=3` 不等于 `dp[0][2]=0`，选 A，剩余容量 0。反向整理得到 A+B。若有多个最优组合，这种比较法只还原其中一个。

## 面试回答

0/1 背包把 `dp[i][w]` 定义为前 i 件、容量上限 w 的最大价值。第 i 件不能选时沿用 `dp[i-1][w]`；能选时取“不选”与“价值加上上一行剩余容量答案”的较大值。初始第 0 行为 0，填表时间 `O(nW)`、空间 `O(nW)`；只求价值可压成 `O(W)`，但容量必须从大到小更新，以免一件物品在同一轮被重复使用。`O(nW)` 对数值 W 是多项式，但若 W 以二进制输入，不能无条件称为输入位长的多项式时间，属于伪多项式复杂度。

## 一维压缩为什么要倒序

假设只有一件 A（重 2、值 3），容量 4，且一维表 `f` 初始全 0。若从小到大更新，先得到 `f[2]=3`，接着算 `f[4]=max(0,3+f[2])=6`，把同一件 A 选了两次，已变成完全背包式行为。倒序从 4 到 2 时，计算 `f[4]` 仍看见**本轮之前**的 `f[2]=0`，不会重复拿 A。若还要像本课那样直接展示完整表和简单回溯，保留二维表更合适。

## 多语言示例

两段程序都填二维表并按“平局不选”回溯，输入 A(2,3)、B(3,4)、C(4,5)、容量 5，预期输出最大价值 `7` 与选择 `A B`。重量均为正、价值非负、容量为非负整数。

### C++

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

struct Item { char name; int weight, value; };

int main() {
    std::vector<Item> items{{'A',2,3},{'B',3,4},{'C',4,5}};
    const int W = 5, n = static_cast<int>(items.size());
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(W + 1, 0));
    for (int i = 1; i <= n; ++i) {
        const Item& item = items[i - 1];
        for (int w = 0; w <= W; ++w) {
            dp[i][w] = dp[i - 1][w];
            if (w >= item.weight)
                dp[i][w] = std::max(dp[i][w], item.value + dp[i - 1][w - item.weight]);
        }
    }
    std::vector<char> chosen;
    for (int i = n, w = W; i > 0; --i) {
        if (dp[i][w] != dp[i - 1][w]) {
            chosen.push_back(items[i - 1].name);
            w -= items[i - 1].weight;
        }
    }
    std::reverse(chosen.begin(), chosen.end());
    std::cout << dp[n][W] << '\n';
    for (char name : chosen) std::cout << name << ' ';
    std::cout << '\n';
}
```

### Python 3

```python
items = [('A', 2, 3), ('B', 3, 4), ('C', 4, 5)]
capacity = 5
dp = [[0] * (capacity + 1) for _ in range(len(items) + 1)]
for i, (_, weight, value) in enumerate(items, start=1):
    for w in range(capacity + 1):
        dp[i][w] = dp[i - 1][w]
        if w >= weight:
            dp[i][w] = max(dp[i][w], value + dp[i - 1][w - weight])

chosen = []
w = capacity
for i in range(len(items), 0, -1):
    if dp[i][w] != dp[i - 1][w]:
        name, weight, _ = items[i - 1]
        chosen.append(name)
        w -= weight
chosen.reverse()
print(dp[-1][capacity], *chosen)  # 7 A B
```

固定宽度整数语言还需确认价值之和不会溢出。若题目允许零重量且正价值，`dp[i][0]=0` 不再正确；本课输入明确规定重量为正。

## 选择题

只有一件 A（重 2、值 3）且容量 4，用一维表从小到大更新后算出 `f[4]=6`。错误原因是什么？

- A. 容量 4 不足以放 A
- B. 同一轮的新 `f[2]=3` 被再次用于 `f[4]`，重复选择 A
- C. 0/1 背包要求每件必须选一次
- D. A 的价值应该等于重量

**答案：B。** 0/1 背包每件至多一次；倒序容量更新才能让本轮引用保持为上一轮状态。A、C、D 都与题意不符。

## 参考资料

- [cp-algorithms：0/1 Knapsack 的二维状态和一维倒序更新](https://cp-algorithms.com/dynamic_programming/knapsack.html)
