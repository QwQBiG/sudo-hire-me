---
slug: "promise-async"
title: "Promise 与 async/await"
description: "跟踪一次异步取成绩的成功和失败，理解返回值、暂停位置以及错误如何被接住。"
subject: "JavaScript 选修"
order: 206
minutes: 22
lab: "javascript"
objectives: ["区分 Promise 状态与结果", "推演 await 前后的执行顺序", "用 try/catch 处理被拒绝的 Promise"]
prerequisites: ["javascript-event-loop"]
---

# await：等待的是结果，不是整个页面

## 从零理解

Promise 是表示一次操作最终结果的对象。它有待定（pending）、兑现（fulfilled）和拒绝（rejected）三种状态。
兑现携带成功值，拒绝携带失败原因；兑现或拒绝后统称已敲定（settled），不能再换成另一种最终状态。
成功值可能是数字或对象，失败原因可以是任意值；通常使用 Error 对象保存可读错误信息。

异步函数（asynchronous function）用 `async` 声明，调用会返回一个 Promise。
函数正常 `return 80` 时，相应 Promise 以 80 兑现；没有处理的抛出错误会让它被拒绝。
`await` 取得成功值；如果等待的 Promise 被拒绝，则在 await 位置按抛错处理。
它暂停当前异步函数的后续部分，让外层代码继续，不会因此阻塞整个 JavaScript 执行线程。

本课只模拟取得成绩，不发送网络请求；成功值固定为 80，方便单独观察语言规则。
即使等待的 Promise 已经兑现，await 后面的代码仍然通过后续微任务继续，不会在当前位置同步穿过去。

## 实验代码

```javascript
async function readScore(valid) {
  console.log("start");
  const score = await Promise.resolve(80);
  if (!valid) {
    throw new Error("invalid student");
  }
  return score;
}

async function showScore() {
  try {
    const score = await readScore(true);
    console.log("score", score);
  } catch (error) {
    console.log("error", error.message);
  }
  console.log("done");
}

const task = showScore();
console.log("outside");
await task;
```

最后一行让实验外层异步执行也等待 task 完成；它不会取消已经输出的 outside。
`!valid` 表示对布尔值取反。`throw` 抛出错误，`try/catch` 包围可能失败的操作并处理错误。

## 逐步推演

### 第一步：调用函数，先执行同步部分

调用 showScore，进入 try，再调用 readScore(true)。readScore 立即打印 `start`。
这说明 async 函数并非从第一行就完全推迟执行；第一个 await 之前的代码会同步推进。

### 第二步：遇到 await，把后续执行暂时挂起

readScore 等待已兑现的 Promise，其返回的 Promise 此时还没有交出最终成绩。
showScore 又等待 readScore 的结果，因此也暂时挂起。
外层拿到代表 showScore 结果的 task，继续打印 `outside`。当前输出为 `start outside`。

### 第三步：恢复读取成绩的函数

到后续微任务检查点，readScore 的 score 得到 80。
valid 为 true，不进入抛错分支；`return score` 让 readScore 返回的 Promise 以 80 兑现。
返回给等待者的是这个成功值，不是控制台打印产生的文本。

### 第四步：恢复展示函数并完成

showScore 的 await 得到 80，打印 `score 80`，然后打印 `done`。
showScore 没有显式返回值，因此 task 最终以 `undefined` 兑现；外层 await 完成。
当前输出依次是 `start outside score 80 done`，但实际控制台按四行显示。

## 预期输出

```text
start
outside
score 80
done
```

这里没有时间测量，不应从微任务顺序推断某个操作用了多少毫秒。
Promise 状态是“这个操作完成没有”，输出内容是程序另外做的副作用，两者应分别跟踪。

## 改成失败路径

只把 `readScore(true)` 改为 `readScore(false)`。
readScore 恢复后抛出 Error，于是它返回的 Promise 被拒绝。
showScore 在 await 位置收到这个失败，进入 catch，预期输出变为：

```text
start
outside
error invalid student
done
```

catch 处理完错误后没有重新抛出，因此 showScore 继续打印 done，task 正常兑现。
如果希望把失败交给上层处理，可以在记录后再次 `throw error`，并确保上层也处理这次拒绝。
只写 `try { readScore(false); } catch (...) { ... }`，没有 await 或拒绝处理器，不能接住后来发生的 Promise 拒绝。

## 常见错误

- **调用 async 函数就直接得到成绩。** 得到的是 Promise，成功值需要通过 await 或 then 取得。
- **await 一定阻塞主线程。** 它挂起当前异步函数；函数中的耗时同步代码才可能占住执行线程。
- **Promise 被拒绝会自动重试。** 重试必须由应用明确编写，并考虑是否会重复产生业务操作。
- **catch 只是打印，错误仍必然向上传。** 没有重新抛错时，catch 可以把失败转为正常完成。
- **兑现和解析是完全相同的状态。** Promise 的解析过程还可能跟随另一个 Promise；判断最终结果应区分兑现、拒绝和待定。

## 面试回答

async 函数返回 Promise；await 暂停当前异步函数的后续执行，成功时取得值，拒绝时在该位置抛错。
异步函数仍会同步执行到首次挂起，不自动创建新线程，也不自动加速耗时计算。
使用 try/catch 包围实际 await 可以处理相应失败，是否继续向上传递取决于处理后是否重新抛错。

## 选择题

把实验中的 `readScore(true)` 改成 `readScore(false)`，保留 showScore 的 catch 后，哪项正确？

- A. 整个执行线程在 await 时停止，因此 outside 不会出现。
- B. catch 会打印错误，之后打印 done，task 可以正常兑现。
- C. readScore 内的 throw 会跳过所有 catch，直接终止浏览器。
- D. Promise 被拒绝后自动再次调用 readScore。

**答案：B。** await 把拒绝变成当前位置的抛错，catch 已处理它且没有重新抛出。A 混淆挂起与阻塞；C 忽略捕获路径；D 假设了不存在的自动重试。

## 面试追问

“return 一个数为什么调用方得到 Promise？”这是 async 函数的返回语义，调用方应等待其结果。
“两个互不依赖的请求必须依次 await 吗？”不必须，可以先发起再协调结果；要同时设计失败、取消与资源使用边界。
“async 函数里跑很大的同步循环会怎样？”循环仍占当前执行线程，写了 async 不会把它自动搬到工作线程。

## 官方参考

- [MDN：async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)，返回 Promise 与同步执行部分。
- [MDN：await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)，恢复时机与拒绝传播。
- [MDN：Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)，状态与解析语义。
