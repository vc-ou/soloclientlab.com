# LeadRadar 试用与共创解锁规则

更新日期：2026-07-31

## 核心规则

LeadRadar 的早期产品验证分成两个发行通道，再叠加共创和付费试点：

- Public trial：面向独立站公开用户，用户自主安装，默认 7 天。
- Partner preview：面向线下洽谈和定向合作客户，不固定 7 天，以合作进度为准。
- Co-build access：当用户有明确配置和校准需求时进入，最长 30 天。
- Paid pilot：真实使用和反馈后进入付费试点讨论。

## Public trial：公开自助 7 天

触发条件：

- 用户从独立站产品页点击公开安装入口。
- 用户通过 Microsoft Edge Add-ons 安装扩展。
- 手动安装包只作为 Edge listing 未就绪时的备用路径。
- 扩展构建通道为 `public_trial`。

系统记录：

- 扩展本地 `productAccess` 状态。
- 扩展事件 `extension_installed`。
- 扩展事件 `trial_started`。
- 独立站事件 `trial_events.install_clicked`。

默认窗口：

- `trial_started_at`：首次安装或首次打开时间。
- `trial_ends_at`：开始时间 + 7 天。

原则：

- 用户不需要先提交邮箱。
- 用户不需要等待人工审核。
- 公开试用只适合可规模化的轻量入口。
- 到期后再引导用户申请 co-build / partner preview / paid pilot。

## Partner preview：线下合作预览

触发条件：

- 站主在线下或私下洽谈中向潜在客户提供安装包、专属链接或配置。
- access_type 为 `partner_preview`。
- 扩展构建通道为 `partner_preview`。

系统记录：

- `product_access_requests.access_type = partner_preview`
- `trial_events.partner_preview_requested`
- 扩展本地 `productAccess.distributionChannel = partner_preview`

默认窗口：

- 不设置固定 7 天到期。
- 试用周期跟随洽谈、客户反馈、规则校准和付费试点进度。

判断重点：

- 是否实际安装。
- 是否完成真实 TikTok 工作流测试。
- 是否产生 review / export / feedback。
- 是否进入共创配置或 paid pilot。

不应该做的事：

- 不把线下客户强制放进公开 7 天试用。
- 不因为时间到期打断正在推进的合作。
- 不为 partner preview 维护第二套产品代码。

## 最长 30 天共创解锁

触发条件：

- 用户选择 `co_build_access`。
- 用户提交 LeadRadar 共创配置表单。
- 配置里包含明确关键词、目标市场、能力范围或 lead 类型。

系统记录：

- `leadradar_configs`
- `trial_events.radar_config_started`
- `trial_events.radar_config_completed`
- `trial_events.keywords_added`

默认窗口：

- `co_build_unlock_ends_at`：请求时间 + 30 天

解锁不是自动承诺交付，而是允许进入人工校准：

- 关键词是否过宽。
- 哪些评论属于强信号。
- 哪些内容必须过滤。
- 是否需要 export / review 规则。

判断重点：

- 是否开始配置。
- 是否完成 review / export。
- 是否提交 calibration feedback。

## Paid pilot

Paid pilot 不是默认优先级。

只有当以下信号同时出现时，才进入 paid pilot 对话：

- 明确业务场景。
- 完成配置。
- 出现 review / export 或反馈。
- 用户愿意给出真实 workflow feedback。

记录事件：

- `trial_events.paid_pilot_requested`

## 不做的事

- 不把 demo click 当成 trial 成功。
- 不把 Product Access 当成付费意图。
- 不把 30 天共创写成自动承诺。
- 不用 newsletter / waitlist 作为主转化判断。
