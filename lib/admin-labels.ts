const adminLabels: Record<string, string> = {
  active: "活跃",
  archived: "已归档",
  bounced: "退信",
  canceled: "已取消",
  checklist: "清单",
  clustered: "已聚类",
  co_build_access: "共建访问",
  completed: "已完成",
  declined: "已拒绝",
  demo_open: "打开演示",
  draft: "草稿",
  expired: "已过期",
  external: "外部链接",
  failed: "失败",
  file: "文件",
  building: "开发中",
  digital_file: "数字文件",
  idea: "想法",
  manual_delivery: "人工交付",
  paused: "暂停",
  home: "首页",
  invited: "已邀请",
  lifetime_access: "终身访问",
  presale: "预售中",
  medium: "中",
  monthly_subscription: "月订阅",
  new: "新请求",
  newsletter_page: "订阅页",
  paid: "已付款",
  paid_pilot: "付费试点",
  paid_pilot_requested: "已请求付费试点",
  partner_preview: "合作预览",
  paypal: "PayPal",
  pending: "待确认",
  post: "文章",
  product_access: "商品访问",
  product_page_visit: "商品页访问",
  published: "已发布",
  raw: "原始",
  page: "页面",
  ready: "已准备好",
  refunded: "已退款",
  report: "报告",
  resource: "资源页",
  reviewed: "已复核",
  reviewing: "审核中",
  revoked: "已撤销",
  strong: "强",
  stripe: "Stripe",
  template: "模板",
  prompt_pack: "提示词包",
  service: "服务",
  trial_access: "试用访问",
  trial_access_requested: "试用访问请求",
  unsubscribed: "已退订",
  used_in_post: "已用于文章",
  waitlist: "候补/线索",
  weak: "弱"
};

const productLabels: Record<string, string> = {
  leadradar: "LeadRadar",
  "needradar-workflow-lab": "NeedRadar 工作流实验室"
};

const eventLabels: Record<string, string> = {
  calibration_feedback_submitted: "提交校准反馈",
  csv_exported: "导出 CSV",
  install_clicked: "点击安装",
  keywords_added: "添加关键词",
  monthly_subscription_checkout_started: "开始月订阅结账",
  partner_preview_requested: "请求合作预览",
  paypal_access_started: "开始 PayPal 付款",
  radar_config_completed: "完成雷达配置",
  radar_config_started: "开始雷达配置",
  review_completed: "完成评审"
};

export function formatAdminLabel(value?: string | null) {
  if (!value) return "—";
  return adminLabels[value] ?? eventLabels[value] ?? productLabels[value] ?? value;
}

export function formatProductLabel(value?: string | null) {
  if (!value) return "—";
  return productLabels[value] ?? value;
}
