# 程掌柜 · Hotel AI

> **Chengzhanggui — Hotel Investment Due Diligence Agent**  
> GOAI 无界应用｜AI+金融｜酒店经营体检与投资风险辅助研判

《程掌柜》面向中小酒店投资人和经营者，把分散的经营、租赁、渠道、品牌和改造资料整理为可追溯的数据底稿，并完成经营诊断、投资风险提示、情景推演和行动计划交付。

本仓库是 GOAI 无界应用赛道的**公开可复现赛事 Demo**。页面沿用程掌柜真实产品 HATWIN 的三栏工作台逻辑，同时隔离账号、数据库、真实客户数据、密钥和私有生产服务。

## 链接

- GOAI 公开 Demo：https://awkn-lab.github.io/hotel-ai/
- 开源仓库：https://github.com/AWKN-Lab/hotel-ai
- 正式产品：https://awkn.cn/win/

## 当前公开 Demo 能力

### 输入与项目

- 项目档案与多轮对话
- 文本输入
- 浏览器语音转文字（Chrome / Edge）
- PDF / Excel / CSV / Word / TXT / JSON 等资料选择入口
- 一键加载 6 份脱敏演示材料

> 赛事公开版中的真实文件选择只保留在当前浏览器会话，不上传到生产服务器；真实生产环境的文档解析、数据库和模型服务未在本仓库公开。

### 投资分析

资料 → 诊断 → 方案 → 结论

- OCC / ADR / RevPAR 等确定性指标计算
- 租金、OTA 渠道、CAPEX 风险规则
- Decision Gate / Risk Gate 演示
- Evidence Trace 证据追溯
- 乐观 / 基准 / 压力三情景
- 30 / 60 / 90 天行动计划
- Demo 报告导出

### 经营分析

经营分析用于定位问题、解释影响、形成改善动作并复盘验证，避免使用投资决策状态词。

- 经营资料与字段确认
- OCC / ADR / RevPAR / OTA 等经营体检
- 渠道依赖、固定成本、价格策略问题诊断
- 改善优先级 P1 / P2
- 30 / 60 / 90 天改善计划
- OCC、ADR、RevPAR、OTA、获客成本、租金占比、人工成本率、GOP 等复盘指标

## Demo 主链

1. 点击输入框左侧“+” → **加载演示材料**
2. 在右侧“资料”查看 6 份脱敏材料和高影响字段
3. 创建演示快照并运行诊断
4. 在“诊断”查看风险门、关键风险和 Evidence Trace
5. 在“方案”比较乐观 / 基准 / 压力三情景
6. 在“结论”查看条件、证据和 30 / 60 / 90 天行动计划
7. 切换“经营分析”，演示经营问题诊断与改善闭环
8. 可使用麦克风说：`帮我看看这家酒店现在经营上最大的问题是什么？`

也可以直接输入：

- `把这个项目的关键风险给我`
- `给我看乐观基准压力三情景`
- `最后给我30 60 90天行动计划`
- `帮我诊断这家酒店的经营问题`

## 技术设计

生产系统采用“任务编排 + 确定性工具 + AI 推理 + 可信治理 + 数据审计”的分层思路：

```text
用户目标
  ↓
项目 / Session / Consent
  ↓
文件与标准字段
  ↓
Snapshot Gate
  ↓
经营诊断 / 指标引擎 / 规则
  ↓
Evidence / Conflict / Risk Gate
  ↓
Decision Gate / Human Review
  ↓
三情景推演
  ↓
报告 / Action / Review
```

核心原则：可计算、可验证的指标和规则优先使用确定性工具；大模型承担理解、归纳、解释和生成；高影响结论保留证据和人工复核边界。

## 本地运行

```bash
git clone https://github.com/AWKN-Lab/hotel-ai.git
cd hotel-ai
python -m http.server 8080
```

打开：

```text
http://localhost:8080/
```

无需账号、API Key 或数据库即可运行公开 Demo。

## 开源与生产边界

### 本仓库开源

- 赛事 Demo 页面与交互
- 确定性指标计算
- 风险规则示例
- Evidence Trace 展示
- 三情景推演
- 经营诊断演示
- 语音 / 文件输入的公开交互层
- GitHub Pages 部署配置
- README 与 MIT License

### 未包含

- 真实客户或酒店数据
- 生产数据库与账号体系
- API Key / 密钥
- 私有模型服务与商业 API 凭据
- 生产文档解析、OCR、RAG 服务
- 内部基础设施与审计数据库

商业模型或云服务如用于正式产品，将在赛事材料中说明调用方式、依赖边界和开源范围。

## 数据与金融边界

- 公开 Demo 使用模拟或脱敏演示数据，不代表任何真实酒店。
- 未经授权的个人信息、商业秘密和敏感材料不应上传。
- 关键结论展示字段、来源、公式或规则依据。
- 输出用于酒店经营与投资风险辅助研判，不构成投资、授信、法律、审计、税务或资产评估结论。
- 不提供收益保证，不执行自动签约、转账、贷款审批或其他真实交易。

## 项目结构

```text
hotel-ai/
├─ index.html
├─ styles.css
├─ app.js
├─ demo-enhancements.js
├─ .github/workflows/pages.yml
├─ README.md
└─ LICENSE
```

## GOAI 提交说明

初赛建议把本仓库作为“代码仓库”字段提交，并在作品附件 ZIP 中同时放入方案 PDF、技术架构、Demo 体验说明和本仓库源码副本。赛事附件不要只上传裸源码 ZIP。

## License

MIT
