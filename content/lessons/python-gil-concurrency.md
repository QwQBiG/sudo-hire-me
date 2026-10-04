---
slug: "python-gil-concurrency"
title: "GIL 为什么不等于 Python 不能并发"
description: "按 CPython 构建和工作负载区分线程、进程与可选无 GIL 模式，避免把解释器锁当成业务锁。"
subject: "Python 3 语言机制"
order: 218
minutes: 20
lab: "workbench"
objectives: ["明确 GIL 的实现前提", "区分 CPU 与 I/O 工作负载", "说明 GIL 不保证复合业务操作原子性"]
prerequisites: ["process-thread", "race-condition-vs-data-race"]
---

# 先说 CPython，再谈 GIL

## 面试回答

全局解释器锁（Global Interpreter Lock，GIL）是普通 CPython 构建保护解释器内部状态的机制，同一解释器通常一次只让一个线程执行 Python 字节码。但线程能并发调度，阻塞 I/O 和部分原生扩展可以释放 GIL，因此 I/O 密集任务仍可能获益。CPU 密集纯 Python 在这种构建下通常不能靠多线程利用多个核心，可考虑多进程或合适的原生实现。Python 3.13 起提供可选 free-threaded 构建，不能把 GIL 说成所有 Python 实现和版本永恒的限制，也不能把它当业务数据的同步锁。

## 两类任务的时间线

CPU 任务 A/B 都持续执行 Python 字节码：普通 CPython 的执行权在两个线程间切换，不是同一时刻同时在两核执行这段字节码。下载任务 A 在等待网络时释放 GIL，B 可以继续计算或等待另一请求；等待重叠体现并发，即使没有两个 CPU 字节码执行流同时运行。

“线程并发”描述任务时间段交错，“并行”（Parallelism）描述同一时刻执行。多进程使用独立地址空间和解释器实例，通常避开这一执行限制，但有启动、数据序列化和进程间通信成本，不能无条件承诺更快。

### 等待时间不是执行工作量

线程存在、时间流逝、CPU 正在执行它，三者不是同一回事。A 等待 GIL 时，没有在执行这里的 Python 字节码；A 等待网络时，也不能因为经过八个观察拍就声称它完成了八拍计算。

网页固定观察八拍，选取三种示意情形：

| 情形 | A 执行字节码的拍数 | B 执行字节码的拍数 | 前提 |
| --- | --- | --- | --- |
| 普通 CPython，两 CPU 任务交替 | 4 | 4 | 模型安排 A、B 交替取得执行权 |
| 可选 free-threaded，两任务同时执行 | 8 | 8 | 模型假设足够 CPU 核心，未建模对象与扩展竞争 |
| A 始终等待 I/O，B 计算 | 0 | 8 | A 在这段观察窗口内一直等待，并已释放 GIL |

这不是速度比测试，也不是 CPython 每拍必定交换执行权的调度规则；拍的长度与切换顺序都只是帮助区分“执行”和“等待”。底层原生扩展还可能在释放 GIL 后并行完成计算，所以“普通 CPython 有 GIL”不能直接推出“整个进程只能使用一个 CPU 核心”。

## 实验代码

```python
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
lock = Lock()
counter = 0
def add_many():
    global counter
    for _ in range(1000):
        with lock:
            counter += 1
with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(lambda _: add_many(), range(2)))
print(counter)
```

预期 2000，正确性来自对整个更新加锁，不是依赖某个解释器版本的具体字节码调度。不要用“无锁跑了十次都没丢”证明无竞争，也不要把这个短例的时间当性能基准。网页调度拍仅用于说明执行权，没有测真实耗时。

## 面试追问：free-threaded 后是不是无需锁

仍然需要。内部容器保护不等于多个操作组成的业务不变量自动原子。例如“检查余额够不够，然后扣款”必须作为整体同步。可选无 GIL 构建还涉及扩展模块兼容性和是否重新启用 GIL；应先确认 Python 实现、版本、构建以及具体依赖。锁、队列和其他同步方式用于明确正确性，再依据测量优化；GIL 不是程序员可省略协议的理由。

## 选择题

普通启用 GIL 的 CPython 中，下列判断最准确的是？

A. 任何两个线程绝不可能并发

B. CPU 密集字节码与 I/O 等待拥有相同的并行限制

C. 阻塞 I/O 可能释放 GIL，线程可重叠等待；复合共享更新仍需同步

D. 所有 Python 实现一定有相同 GIL

**答案：C。** A 混淆并发与并行；B 忽略等待和原生执行；D 忽略实现与可选构建。涉及性能的具体选择仍需实际负载证据。

## 参考

- [Python 术语表：GIL](https://docs.python.org/3/glossary.html#term-global-interpreter-lock)
- [Python：free-threaded 说明](https://docs.python.org/3/howto/free-threading-python.html)
