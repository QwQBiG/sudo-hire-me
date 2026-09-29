---
slug: "dma-basic"
title: "DMA 传数据时 CPU 还做什么"
description: "沿配置、设备搬运、完成通知的时间线理解直接内存访问、CPU 参与边界与地址映射。"
subject: "计算机基础"
order: 103
minutes: 18
lab: "dma-transfer"
objectives: ["说明 CPU 配置与设备搬运的职责", "判断未完成时能否安全使用接收缓冲区", "区分 CPU 虚拟地址、设备 DMA 地址与完成通知"]
prerequisites: ["interrupt-vs-polling", "memory-hierarchy-basic"]
---

# DMA：数据可不经 CPU 逐项搬运

## 把“直接”理解准确

直接内存访问（Direct Memory Access，DMA）让具备能力的设备或控制器在合适配置下与内存传输数据，而不要求 CPU 对每个数据单元都执行普通的加载再存储。**CPU 仍要准备缓冲区、配置传输、处理完成与错误**；DMA 不是“CPU 完全不参与”。设备使用的 DMA 地址可能不同于 CPU 虚拟地址和物理地址，输入输出内存管理单元（Input-Output Memory Management Unit，IOMMU）可能参与映射。[Linux 内核文档：DMA 地址](https://docs.kernel.org/core-api/dma-api-howto.html)

## 四块数据的教学时间线

假设设备要把四个抽象数据块 A、B、C、D 放进接收缓冲区，且已由驱动建立设备可用的地址映射。本例选“传完后设备发完成通知”的路径：

| 时点 | CPU/驱动 | 设备控制器 | 缓冲区可用状态 |
| --- | --- | --- | --- |
| 0 | 配置长度 4、方向和 DMA 地址 | 等待启动 | 不能把未填满结果当完成 |
| 1 | 可做独立工作 | 搬 A、B | 仅部分完成 |
| 2 | 仍可做独立工作 | 搬 C、D | 搬运完成，等待完成处理 |
| 3 | 处理通知并完成必要同步 | 报告完成 | 驱动按协议交付结果 |

实验里的“设备搬运一块”是抽象进度事件，不代表真实总线一次只传一个字节，也不计算硬件耗时。点击“CPU 做独立计算”不会增加已搬运块数；点击设备推进也不保证 CPU 立刻收到完成通知。[Linux 内核文档：DMA 映射与传输方向](https://docs.kernel.org/core-api/dma-api.html)

## 为什么还要同步和通知

设备完成搬运之后，驱动通常还要确认完成状态、检查错误、按平台规则处理 DMA 映射与 CPU 缓存可见性，才把数据交给上层。若设备尚在写缓冲区时 CPU 就当结果已完成来读，可能读到部分或旧数据。并非所有 DMA 完成都必须靠中断通知，系统也可轮询完成状态；“DMA 是搬运方式”“中断/轮询是发现完成的方式”属于不同维度。[Linux DMA API 指南](https://docs.kernel.org/core-api/dma-api-howto.html)

## 面试回答

DMA 允许设备/控制器按配置直接与内存传输，减少 CPU 逐项搬数据的参与；CPU仍负责准备缓冲区、建立 DMA 地址映射、启动传输并处理完成与错误。设备的 DMA 地址不一定等于 CPU 虚拟地址；传输完成后还可能需要缓存/映射同步。DMA 与中断不是二选一：前者负责搬运，后者或轮询负责报告完成。未确认完成前不能把接收缓冲区当完整结果使用。

## 实验边界与误区

- 实验固定四个抽象块，不模拟 IOMMU 页表、真实设备总线、并发错误或缓存同步指令。
- “CPU 可以做别的事”不是每个 CPU 时钟都绝不碰内存，也不表示 DMA 零 CPU 开销。
- “DMA 完成”不是“文件已经持久化”，更不是“所有上层协议已处理完成”。

## 选择题

设备 DMA 已搬运四块中的两块，CPU 正在做其他计算。此时哪项正确？

- A. CPU 做了两次计算，就代表后两块也已搬完
- B. DMA 不需要任何 CPU 配置
- C. 缓冲区尚未按本例完成协议交付，不能当完整四块结果使用
- D. 只要用了 DMA，就不能使用中断通知

**答案：C。** 已搬两块与完整四块不同，还需确认传输完成和必要同步。A 混淆两条进度线，B 忽略配置，D 混淆搬运与通知。

## 参考资料

- [Linux 内核文档：Dynamic DMA mapping Guide](https://docs.kernel.org/core-api/dma-api-howto.html)
- [Linux 内核文档：DMA API](https://docs.kernel.org/core-api/dma-api.html)
