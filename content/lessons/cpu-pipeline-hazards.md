---
slug: "cpu-pipeline-hazards"
title: "流水线为何不能总是每拍完成一条"
description: "把两条有读后写依赖的指令排进五级流水线，理解转发、停顿与控制相关。"
subject: "计算机基础"
order: 41
minutes: 18
lab: "workbench"
objectives: ["说明流水线主要提高吞吐而非单条指令必然更快", "识别读后写数据相关", "区分数据、控制与结构冒险"]
prerequisites: ["cpu-execution"]
---

# CPU 流水线：两条指令为什么会相互等

## 把一条工作拆成阶段

流水线（Instruction Pipeline）让不同指令同时占用不同处理阶段。采用一个教学用五级模型：取指（Instruction Fetch，IF）、译码/读寄存器（Instruction Decode，ID）、执行（Execute，EX）、访存（Memory Access，MEM）、写回（Write Back，WB）。阶段划分不是所有处理器的固定硬件结构；理想填满后能提升吞吐量，但单条指令仍要走完所需阶段，遇到依赖还可能停顿。[MIT Computation Structures：Pipelining the Beta](https://computationstructures.org/lectures/pbeta/pbeta.html)

## 一条写 R1，下一条读 R1

设 `I1: R1=R2+R3`，紧随其后 `I2: R4=R1+1`。若 I2 在 I1 新结果可用前读到了 R1 的旧值，就会算错。这叫读后写（Read After Write，RAW）数据相关。下面仅展示两条指令在**允许把 I1 的 ALU 结果转发给 I2 的 EX 阶段**的简化排法：

| 时钟周期 | I1 所处阶段 | I2 所处阶段 | 关键 |
| --- | --- | --- | --- |
| 1 | IF | — | 取 I1 |
| 2 | ID | IF | 取 I2 |
| 3 | EX | ID | I1 算出新 R1，I2 尚未完成计算 |
| 4 | MEM | EX | I2 使用从 I1 转发来的新值 |
| 5 | WB | MEM | I1 写回 |
| 6 | — | WB | I2 写回 |

若没有可用的转发通路，就要停顿（Stall）I2，插入气泡（Bubble），直到值可安全取得；但停多少周期取决于具体寄存器时序。若 I1 是加载指令，其值可能到更晚才到手，即使有转发也可能出现加载后立即使用的停顿。[MIT Computation Structures：数据冒险与转发](https://computationstructures.org/lectures/pbeta/pbeta.html)

## 逐步推演

### 识别依赖

I1 写 R1，I2 读 R1，且两条指令相邻；I2 的值必须来自 I1 的**新结果**，不能用旧寄存器值。

### 让阶段重叠

周期 3，I1 在 EX 算出新值，I2 只处于 ID；两条指令能同拍在不同阶段工作，并非完全串行。

### 在使用点补上正确值

周期 4，I2 的 EX 要使用 R1；本模型把 I1 的结果通过转发通路送来，因此不必等到 I1 在周期 5 完成常规写回。

### 缺少通路就停顿

如果此结果不能及时转发，I2 必须等待，流水线前段也可能被挡住；“五级就永远每拍一条”不是结论。

## 还有两类冒险

结构冒险（Structural Hazard）是两条操作同时争用不能同时服务的硬件资源；控制冒险（Control Hazard）来自分支、跳转等导致下一条指令地址暂不确定。数据冒险可用转发或停顿，控制冒险可用预测并在猜错时清除错误路径；这些是不同原因，不要都答成“缓存没命中”。[MIT Computation Structures：流水线冒险](https://computationstructures.org/lectures/pbeta/pbeta.html)

## 面试回答

流水线把指令处理拆成阶段，让多条指令重叠以提高吞吐量，不保证单条指令延迟更短或永远每拍完成一条。I1 写 R1、I2 紧接读 R1 是 RAW 数据冒险，若结果可及时转发可减少停顿，否则插入气泡等待；还有争硬件资源的结构冒险，以及分支改变取指地址的控制冒险。具体停顿拍数须说明流水线模型。

## 选择题

本例 I2 为什么不能无条件使用它在 ID 时读到的旧 R1？

- A. 因为 I2 必须使用 I1 算出的新 R1，存在 RAW 数据相关
- B. 因为 R1 一定在磁盘上
- C. 因为所有相邻指令必须完全串行
- D. 因为分支预测失败

**答案：A。** I1 先写、I2 后读同一寄存器，新旧值影响结果。B、D 与例子无关；C 忽略流水线重叠及转发。

## 参考资料

- [MIT Computation Structures：Pipelining the Beta](https://computationstructures.org/lectures/pbeta/pbeta.html)
