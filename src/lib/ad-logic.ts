export interface MetricInput {
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
}

export interface ComputedMetrics {
  ctr: number | null; // 点击率 0-1
  cpc: number | null;
  acos: number | null; // 广告成本销售比 0-1
  roas: number | null;
}

export function computeMetrics(m: MetricInput): ComputedMetrics {
  return {
    ctr: m.impressions > 0 ? m.clicks / m.impressions : null,
    cpc: m.clicks > 0 ? m.spend / m.clicks : null,
    acos: m.sales > 0 ? m.spend / m.sales : null,
    roas: m.spend > 0 ? m.sales / m.spend : null,
  };
}

export function pct(v: number | null, digits = 1): string {
  return v === null ? "-" : `${(v * 100).toFixed(digits)}%`;
}

/** 规则引擎：广告优化建议（P1 版，P2 接入 LLM） */
export function suggestOptimization(m: MetricInput): string | null {
  const c = computeMetrics(m);
  if (c.acos !== null && c.acos > 0.4 && m.spend > 100) {
    return `ACOS ${pct(c.acos, 0)} 偏高：降低竞价或否定低效关键词`;
  }
  if (c.roas !== null && c.roas >= 4) {
    return `ROAS ${c.roas.toFixed(1)} 优秀：建议追加 10-20% 预算`;
  }
  if (c.ctr !== null && c.ctr < 0.003 && m.impressions > 1000) {
    return `CTR ${pct(c.ctr, 2)} 偏低：优化主图、标题或竞价`;
  }
  if (m.impressions < 500) {
    return "曝光不足：建议提高竞价或扩大关键词匹配范围";
  }
  return null;
}
