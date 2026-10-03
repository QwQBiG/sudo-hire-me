---
slug: "linux-zombie-orphan"
title: "僵尸进程和孤儿进程有什么区别"
description: "分别改变父进程与子进程的退出顺序，理解等待退出状态、收养和僵尸不能继续执行。"
subject: "操作系统"
order: 226
minutes: 18
lab: "workbench"
objectives: ["区分退出未回收与父进程先退出", "解释 wait 的职责", "说明 kill 不等于回收僵尸"]
prerequisites: ["process-state-transitions"]
---

# 看谁先退出，再看有没有读取退出状态

## 面试回答

在 Linux 中，僵尸进程（Zombie Process）是子进程已经退出、父进程还没等待并读取其退出状态，内核仍保留用于回收的进程信息；它不再执行代码。孤儿进程（Orphan Process）是父进程先退出的子进程，子进程可以仍在运行，会被所在 PID 命名空间的 init 或合适的最近子进程收割者（Child Subreaper）收养。父进程应使用 wait/waitpid 等回收退出子进程；对僵尸发送信号不能代替读取退出状态。

## 两个顺序不能混为一谈

路径 A：子退出 → 保留退出码等信息 → 父调用 waitpid → 回收记录。中间未等待阶段是僵尸，通常已释放大部分运行资源，但仍占进程记录，积累过多会耗尽相关限制。

路径 B：父退出 → 活着的子被收养 → 子继续运行 → 子以后退出并由当前父回收。这段“父关系改变”是孤儿问题；它不意味着子立刻退出或成为僵尸。收养规则受 PID 命名空间与 subreaper 影响，不能无条件写“永远由宿主 PID 1 收养”。

## 实验代码

```c
#include <errno.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
int main(void) {
    pid_t pid=fork();
    if(pid<0) return 1;
    if(pid==0) _exit(7);
    int status;
    pid_t got;
    do { got=waitpid(pid,&status,0); } while(got<0 && errno==EINTR);
    if(got<0 || !WIFEXITED(status)) return 2;
    return WEXITSTATUS(status)==7 ? 0 : 3;
}
```

仅在 POSIX/Linux 环境执行，Windows 原生环境不直接支持 fork。正常路径程序退出码为 0；它及时回收孩子，没有故意制造长期僵尸。WEXITSTATUS 只能在 WIFEXITED 为真时读取，不能把原始 status 当子退出码。

## 面试追问

所有父进程都必须忙等吗？不用，阻塞等待、非阻塞 WNOHANG 或结合 SIGCHLD 的循环回收均可按需求设计；一次通知可能对应多个已退出子进程，别只回收一个就假设无剩余。init 是否保证某固定毫秒数回收？没有这样的统一时限；网页保留显式回收按钮用于理解状态，并非预测真实调度。

## 选择题

子进程已经退出但父尚未 wait，最准确的描述是？

A. 子仍占 CPU 执行循环

B. 子是僵尸，退出状态等待回收

C. 子一定是仍在运行的孤儿

D. kill 可以让父无需 wait

**答案：B。** A 错在已经退出，C 混淆父先退出与子先退出，D 混淆发送信号与回收记录。父子退出与等待是两个维度。

## 参考

- [Linux wait(2)：退出状态、僵尸与收养](https://man7.org/linux/man-pages/man2/wait.2.html)
