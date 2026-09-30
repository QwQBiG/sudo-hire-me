---
slug: "interrupt-vs-polling"
title: "设备完成了，CPU 怎么知道"
description: "用 7 毫秒到达的事件对比周期轮询与中断通知，理解检查成本、等待延迟和混合处理。"
subject: "计算机基础"
order: 102
minutes: 17
lab: "workbench"
objectives: ["按时间线计算周期轮询的检测延迟", "说明中断通知并非零成本或绝对实时", "解释高事件率下为何会混合中断与批量轮询"]
prerequisites: ["interrupt-exception-trap", "cpu-execution"]
---

# 轮询和中断：谁主动问设备

## 两种发现事件的方式

轮询（Polling）由 CPU/驱动主动读设备状态；中断（Interrupt）由设备在某事件发生时请求 CPU 处理。两者解决的是**如何发现状态变化**，不是数据一定怎样搬运；数据传输方式另见 DMA。忙轮询持续占用 CPU 周期，但可避免某些唤醒等待；中断减少空闲时无谓检查，却有通知、切换和处理开销，也不保证“事件瞬间就运行处理代码”。[Linux 内核文档：NAPI 与 Busy Polling](https://docs.kernel.org/networking/napi.html)

## 把事件放上时间线

固定一个演示：设备在 `t=7 ms` 完成。若驱动只在 `t=0,5,10,15... ms` 检查，0 与 5 两次都看到“未完成”，10 第一次看到“已完成”，所以**检测延迟是 10-7=3 ms**，到发现为止共检查三次。若设备在 7 ms 发中断请求，处理启动时间还取决于屏蔽、优先级、当前执行与系统调度，不能据此给唯一的“0 ms 延迟”。[MIT xv6 教材：轮询与中断权衡](https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/3def8fcd397933ebb846fb479bdcf556_MIT6_828F12_xv6-book-rev7.pdf)

## 逐步推演

### 先检查 t=0 与 t=5

事件尚未发生，这两次轮询均返回“未完成”；CPU 仍花了检查成本。

### 事件在 t=7 到达

设备状态变为已完成。周期轮询不会在 7 自动执行处理，要等下一个预定时点；中断模式则可以发出通知请求。

### t=10 再检查

轮询第三次发现完成，检测晚了 3 ms。把轮询周期缩短通常能降低这类等待，但检查次数与 CPU 占用也会增加。

### 高事件率考虑批量处理

若每个网络包都触发并完整处理一次中断，通知开销可能很高。Linux NAPI 的典型路径是先经中断通知，再在轮询处理阶段批量取事件；也支持忙轮询模式，实际选择看吞吐、延迟和 CPU 预算。[Linux NAPI 文档](https://docs.kernel.org/networking/napi.html)

## 面试回答

轮询由 CPU 主动反复检查设备状态，检测延迟取决于检查间隔，过密会消耗 CPU；中断由设备主动请求处理，空闲时可避免无谓检查，但通知与处理也有开销，响应并非零延迟。高频设备常结合两者，例如中断触发后批量轮询。讨论选择时要给出事件频率、延迟目标和 CPU 成本，不能断言“中断永远更快”或“轮询永远浪费”。

## 选择题

按本课时间线，事件在 7 ms 发生，仅在 0、5、10、15 ms 轮询，首次发现和检测延迟分别是多少？

- A. 7 ms，0 ms
- B. 10 ms，3 ms
- C. 5 ms，2 ms
- D. 15 ms，8 ms

**答案：B。** 5 ms 时事件未发生，下次检查 10 ms 才发现；相对事件发生晚 3 ms。A 把轮询误当即时通知，C 倒置事件与检查，D 漏掉 10 ms 检查。

## 参考资料

- [Linux 内核文档：NAPI](https://docs.kernel.org/networking/napi.html)
- [MIT xv6 教材：I/O 轮询与中断](https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/3def8fcd397933ebb846fb479bdcf556_MIT6_828F12_xv6-book-rev7.pdf)
