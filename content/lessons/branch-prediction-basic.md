---
slug: "branch-prediction-basic"
title: "分支预测为什么会有两位状态"
description: "对同一条分支输入 T、T、T、N、T，比较一位历史和两位饱和计数器的预测变化。"
subject: "计算机基础"
order: 42
minutes: 18
lab: "branch-predict"
objectives: ["解释分支未决时为何需要预测", "逐次更新一位与两位状态", "说明一次偶发反向为何不必立刻翻转两位预测"]
prerequisites: ["cpu-pipeline-hazards"]
---

# 分支预测：先猜下一条，再核对

## 控制冒险的直观解法

条件分支结果尚未算出时，流水线不知道该继续取顺序地址还是目标地址。分支预测（Branch Prediction）先猜方向，让后续取指继续；若猜错，错误路径上的未提交工作需丢弃并改走正确路径，因此预测失误有成本。预测不能改变程序规定的最终结果，本课只看“跳转 T / 不跳 N”的方向，不模拟目标地址、缓存、副作用或真实处理器的复杂预测器。[MIT Computation Structures：控制冒险与猜测](https://computationstructures.org/lectures/pbeta/pbeta.html)

## 两个小预测器的固定规则

一位模型只记上次实际结果，初始预测 N。两位模型用饱和计数器（Saturating Counter）0、1、2、3，初始 1：0/1 预测 N，2/3 预测 T；实际 T 就加一但最多 3，实际 N 就减一但最少 0。状态 0、1、2、3 分别可读作强不跳、弱不跳、弱跳、强跳。[MIT 6.172：两位饱和计数器](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/8955b91dbd47c241fb2904c700fdb697_MIT6_172F18_lec4.pdf)

| 第几次 | 实际 | 一位：先预测→更新 | 两位：先预测→状态更新 |
| --- | --- | --- | --- |
| 1 | T | N 错→T | N 错，1→2 |
| 2 | T | T 对→T | T 对，2→3 |
| 3 | T | T 对→T | T 对，3→3 |
| 4 | N | T 错→N | T 错，3→2 |
| 5 | T | N 错→T | T 对，2→3 |

这串结果是一位正确 2/5、两位正确 3/5。两位模型在已经“强跳”时只遇到一次 N，会从 3 降到 2，**下一次仍预测 T**；它不是总比一位预测准确，具体要看分支模式和初始状态。[MIT 6.172：预测状态](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/8955b91dbd47c241fb2904c700fdb697_MIT6_172F18_lec4.pdf)

## 面试回答

分支预测用于缓解控制冒险：分支结果尚未确定时先预测下一条路径，猜对可继续流水线，猜错要清除错误路径工作并转向正确路径。入门的一位预测器记录上次结果；两位饱和计数器用“强/弱”状态，通常需要更持续的相反结果才翻转方向。本例 T、T、T、N、T 中，两位模型抗住一次偶发 N；真实预测器还可能考虑多条分支历史与目标地址，不能把这个四状态模型当成硬件通用规格。

## 实验边界

实验固定单条分支、一位初始 N、两位初始弱不跳，不考虑不同分支共用表项、预测目标、流水线恢复拍数与实际性能。每点一次“实际 T/N”，两位模型先预测再更新，右侧显示本次结果；重置后从相同初态开始比较。

## 选择题

本课两位计数器在状态 3（强跳）时，遇到一次实际 N 后，下次预测什么？

- A. 仍预测 T，因为状态变为 2
- B. 改预测 N，因为状态立即变为 0
- C. 永远不再预测 T
- D. 无法根据给定状态机推断

**答案：A。** 一次 N 只让饱和计数器 3→2，状态 2 仍预测 T。B 把两位模型当成一位立即翻转；C、D 与给定规则冲突。

## 参考资料

- [MIT Computation Structures：流水线中的分支预测](https://computationstructures.org/lectures/pbeta/pbeta.html)
- [MIT 6.172：两位饱和计数器](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/8955b91dbd47c241fb2904c700fdb697_MIT6_172F18_lec4.pdf)
