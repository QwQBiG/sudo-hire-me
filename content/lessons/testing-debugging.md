---
slug: "testing-debugging"
title: "从失败用例定位错误"
description: "用全负数数组发现求最大值函数的初始化错误，再让测试保护修正后的行为。"
subject: "工程实践"
order: 168
minutes: 22
lab: "debug"
objectives: ["从接口约定选择测试输入", "通过中间状态定位错误", "编写能识别原始缺陷的回归检查"]
prerequisites: ["array-linked-list"]
---

# 测试与调试：为什么最大值会是数组外面的 0

## 从零理解

测试（Testing）比较实际行为和预期行为，帮助发现违反约定的情况。
调试（Debugging）追踪执行过程，找出实际行为第一次偏离预期的原因。
两者互相配合：失败测试提供可重复的入口，调试解释原因，修复后再用测试确认。
没有清楚的约定，就无法判断某个结果究竟是错误还是合理选择。

本课讨论 `maxOrNull(values)`：输入是整数数组，非空时返回其中最大值，空数组返回“没有结果”（不同语言可用 `null`、`None` 或可选值表示）。输入类型与范围由调用约定保证；本例不负责把任意外部数据转换为整数。
例如 `[2, 9, 4]` 应返回 9，`[-8, -3, -5]` 应返回 -3，`[]` 应返回“没有结果”。
最大值是按大小比较的结果，不要求数组已经排序。

## 一段有问题的实现

```text
best ← 0
依次读取 values 中的每个 value：
    若 value > best，则令 best ← value
返回 best
```

正数例子可能全部通过，却不能说明这段实现满足约定。
先让输入有代表性，再观察错误；不要先把随机结果当成期望答案。

## 逐步推演

### 第一步：固定能失败的输入

输入 `[-8, -3, -5]`，预期最大值为 -3，但错误实现返回 0。
0 根本不在输入数组中。对于非空整数数组，这已经是结果违反约定的证据。
固定这个输入和调用方式，之后每次运行都能检查同一个问题。

### 第二步：观察每轮中间状态

| 时刻 | 当前 value | 比较结果 | best |
| --- | --- | --- | --- |
| 初始化 | 尚未读取 | 无 | 0 |
| 第一次比较 | -8 | -8 > 0 为假 | 0 |
| 第二次比较 | -3 | -3 > 0 为假 | 0 |
| 第三次比较 | -5 | -5 > 0 为假 | 0 |

判断和循环都按代码正常执行；错误来自把不属于候选集合的 0 当作初始最大值。
在调试器中可于循环处设断点（Breakpoint），每次查看 value 和 best，以验证这条因果链。

### 第三步：根据约定修正初始化

空数组没有候选值，所以先单独返回“没有结果”；非空数组用第一个实际元素初始化。

```text
若 values 为空，则返回“没有结果”
best ← values[0]
从下标 1 开始，依次读取剩余的 value：
    若 value > best，则令 best ← value
返回 best
```

对同一输入，best 初始为 -8，比较 -3 后更新为 -3，比较 -5 后保持 -3。
修复来自输入约定与初始化原因，不是专门识别这三个数字后返回固定值。

### 第四步：用正常值与边界保护修复

| 输入 | 预期结果 | 检查的风险 |
| --- | --- | --- |
| [2,9,4] | 9 | 普通多元素情况 |
| [-8,-3,-5] | -3 | 全负数与错误的零初始化 |
| [-5] | -5 | 单元素不进入后续循环 |
| [] | 无结果（网页实验中为 `null`） | 空输入的明确约定 |
| [7,7] | 7 | 重复最大值 |

这些检查中的全负数和空输入会让旧实现失败，说明它们确实能区分错误实现与修正实现。
保留已发现缺陷的测试叫回归测试（Regression Test），便于发现未来修改是否重新引入同类问题。

## 多语言示例

两段程序都实现修正后的规则并检查同样五组输入，成功时输出 `5 cases passed`；若把初值改回 0，全负数用例会失败。网页实验另用浏览器中的 JavaScript 版本执行这五组固定输入并显示 `best` 的变化；下面的 C++ 和 Python 3 代码是各自独立运行的示例，不是网页在编译或执行这两种语言。

### C++

```cpp
#include <iostream>
#include <optional>
#include <vector>

std::optional<int> maxOrNull(const std::vector<int>& values) {
    if (values.empty()) return std::nullopt;
    int best = values[0];
    for (std::size_t i = 1; i < values.size(); ++i)
        if (values[i] > best) best = values[i];
    return best;
}

int main() {
    std::vector<std::vector<int>> inputs = {
        {2, 9, 4}, {-8, -3, -5}, {-5}, {}, {7, 7}
    };
    std::vector<std::optional<int>> expected = {
        9, -3, -5, std::nullopt, 7
    };
    for (std::size_t i = 0; i < inputs.size(); ++i) {
        if (maxOrNull(inputs[i]) != expected[i]) {
            std::cerr << "case " << i << " failed\n";
            return 1;
        }
    }
    std::cout << "5 cases passed\n";
}
```

### Python 3

```python
def max_or_none(values):
    if not values:
        return None
    best = values[0]
    for value in values[1:]:
        if value > best:
            best = value
    return best

cases = [
    ([2, 9, 4], 9),
    ([-8, -3, -5], -3),
    ([-5], -5),
    ([], None),
    ([7, 7], 7),
]
for index, (values, expected) in enumerate(cases):
    actual = max_or_none(values)
    if actual != expected:
        raise AssertionError(f'case {index}: expected {expected}, got {actual}')
print('5 cases passed')
```

检查失败时保留输入、预期与实际结果，便于复现，而不只是打印“失败”。C++ 用 `std::optional<int>` 区分空输入与数字 0；Python 用 `None`。它们表达同一接口约定，不把有效结果 0 当作空值。

## 测试不能替代的判断

这些用例覆盖了已知风险，但不是对所有输入的穷尽证明。
还需要理解循环中的性质：处理过的前缀非空，best 始终等于该前缀的最大值。
初始时前缀只有第一个元素，性质成立；每次比较扩大前缀并更新 best，性质继续成立。
循环结束后前缀就是整个数组，因此得到最大值。空数组已由独立分支处理。

## 常见错误

- **测试只选正数。** 会漏掉把 best 初始化为 0 的缺陷。
- **把实现复制一遍作为期望计算。** 两边可能带着同一个错误，应使用独立推理的答案或性质。
- **为了通过测试只处理某个固定输入。** 修复应解释并恢复一般约定。
- **看见错误就重写整个函数。** 先用状态找到原因，修改相关逻辑再验证，便于判断修复是否有效。
- **单元测试通过代表整个应用正确。** 单元测试（Unit Test）关注局部；组件连接、输入解析等仍需相应集成测试（Integration Test）。

## 面试回答

先定义输入范围和输出约定，再选择正常、边界和能触发已知风险的输入。
失败后保留可复现用例，通过日志或断点追踪首次偏差，修正原因后运行回归检查。
测试通过是所检查行为的证据，需要结合原理和其他验证，不能直接推广成整个系统没有错误。

## 选择题

哪组输入最直接揭示本课旧实现把 best 初始化为 0 的问题？

- A. [2,9,4]，期望 9。
- B. [0,0]，期望 0。
- C. [1]，期望 1。
- D. [-8,-3,-5]，期望 -3。

**答案：D。** 所有输入均小于 0，错误初值不会被替换，得到不属于输入的 0。A、B、C 都可能让错误实现碰巧返回正确值。

## 面试追问

“为什么单元素也要测？”它检验初始化和循环边界，能暴露跳过首元素等错误。
“负数失败后只改成很小的常量可以吗？”常量可能仍大于合法输入；用真实首元素初始化更直接地满足本例约定。
“如何缩小复杂故障？”减少无关输入和操作，同时保留失败现象，形成最小复现（Minimal Reproduction）。

## 官方参考

- [Python 文档：unittest](https://docs.python.org/3/library/unittest.html)，测试用例、断言与测试套件。
- [GDB 文档：Breakpoints](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Breakpoints.html)，断点调试的基本机制。
