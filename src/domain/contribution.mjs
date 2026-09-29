export const contributionCases = [
  {
    id: 'scope',
    title: '个人职责',
    prompt: '团队完成图表工具后，怎样说明自己的工作？',
    evidence: [
      { id: 'team', type: '团队结果', text: '团队完成数据导入、坐标轴、图例和导出。' },
      { id: 'mine', type: '个人改动', text: '你实现 CSV 解析的错误行反馈，并补充空文件测试。' },
      { id: 'other', type: '他人职责', text: '坐标轴和图例由其他成员实现。' },
    ],
    claims: [
      {
        id: 'all',
        text: '我独立实现了整个图表工具。',
        supported: false,
        evidence: ['team', 'other'],
        reason: '团队结果不能直接归为个人独立实现；坐标轴和图例有明确的其他负责人。',
      },
      {
        id: 'mine',
        text: '团队完成图表工具；我负责解析错误反馈和空文件测试。',
        supported: true,
        evidence: ['team', 'mine'],
        reason: '既交代团队结果，也把自己的动作限定在有证据的范围内。',
      },
      {
        id: 'none',
        text: '我只是看过项目代码，没有实际改动。',
        supported: false,
        evidence: ['mine'],
        reason: '这又低估了真实贡献：解析错误反馈与空文件测试是具体工作。',
      },
    ],
  },
  {
    id: 'result',
    title: '结果与测量',
    prompt: '补了错误输入测试，但没有性能基准，怎样表述结果？',
    evidence: [
      { id: 'tests', type: '已验证', text: '列数不匹配和空文件的预期行为已由回归测试覆盖。' },
      { id: 'benchmark', type: '未验证', text: '没有记录修改前后的耗时或峰值内存。' },
    ],
    claims: [
      {
        id: 'speed',
        text: '我让解析速度提高了 80%。',
        supported: false,
        evidence: ['benchmark'],
        reason: '没有基线和测量，就不能把猜测说成量化收益。',
      },
      {
        id: 'bounded',
        text: '我补了两类错误输入的回归测试；性能变化尚未测量。',
        supported: true,
        evidence: ['tests', 'benchmark'],
        reason: '陈述了已覆盖的行为，也明确了性能尚未验证。',
      },
      {
        id: 'nothing',
        text: '没测性能，所以这项工作没有任何可说的结果。',
        supported: false,
        evidence: ['tests'],
        reason: '性能不是唯一结果；测试覆盖的是可核实的行为变化。',
      },
    ],
  },
  {
    id: 'status',
    title: '上游状态',
    prompt: '补丁已提 PR、检查通过，但还在等待评审，怎样说明？',
    evidence: [
      { id: 'pr', type: '已完成', text: '拉取请求（Pull Request，PR）已提交，自动检查通过。' },
      { id: 'review', type: '待确认', text: '维护者尚未完成评审，也没有合并记录。' },
    ],
    claims: [
      {
        id: 'released',
        text: '这个修复已经正式发布。',
        supported: false,
        evidence: ['review'],
        reason: '评审未完成，不能从已提交推出已合并，更不能推出已发布。',
      },
      {
        id: 'pending',
        text: '我提交了补丁和测试，目前等待维护者评审。',
        supported: true,
        evidence: ['pr', 'review'],
        reason: '提交、检查和评审状态都与现有证据一致。',
      },
      {
        id: 'merged',
        text: '自动检查通过，所以补丁已经合并。',
        supported: false,
        evidence: ['pr', 'review'],
        reason: '自动检查通过与维护者合并是不同步骤。',
      },
    ],
  },
];

export function assessContribution(caseId, claimId) {
  const scene = contributionCases.find((item) => item.id === caseId);
  const claim = scene?.claims.find((item) => item.id === claimId);
  if (!claim) throw new RangeError('Unknown contribution claim');
  return { supported: claim.supported, evidence: claim.evidence, reason: claim.reason };
}
