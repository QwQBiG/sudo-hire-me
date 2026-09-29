---
slug: "stack-valid-parentheses"
title: "栈判断括号是否匹配"
subject: "数据结构与算法"
description: "逐字符处理三种括号，看到为什么仅统计数量无法保证嵌套顺序正确。"
order: 68
minutes: 16
lab: "walkthrough"
objectives: ["用栈记录尚未闭合的左括号", "手算一组合法与非法嵌套", "处理空栈、剩余左括号和非法字符"]
prerequisites: ["stack-queue"]
---

# 栈判断括号是否匹配

## 先看失败的直觉

题目允许 `()`、`[]`、`{}` 三类括号，要求类型与嵌套顺序都匹配。`([{}])` 合法；`([)]` 含有相同数量的左右括号，却不合法，因为读到 `)` 时最近尚未闭合的是 `[`，不能越过它先关闭 `(`。

栈（Stack）的后进先出（Last In, First Out，LIFO）刚好记录“最近还没配对”的左括号。遇到左括号就入栈；遇到右括号时，栈顶必须是对应类型的左括号，然后弹栈。若栈空或类型不符，立即失败。全部字符读完后，栈也必须为空，否则还有未闭合括号。

## 逐步推演

### 读入圆括号和方括号

输入 `([{}])`，读到 `(` 后栈为 `[(]`；再读 `[` 后栈为 `[(,[]`，右侧是栈顶。还不能把 `(` 与未来的 `)` 直接配掉，因为 `[` 需要先闭合。

### 读入花括号

读 `{` 后栈为 `[(,[,{]`。栈顶 `{` 表示接下来若出现右括号，只有 `}` 可合法地关闭当前最内层。

### 读到右花括号

读 `}`，与栈顶 `{` 匹配并弹出；栈恢复为 `[(,[]`。没有必要回看之前的所有字符，栈已经保留了当前未闭合顺序。

### 读到右方括号

读 `]`，与栈顶 `[` 匹配并弹出；栈变为 `[(]`。若此处读到的是 `)`，就形成 `([)]` 中的错误：栈顶是 `[`，类型不符。

### 读到右圆括号并结束

读 `)` 与栈顶 `(` 匹配，弹栈后为空。已读完所有字符且栈空，返回合法。若输入改为 `([{}]`，结束时还留着 `(`，仍应返回不合法。

## 面试回答

从左到右扫描括号串，左括号入栈；右括号必须与当前栈顶的左括号类型对应，否则立刻失败，匹配后弹出。扫描结束且栈空才合法。每个字符最多入栈、出栈一次，时间 `O(n)`、最坏额外空间 `O(n)`。只有数量相等不够，栈检查的是后进先出的嵌套顺序；空串按这一判定规则是合法的。

## 多语言示例

两段程序都输出 `true false`：`([{}])` 合法，`([)]` 不合法。输入限定为六种括号字符；代码对其他字符显式返回不合法，不把它们悄悄当作括号处理。

### C++

```cpp
#include <iostream>
#include <string>

bool valid(const std::string& text) {
    std::string stack;
    for (char c : text) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push_back(c);
            continue;
        }
        char expected;
        if (c == ')') expected = '(';
        else if (c == ']') expected = '[';
        else if (c == '}') expected = '{';
        else return false;
        if (stack.empty() || stack.back() != expected) return false;
        stack.pop_back();
    }
    return stack.empty();
}

int main() {
    std::cout << std::boolalpha << valid("([{}])") << ' ' << valid("([)]") << '\n';
}
```

### Python 3

```python
def valid(text):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for char in text:
        if char in '([{':
            stack.append(char)
        elif char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
        else:
            return False
    return not stack

print(valid('([{}])'), valid('([)]'))  # True False
```

## 常见误区

- `([)]` 的左右数量分别相等，但最近未闭合的 `[` 与 `)` 不匹配。
- `)` 作为第一个字符时栈为空，不能先弹再检查。
- `((` 扫描过程没有冲突，但结束时栈非空，仍不合法。
- 若题目允许普通文字夹在括号之间，要明确是忽略还是拒绝；本课按“只有括号”的输入契约，其他字符拒绝。

## 选择题

扫描 `([)]`，在读到第三个字符 `)` 时，正确判断是什么？

- A. 合法，因为前面已有一个 `(`
- B. 不合法，因为栈顶是 `[`，而 `)` 需要 `(`
- C. 先把 `[` 暂时移走，配对 `(` 后再放回
- D. 等全串读完只检查左右数量

**答案：B。** 括号必须按嵌套顺序关闭。A、C 跳过了最近未闭合的方括号；D 只能检查数量，不能检查顺序。

## 参考资料

- [LeetCode 20：Valid Parentheses 的匹配条件与栈提示](https://leetcode.com/problems/valid-parentheses/)
