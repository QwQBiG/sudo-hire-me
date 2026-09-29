export const schedulingJobs = ['A', 'B', 'C'];

export function simulateScheduling(bursts = [5, 2, 1], policy = 'rr', quantum = 2) {
  if (
    !Array.isArray(bursts) ||
    bursts.length !== 3 ||
    bursts.some((n) => !Number.isInteger(n) || n < 1 || n > 8)
  ) {
    throw new Error('三个任务的运行时间都必须是 1 到 8 的整数');
  }
  if (!['fcfs', 'rr'].includes(policy)) throw new Error('未知的调度策略');
  if (!Number.isInteger(quantum) || quantum < 1 || quantum > 4) {
    throw new Error('时间片必须是 1 到 4 的整数');
  }

  const remaining = [...bursts];
  const first = [null, null, null];
  const completion = [0, 0, 0];
  const queue = [0, 1, 2];
  const slices = [];
  let time = 0;

  while (queue.length) {
    const job = queue.shift();
    if (first[job] === null) first[job] = time;
    const duration = policy === 'rr' ? Math.min(remaining[job], quantum) : remaining[job];
    const start = time;
    time += duration;
    remaining[job] -= duration;
    if (remaining[job] === 0) completion[job] = time;
    else queue.push(job);
    slices.push({
      job: schedulingJobs[job],
      start,
      end: time,
      remaining: remaining[job],
      queue: queue.map((index) => schedulingJobs[index]),
    });
  }

  const metrics = schedulingJobs.map((job, index) => ({
    job,
    burst: bursts[index],
    first: first[index],
    completion: completion[index],
    turnaround: completion[index],
    waiting: completion[index] - bursts[index],
    response: first[index],
  }));
  return { slices, metrics, total: time };
}
