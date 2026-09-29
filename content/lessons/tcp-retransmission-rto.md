---
slug: "tcp-retransmission-rto"
title: "TCP 超时重传的计时器怎样工作"
description: "设定 2 秒 RTO 和一段丢失数据，算出第一次重传、退避后下一次截止与 ACK 到达的作用。"
subject: "计算机网络"
order: 112
minutes: 20
lab: "walkthrough"
objectives: ["区分 RTT 测量和 RTO 等待时间", "手算超时后的指数退避时刻", "说明重传段的 ACK 为什么有 RTT 样本歧义"]
prerequisites: ["tcp-reliability"]
---

# TCP 超时重传的计时器怎样工作

## 已发数据迟迟没被确认怎么办

TCP 用往返时间（Round-Trip Time，RTT）的测量来估计合适的**重传超时**（Retransmission Timeout，RTO）。发送方发出尚未确认的数据并启动计时；若最早未确认段在计时器到期前仍没被确认，重传它。RTO 不是“每个包固定等 200 毫秒”，也不是 RTT 本身：要考虑 RTT 变化和时钟粒度；RFC 6298 给出平滑 RTT、偏差和 RTO 的计算与退避规则。[RFC 6298：Computing TCP's Retransmission Timer](https://www.rfc-editor.org/rfc/rfc6298.html)

本课给定**当前 RTO 恰好为 2 秒**，以便只算超时和退避，不把它误说成所有连接的初始默认值。RFC 6298 在尚未得到 RTT 样本时建议初始 RTO 1 秒，也允许更大的实现值，实际系统可有策略差异。

## 逐步推演

### 时刻 0 发出未确认数据

发送方在 `t=0 s` 发出序号 `1000–1001` 的两个数据字节，按示例当前 RTO 2 秒启动计时。如果在 `t<2 s` 收到覆盖这两个字节的确认 `ACK=1002`，便不需要本例的超时重传。

### 时刻 2 超时，先重传再退避

假设原段或它的 ACK 丢了，至 `t=2 s` 仍未确认。计时器到期，重传最早未确认的那段；RTO 随后按 RFC 规则倍增为 4 秒，新的计时从这次超时后开始。**下一次超时点是 `2+4=6 s`，不是 `4 s`**。这里忽略其他新数据、确认、快速重传和系统计时抖动。[RFC 6298：Managing the RTO Timer](https://www.rfc-editor.org/rfc/rfc6298.html)

### 时刻 3 收到 ACK，结束这轮等待

如果 `t=3 s` 收到 `ACK=1002`，最早未确认数据已被确认，且本例已无其他在途数据，重传计时器关闭，`t=6 s` 不会再重传。这个 ACK 无法仅凭序号判断确认的是原始段还是重传段，因此**通常不能直接用 `3−0` 或 `3−2` 当成 RTT 样本**；TCP 时间戳选项可消除这一歧义。[RFC 6298：Taking RTT Samples](https://www.rfc-editor.org/rfc/rfc6298.html)

## 超时重传不是唯一恢复路径

接收方对乱序数据重复确认时，发送方也可能按快速重传规则在 RTO 到期前恢复丢失数据。计时器处理和拥塞窗口调整是相关但不同的问题；“收不到 ACK 立刻重发”“每个重复 ACK 都重发”都不是正确描述。[RFC 5681：Fast Retransmit](https://www.rfc-editor.org/rfc/rfc5681.html)

## 面试回答

TCP 依据 RTT 估计设定 RTO，最早未确认数据的计时器到期后重传；连续超时通常让 RTO 指数退避，减少重复向可能拥塞的网络注入数据。本例 RTO 2 秒，t=2 重传并把下一次等待扩为 4 秒，因此再超时是 t=6；若 t=3 全部确认就关闭计时器。重传后收到的 ACK 有“确认原报文还是重传报文”的歧义，未使用消歧机制时不能直接拿它测 RTT。

## 常见误区

- **“当前 RTO 2 秒，重传后下一次在 t=4。”** 退避到 4 秒是从 t=2 重新等待。
- **“超时必然证明数据段本身丢了。”** ACK 丢失或过度延迟也可能导致超时。
- **“RTO 是所有连接固定不变的值。”** 它随测量与退避调整。

## 选择题

某段在 t=0 发出，当前 RTO 为 2 秒；没有 ACK，也没有其他事件。按本课的倍增退避示例，第一次与第二次超时分别在何时？

- A. t=2 和 t=4
- B. t=2 和 t=6
- C. t=1 和 t=2
- D. t=2 和 t=8

**答案：B。** t=2 首次到期后 RTO 变为 4 秒，新一轮从 t=2 等到 t=6；A 把“等待长度 4 秒”错当绝对时刻。

## 参考资料

- [RFC 6298：Computing TCP's Retransmission Timer](https://www.rfc-editor.org/rfc/rfc6298.html)
- [RFC 5681：TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681.html)
