---
slug: "dynamic-programming-lcs"
title: "最长公共子序列：相同不等于连续"
subject: "数据结构与算法"
description: "从两串前缀的状态表找出公共子序列，并看懂并列最优时答案为何不唯一。"
order: 76
minutes: 22
lab: "workbench"
objectives: ["区分子序列和子串", "填出 LCS 状态表并回溯一个答案", "说明时间空间复杂度和并列最优"]
prerequisites: ["dynamic-programming-intro", "array-linked-list"]
---

# 最长公共子序列：相同不等于连续

## 先辨认问题

给定 `X=ABC`、`Y=ACB`，最长公共子序列（Longest Common Subsequence，LCS）的长度是 2。`AB` 同时出现在两串里：在 X 中占第 1、2 位，在 Y 中占第 1、3 位。`AC` 也可以，因此**答案可能不唯一**。子序列只要求相对顺序不变，可以跳过字符；子串（Substring）要求字符连续。`BC` 不是这两串的公共子序列，因为 Y 中 B 在 C 后面。

定义 `dp[i][j]` 为 `X` 的前 `i` 个字符与 `Y` 的前 `j` 个字符的 LCS **长度**。空前缀没有公共字符，所以 `dp[0][j]=dp[i][0]=0`。每格只问两串的**末尾字符**是否相等：

- 若 `X[i-1] == Y[j-1]`，可以把这个字符接在两个更短前缀的最优解之后：`dp[i][j]=dp[i-1][j-1]+1`。
- 否则两个末尾不能同时贡献给同一个公共子序列，至少舍弃一个：`dp[i][j]=max(dp[i-1][j],dp[i][j-1])`。

| X 前缀 / Y 前缀 | 空 | A | AC | ACB |
| --- | ---: | ---: | ---: | ---: |
| 空 | 0 | 0 | 0 | 0 |
| A | 0 | 1 | 1 | 1 |
| AB | 0 | 1 | 1 | 2 |
| ABC | 0 | 1 | 2 | 2 |

## 逐步推演

### 第一行：X 只取 A

`dp[1][1]=1+dp[0][0]=1`，因为 A 与 A 相同。再看 `AC`、`ACB`，虽然它们末尾分别是 C、B，仍可舍弃 Y 的末尾，沿用左边的 1。第一行依次是 `0,1,1,1`。

### 第二行：X 取 AB

`dp[2][2]` 比较 B 与 C，不同，取上方 `dp[1][2]=1` 和左方 `dp[2][1]=1` 的较大值。到 `dp[2][3]`，B 与 B 相同，得 `1+dp[1][2]=2`，对应 `AB`。

### 第三行：X 取 ABC

`dp[3][2]` 的两个末尾都是 C，得 `1+dp[2][1]=2`，对应 `AC`。右下角 `dp[3][3]` 比较 C 与 B，不同，上方和左方都为 2，所以最终长度仍为 2；这个平局正好解释两个可行答案。

### 从右下角还原一个序列

本课规定平局优先向上：从 `(3,3)` 到 `(2,3)`，此时 B 对 B，相同，收下 B 并走到 `(1,2)`；A 对 C 不同，向左到 `(1,1)`，收下 A。逆序得到 `AB`。若在 `(3,3)` 先向左，可走出 `AC`。表格只存长度，回溯时必须依据字符与相邻格，不能把 `dp[3][3]=2` 当作答案字符串。

## 面试回答

LCS 是保持相对顺序、但不要求连续的最长公共子序列。令 `dp[i][j]` 为两串前缀的 LCS 长度，空前缀为 0；末尾字符相同就取左上角加 1，否则取上方与左方的较大值。填 `m×n` 个状态需 `O(mn)` 时间；保存整表用于回溯一个序列需 `O(mn)` 空间。若只求长度，可滚动保存两行，空间降到 `O(min(m,n))`。平局可能有多个正确序列，不应要求输出唯一字符串。

## 多语言示例

两段程序都对 `ABC` 与 `ACB` 填表；平局优先向上，输出长度 `2` 与一个答案 `AB`。输入长度为 `m,n`，完整表含边界行列。

### C++

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    const std::string x = "ABC", y = "ACB";
    const int m = static_cast<int>(x.size()), n = static_cast<int>(y.size());
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));
    for (int i = 1; i <= m; ++i) {
        for (int j = 1; j <= n; ++j) {
            dp[i][j] = x[i - 1] == y[j - 1]
                ? dp[i - 1][j - 1] + 1
                : std::max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    std::string answer;
    int i = m, j = n;
    while (i > 0 && j > 0) {
        if (x[i - 1] == y[j - 1]) {
            answer.push_back(x[i - 1]); --i; --j;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            --i;
        } else {
            --j;
        }
    }
    std::reverse(answer.begin(), answer.end());
    std::cout << dp[m][n] << ' ' << answer << '\n'; // 2 AB
}
```

### Python 3

```python
x, y = 'ABC', 'ACB'
m, n = len(x), len(y)
dp = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    for j in range(1, n + 1):
        if x[i - 1] == y[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

answer = []
i, j = m, n
while i > 0 and j > 0:
    if x[i - 1] == y[j - 1]:
        answer.append(x[i - 1]); i -= 1; j -= 1
    elif dp[i - 1][j] >= dp[i][j - 1]:
        i -= 1
    else:
        j -= 1
print(dp[m][n], ''.join(reversed(answer)))  # 2 AB
```

上述复杂度按字符比较视为 `O(1)` 的常见算法模型分析；实际语言里的 Unicode 字符表示与分割规则须随题意确定。空串也能直接得到长度 0 和空答案。

## 选择题

`X=ABC`、`Y=ACB` 的 LCS 长度为 2。若有人说“答案一定是 `AB`，因为最长公共子串只有一种”，问题出在哪？

- A. LCS 要求连续，所以 `AB` 不合法
- B. 把子序列误说成子串，而且 `AC` 也是长度 2 的公共子序列
- C. `ABC` 与 `ACB` 的 LCS 长度是 3
- D. 表格只能求长度，绝对不能回溯序列

**答案：B。** 子序列可跳字符，最优序列可能不唯一；A、C、D 均与定义或回溯方法相矛盾。

## 参考资料

- [MIT 6.006：Longest Common Subsequence 课程资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lec20/)
