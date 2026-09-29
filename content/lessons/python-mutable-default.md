---
slug: "python-mutable-default"
title: "Python 默认列表为什么越调用越长"
description: "追踪函数定义时创建的一份默认列表与显式传入的新列表，推导多次调用的输出。"
subject: "Python 3 语言机制"
order: 186
minutes: 16
lab: "mutable-default"
objectives: ["指出默认值何时求值", "推导省略参数与显式传空列表的不同结果", "用 None 哨兵写出独立列表版本"]
prerequisites: ["function-arguments", "shallow-deep-copy"]
---

# Python 可变默认参数：同一份列表被谁复用

## 默认值不是每次调用都新建

以 Python 3 为范围，函数默认参数表达式在**定义函数时**求值，所得对象在省略该参数的后续调用中重复使用。列表（List）可变，若函数对这份默认列表做 `append`，变化会保留到下一次省略参数的调用。显式传入 `[]` 则是调用方在本次创建的新列表，不是那份默认对象。[Python 官方 FAQ：可变默认值](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects)

## 四次调用画出两条对象路径

```python
def add(x, acc=[]):
    acc.append(x)
    return list(acc)

print(add(1))       # [1]
print(add(2))       # [1, 2]
print(add(3, []))   # [3]
print(add(4))       # [1, 2, 4]
```

以上注释是按 Python 3 语义推得的预期输出。`return list(acc)` 复制返回值，免得已返回的列表后来又被改变；它**不改变**函数内部默认列表仍被复用的事实。第一、二、四次调用省略 `acc`，共用一份默认列表；第三次显式传 `[]`，只改本次的新列表。

| 调用 | 本次用的列表 | 本次返回 | 定义时的默认列表 |
| --- | --- | --- | --- |
| `add(1)` | 默认对象 | `[1]` | `[1]` |
| `add(2)` | 同一默认对象 | `[1, 2]` | `[1, 2]` |
| `add(3, [])` | 新列表 | `[3]` | `[1, 2]` |
| `add(4)` | 同一默认对象 | `[1, 2, 4]` | `[1, 2, 4]` |

## 想要每次独立，换成哨兵

```python
def add_fresh(x, acc=None):
    if acc is None:
        acc = []
    acc.append(x)
    return acc

print(add_fresh(1))  # [1]
print(add_fresh(2))  # [2]
```

`None` 是不可变哨兵（Sentinel）：本次未提供列表时，函数体内才新建一个列表。这里“省略参数”与“显式传 `None`”都使用新列表，这是该接口主动定义的语义；若两者必须区别，需要另设独立哨兵对象。[Python 官方教程：默认参数值](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)

## 面试回答

Python 默认参数在函数定义时求值一次，不是每次调用重新求值。若默认值是可变列表，省略参数的多次调用会共享并修改同一个对象，所以 `add(1)` 后 `add(2)` 可能得到 `[1,2]`；显式传 `[]` 则是新对象。希望每次调用独立时，通常用 `None` 作为默认值，在函数体内创建列表，并明确显式传 `None` 的含义。

## 错误反例

“`return list(acc)` 已修复默认参数问题”不成立。复制的是返回值，默认对象仍然会被下一次省略参数的调用继续修改。单次调用看上去正确，也不能证明不同调用没有共享状态。

## 选择题

上面 `add` 的前三次调用后，再执行 `add(4)`，返回什么？

- A. `[4]`
- B. `[1, 2, 3, 4]`
- C. `[1, 2, 4]`
- D. 抛出异常，因为显式传过 `[]`

**答案：C。** 第三次用的是独立新列表，不改变定义时的默认对象；第四次重用已含 1、2 的默认列表。A 忽略共享，B 错把第三次并入共享路径，D 没有相应错误规则。

## 参考资料

- [Python 官方 FAQ：默认值为什么在对象间共享](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects)
- [Python 官方教程：默认参数值](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)
