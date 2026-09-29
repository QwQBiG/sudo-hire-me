---
slug: "javascript-equality"
title: "JavaScript 相等与对象身份"
subject: "Web 与程序执行"
description: "比较数字、字符串与两个长得一样的对象，分清值转换和引用身份。"
order: 37
minutes: 16
lab: "javascript"
objectives: ["区分 === 与 == 的主要行为", "解释对象比较为什么看身份", "指出 NaN 和 Object.is 的特殊情况"]
prerequisites: ["javascript-values"]
---

# JavaScript 相等与对象身份

## 面试回答

JavaScript 的严格相等（Strict Equality，`===`）比较不同类型的操作数时直接为假；抽象相等（Abstract Equality，`==`）在某些不同类型之间执行转换，因此更容易误判。对两个对象，`===` 比较是否为同一个对象，而不是逐项比较内容。`NaN === NaN` 为假；需要判断 NaN 可用 `Number.isNaN`，需要区分正负零或把 NaN 视为相同值可了解 `Object.is`。面试中先说操作数类型，再说是否发生转换与对象身份。[MDN：Strict Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality)

## 先看类型，再看值

```text
1 === '1'       → false：number 与 string 类型不同
1 == '1'        → true：此例发生数值转换
0 === false     → false：number 与 boolean 类型不同
```

不要把 `==` 概括为“先把两边都转成字符串”或“总把两边转成数字”，抽象相等有分情况的规则；例如 `null == undefined` 是 true，却不是一个简单的统一数字转换示例。实际代码通常优先使用严格相等并显式转换需要转换的值。[MDN：Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality)

## 对象内容相同，不等于同一对象

分别创建的两个对象即使属性相同，也有不同身份。先预测下面六行输出，再运行检查。

## 实验代码

```javascript
console.log(1 === '1');
console.log(1 == '1');
const first = { score: 80 };
const second = { score: 80 };
const alias = first;
console.log(first === second);
console.log(first === alias);
console.log(NaN === NaN);
console.log(Object.is(NaN, NaN));
```

上面两个字面量各创建一个对象，因此 `first === second` 为 false；`alias` 保存同一个对象的引用，所以 `first === alias` 为 true。运行后六行布尔值依次应为 `false、true、false、true、false、true`。这不意味着对象内容永远不能比较；只是 `===` 不会替你做深层结构比较，若要比较内容需定义具体规则，例如是否关心属性顺序、数组元素、循环引用等。

## NaN 和正负零的边界

NaN 表示“不是一个数值结果”的特殊数字值，`typeof NaN` 仍是 `number`；它与自身的严格相等比较也为 false。`Object.is(NaN, NaN)` 为 true。另一个区别是 `0 === -0` 为 true，而 `Object.is(0, -0)` 为 false。不要因此在普通业务代码里一律改用 `Object.is`；应先明确需要哪种相等关系。[MDN：Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

## 在实验里检查

先运行默认代码并核对六行布尔值，再把 `alias = first` 改成 `alias = { score: 80 }`，预测第四行变化。代码实验在隔离环境中运行 JavaScript，不提供页面 DOM 或网络接口。

## 常见误区

- **“`===` 会比较对象所有属性。”** 它比较对象身份，两个分别创建的对象不相同。
- **“`==` 总是先转字符串。”** 转换规则依类型组合而变，不能用一条假规则覆盖所有情况。
- **“NaN 与自己相等，因为两个都是 NaN。”** 严格相等并不这么定义；用 `Number.isNaN` 判断。

## 选择题

执行 `const a={x:1}; const b=a; const c={x:1};` 后，哪一组表达式都为 true？

- A. `a === b` 与 `a === c`
- B. `a === b` 与 `a.x === c.x`
- C. `a === c` 与 `b === c`
- D. `a == c` 与 `b === c`

**答案：B。** `a`、`b` 指向同一对象；两个 `x` 都是数值 1。`c` 是另一个对象，`===` 和 `==` 对这两个对象都不会自动做内容比较。

## 参考资料

- [MDN：Strict Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality)
- [MDN：Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality)
