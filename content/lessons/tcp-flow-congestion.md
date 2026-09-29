---
slug: "tcp-flow-congestion"
title: "TCP 流量控制和拥塞控制有何不同"
description: "把接收窗口与拥塞窗口放进同一算例，算清未确认数据上限和还能新发送多少。"
subject: "计算机网络"
order: 113
minutes: 19
lab: "walkthrough"
objectives: ["区分接收端容量限制和网络拥塞限制", "用 rwnd 与 cwnd 计算教学模型中的在途上限", "避免把窗口上限误当作每次必定发送的字节数"]
prerequisites: ["tcp-reliability"]
---

# TCP 流量控制和拥塞控制有何不同

## 两扇窗口防止两种不同的“装不下”

传输控制协议（Transmission Control Protocol，TCP）发送方要顾及两类约束。**流量控制**（Flow Control）防止发送速度超过接收方可用缓冲能力：接收方通告接收窗口（Receiver Window，`rwnd`）。**拥塞控制**（Congestion Control）防止向网络注入过多未确认数据：发送方维护拥塞窗口（Congestion Window，`cwnd`），依确认、丢包等信号及所用算法调整。前者问“接收端现在能接多少”，后者问“网络路径现在宜放多少在途数据”。[RFC 9293：TCP Receiver Window](https://www.rfc-editor.org/rfc/rfc9293.html) · [RFC 5681：Congestion Control](https://www.rfc-editor.org/rfc/rfc5681.html)

在一个简化的、窗口边界稳定的教学模型里，可把允许的**未确认数据上限**看作 `min(rwnd, cwnd)`。这是上限，不是“立刻新发这么多”；已有在途数据会占用额度。真实 TCP 还要处理序号、窗口更新、零窗口探测、分段等细节。[RFC 5681：Definitions and Algorithms](https://www.rfc-editor.org/rfc/rfc5681.html)

## 逐步推演

### 接收方有 8 KiB，网络窗口只允许 4 KiB

设 `rwnd = 8 KiB`、`cwnd = 4 KiB`，暂不考虑其他限制，未确认数据的上限是 `min(8,4)=4 KiB`。即使接收端还有 8 KiB 空位，也不能仅凭此一次注入 8 KiB；此时限制来自拥塞窗口。若已经有 `3 KiB` 在途，新数据最多还能放 `1 KiB`，而不是再发 `4 KiB`。

### 网络许可变宽，但接收方仍只有 8 KiB

假设后续某时刻发送方的 `cwnd` 变为 `12 KiB`，接收端通告 `rwnd` 仍为 `8 KiB`。上限改为 `min(8,12)=8 KiB`，瓶颈换成了接收方。这里是为比较而**给定**窗口数值，不表示真实拥塞算法收到一次 ACK 就必然从 4 变 12。

### 接收方缓冲更紧张

假设接收方应用读取较慢，通告 `rwnd = 2 KiB`，而 `cwnd` 仍为 `12 KiB`，上限就是 `2 KiB`。这时增大网络拥塞窗口也不能突破接收方约束。若接收窗口为零，发送方不能照常继续发送新数据，还须按 TCP 的零窗口处理机制等待/探测，不是把连接立刻断掉。[RFC 9293：Window Management](https://www.rfc-editor.org/rfc/rfc9293.html)

## 哪个窗口由谁决定

| 维度 | 流量控制 `rwnd` | 拥塞控制 `cwnd` |
| --- | --- | --- |
| 主要保护对象 | 接收端缓冲与处理能力 | 共享网络路径容量 |
| 主要状态来源 | 接收端向发送端通告 | 发送端依据拥塞控制算法维护 |
| 变小时的直观意义 | 接收端可接收空间紧张 | 网络路径出现拥塞信号或算法收紧 |

丢包不一定**只**由拥塞引起；接收窗口小也不说明网络链路拥塞。面试应先说两个不同约束的作用，再说明联合限制，别把 `rwnd` 和 `cwnd` 当作同一个“TCP 窗口”。

## 面试回答

TCP 流量控制保护接收方，接收方通告可用接收窗口 `rwnd`；拥塞控制保护网络，发送方依据网络反馈维护 `cwnd`。简化理解，在途未确认数据受两者较小值约束；若 `rwnd=8 KiB`、`cwnd=4 KiB`，上限为 4 KiB，已经在途 3 KiB 时最多再新增 1 KiB。窗口是边界而非必须发送量；具体算法与零窗口处理还需看实现及协议规则。

## 常见误区

- **“接收方窗口大就可随意发送。”** 还受拥塞窗口限制。
- **“`min(rwnd,cwnd)` 是每次都新发的数量。”** 已在途数据占用窗口。
- **“`cwnd` 是接收方通告的。”** 它是发送方维护的拥塞控制状态。

## 选择题

设 `rwnd=8 KiB`、`cwnd=4 KiB`，已有 `3 KiB` 数据在途且其他条件不限制。在教学模型里，此刻最多还可新增多少未确认数据？

- A. 1 KiB
- B. 4 KiB
- C. 5 KiB
- D. 12 KiB

**答案：A。** 上限是较小窗口 4 KiB，减去已有的 3 KiB，剩 1 KiB；B 把上限误当新增量。

## 参考资料

- [RFC 5681：TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681.html)
- [RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
