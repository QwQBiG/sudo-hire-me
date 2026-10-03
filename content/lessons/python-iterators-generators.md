---
slug: "python-iterators-generators"
title: "Python 迭代器与生成器为什么会被耗尽"
description: "从 iter 和 next 到 yield 暂停点，区分可迭代对象、一次性迭代器和按需生成。"
subject: "Python 3 语言机制"
order: 217
minutes: 18
lab: "workbench"
objectives: ["区分 iterable 与 iterator", "追踪 yield 前后执行位置", "判断重复消费与内存使用"]
prerequisites: ["function-arguments"]
---

# 生成器不保存一份已经算好的列表

## 面试回答

可迭代对象（Iterable）能经 iter() 得到迭代器（Iterator）；迭代器经 next() 逐个产出元素，结束时抛 StopIteration。生成器（Generator）是一种迭代器，包含 yield 的函数调用返回生成器对象，函数体通常到第一次 next 才开始执行，yield 产出值并暂停，后续 next 从暂停处继续。同一个生成器消费后不会自动复位；按需生成避免一次性存储全部结果，但仍保存局部状态和相关引用，不是“零内存”。

## 四次 next 才看到结束

生成器依次 yield 0²、1²、2²：

| 操作 | 返回/异常 | 执行位置 |
| --- | --- | --- |
| g=squares() | 生成器对象 | 函数体尚未开始 |
| next(g) | 0 | 在第一次 yield 暂停 |
| next(g) | 1 | 在第二次 yield 暂停 |
| next(g) | 4 | 在第三次 yield 暂停 |
| next(g) | StopIteration | 继续执行到函数返回 |

最后一次产出并不等于调用者已经观察到结束。for 循环会在正常耗尽时处理 StopIteration；手写 next 可以使用默认值来避免此异常。

## 实验代码

```python
def squares():
    for i in range(3):
        print("compute", i)
        yield i * i
g = squares()
print("created")
print(next(g))
print(list(g))
print(list(g))
```

预期顺序：created、compute 0、0、compute 1、compute 2、`[1,4]`、`[]`。第二次 list(g) 没有重新从头计算。若需要再次遍历，应调用 squares() 创建新对象，或明确保存之前的结果。

## 常见追问

列表与它的迭代器是同一个吗？list 可多次 iter 得到独立迭代器，迭代器自身 iter(iterator) 通常返回自己。生成器表达式会延迟后续计算，但最外层 iterable 的求值发生在创建时，不应背成“一切都完全延后”。资源放进生成器时要考虑提前停止消费如何清理，不能只依赖调用者一定迭代到结束。生成器中主动让 StopIteration 逃出可能转为 RuntimeError，正常结束应 return。

## 选择题

一个生成器已经全部消费完，再 list(g) 通常得到什么？

A. 原结果的复制

B. 空列表

C. 自动重新执行函数

D. 必定抛 TypeError

**答案：B。** 同一迭代器已经耗尽，A/C 错在自动重放假设；生成器本来支持迭代，D 错。重新调用生成器函数是创建新的迭代过程。

## 参考

- [Python：迭代器类型](https://docs.python.org/3/library/stdtypes.html#iterator-types)
- [Python：yield 表达式](https://docs.python.org/3/reference/expressions.html#yield-expressions)
