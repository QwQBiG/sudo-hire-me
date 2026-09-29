---
slug: "string-pattern-kmp"
title: "KMP：失配时不重扫文本"
subject: "数据结构与算法"
description: "用一个有重复前后缀的模式串构造前缀表，观察失配后模式回退而文本位置不动。"
order: 77
minutes: 23
lab: "kmp-prefix"
objectives: ["求模式串的最长相等真前后缀长度", "手算一次失配与前缀表回退", "说明 O(n+m) 的前提与适用范围"]
prerequisites: ["array-linked-list", "linear-search-first"]
---

# KMP：失配时不重扫文本

## 朴素匹配为何会重复比较

要在文本 `T="abababaca"` 中找模式 `P="ababaca"`。从文本下标 0 开始，前五个字符 `ababa` 匹配，到文本下标 5 的 `b` 与模式下标 5 的 `c` 失配。朴素算法可能把起点移到 1，再从模式开头比较；但前面已经匹配的字符里有规律，不必让文本指针倒退。

KMP（Knuth-Morris-Pratt）先为模式串建立前缀函数（Prefix Function，也常称 `π` 表或部分匹配表）：`π[i]` 是 `P[0..i]` 的**最长相等真前缀与后缀**的长度。“真前缀”不能等于整个字符串自身。这个长度告诉我们，当前已匹配部分失配后，模式还可以保留多长的已知吻合前缀。

| i | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P[i] | a | b | a | b | a | c | a |
| π[i] | 0 | 0 | 1 | 2 | 3 | 0 | 1 |

例如 `P[0..4]="ababa"` 的最长相等真前后缀是 `"aba"`，长度 3；`P[0..5]="ababac"` 的候选长度先从 3 回退到 1、再到 0，仍找不到与末尾 `c` 相同的前缀，所以 `π[5]=0`。

## 从旧边界推出新边界

构造 `π[i]` 时，设当前候选长度 `j=π[i-1]`。若 `P[i]` 不等于 `P[j]`，不能简单令 j=0；先令 `j=π[j-1]`，尝试“较短但仍可能匹配”的边界，直到匹配或 j=0。若最终 `P[i]==P[j]`，令 j 加 1；写入 `π[i]=j`。构造时 `π[0]=0` 是边界。

匹配文本时也用同一回退：若 `T[i]!=P[j]` 且 `j>0`，令 `j=π[j-1]`，**文本下标 i 不变**，用同一个文本字符再与新的模式位置比较。只有 j=0 还不匹配，才让 i 前进。匹配完整模式后记录起点，并把 j 回退到 `π[m-1]`，以便继续寻找可能重叠的下一次出现。

## 手算关键失配

前五个字符 `ababa` 匹配后，`i=5,j=5`，当前 `T[5]=b`、`P[5]=c`。看 `π[j-1]=π[4]=3`，把 j 改成 3，但 i 仍是 5。现在 `T[5]=b` 与 `P[3]=b` 匹配，推进至 `i=6,j=4`；接着依次匹配 `a,c,a`，最终 `i=9,j=7`，找到起点 `9-7=2`，即 `T[2..8]="ababaca"`。若失配时直接把 j 清零，这一段可复用的前缀信息就白算了。

## 面试回答

KMP 对非空模式串先用前缀函数 `π[i]` 记录模式前 `i+1` 个字符的最长相等真前后缀长度；文本失配时把模式位置 `j` 回退到 `π[j-1]`，文本位置 `i` 不回退。构建前缀表 `O(m)`，扫描长度 n 的文本 `O(n)`，总时间 `O(n+m)`、额外空间 `O(m)`。它解决单模式精确匹配；正则、模糊匹配或复杂文本规范化不是这个算法直接处理的目标。面试是否深入要求 KMP 因岗位而异，先把朴素匹配、前后缀含义和失配回退说清楚更重要。

## 多语言示例

两段程序都在 ASCII 文本 `abababaca` 中查找模式 `ababaca`，预期输出匹配起点 `[2]`。接口约定模式非空；这里的下标按字符单元计，C++ `std::string` 按字节、Python 字符串按 Unicode 码点，对更复杂的用户可见字符边界需另行定义。

### C++

```cpp
#include <iostream>
#include <string>
#include <vector>

std::vector<int> prefix(const std::string& p) {
    std::vector<int> pi(p.size(), 0);
    for (int i = 1; i < static_cast<int>(p.size()); ++i) {
        int j = pi[i - 1];
        while (j > 0 && p[i] != p[j]) j = pi[j - 1];
        if (p[i] == p[j]) ++j;
        pi[i] = j;
    }
    return pi;
}
std::vector<int> findAll(const std::string& text, const std::string& p) {
    std::vector<int> pi = prefix(p), matches;
    int j = 0;
    for (int i = 0; i < static_cast<int>(text.size()); ++i) {
        while (j > 0 && text[i] != p[j]) j = pi[j - 1];
        if (text[i] == p[j]) ++j;
        if (j == static_cast<int>(p.size())) {
            matches.push_back(i + 1 - j);
            j = pi[j - 1];
        }
    }
    return matches;
}
int main() {
    for (int start : findAll("abababaca", "ababaca")) std::cout << start << ' ';
    std::cout << '\n';
}
```

### Python 3

```python
def prefix(pattern):
    pi = [0] * len(pattern)
    for i in range(1, len(pattern)):
        j = pi[i - 1]
        while j > 0 and pattern[i] != pattern[j]:
            j = pi[j - 1]
        if pattern[i] == pattern[j]:
            j += 1
        pi[i] = j
    return pi

def find_all(text, pattern):
    if not pattern:
        raise ValueError('pattern must be nonempty')
    pi = prefix(pattern)
    matches = []
    j = 0
    for i, char in enumerate(text):
        while j > 0 and char != pattern[j]:
            j = pi[j - 1]
        if char == pattern[j]:
            j += 1
        if j == len(pattern):
            matches.append(i + 1 - j)
            j = pi[j - 1]
    return matches

print(find_all('abababaca', 'ababaca'))  # [2]
```

两段实现都要求模式非空；Python 显式报错，C++ 示例固定调用非空模式，若改成对外接口也应加参数检查，不能读取空模式的 `p[0]`。

## 常见误区

- 失配后把文本指针退回起点：这样失去 KMP 的线性扫描优势。
- 把 `π[i]` 当成“当前子串长度”：它是**真前后缀的最大长度**，不是任意匹配长度。
- 模式完全匹配后把 j 永远清零：可能漏掉重叠匹配，例如模式 `aba` 在 `ababa` 中起点为 0 和 2。
- 忽略空模式的 API 约定：本课拒绝空模式，不偷偷返回所有位置。

## 选择题

本课匹配到 `i=5,j=5` 时 `T[5]=b`、`P[5]=c` 失配，且 `π[4]=3`。下一步应该怎样做？

- A. 保持 i=5，将 j 回退到 3，再比较 `T[5]` 与 `P[3]`
- B. i 回到 0，j 回到 0
- C. 直接返回无匹配
- D. 把 `π[4]` 改成 5

**答案：A。** 已匹配部分的最长相等真前后缀长度是 3，同一文本字符可与模式位置 3 重试；其余选择都丢掉或篡改已知信息。

## 参考资料

- [cp-algorithms：Prefix Function 的构造与 KMP 搜索](https://cp-algorithms.com/string/prefix-function.html)
