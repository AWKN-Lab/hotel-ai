/**
 * GOAI public demo enhancements.
 * Adds Agent trace, evidence drawer and report export without changing the core demo state.
 */
(function () {
  "use strict";

  const TRACE = [
    ["建立项目上下文", "Project Orchestrator", "项目参数与尽调目标"],
    ["材料解析与字段标准化", "Document Parser", "PMS / OTA / 租赁 / 品牌 / CAPEX"],
    ["经营指标计算", "Metric Engine", "OCC / ADR / RevPAR / 收入"],
    ["风险规则与证据绑定", "Risk Gate", "租金 / 渠道 / CAPEX"],
    ["情景推演", "Scenario Engine", "乐观 / 基准 / 压力"],
    ["报告与行动计划", "Report Agent", "结论 + 30 / 60 / 90 天"]
  ];

  const EVIDENCE = {
    "租金承压": {
      source: "租赁摘要.pdf + 经营月报.xlsx",
      field: "annual_rent / annual_room_revenue",
      rule: "risk.rent_ratio.warning",
      logic: "年租金 ÷ 年客房收入高于 25% 演示警戒线，进入高风险人工复核。"
    },
    "渠道依赖偏高": {
      source: "OTA渠道月报.xlsx",
      field: "ota_revenue_ratio",
      rule: "risk.channel.ota_dependency",
      logic: "OTA 收入占比高于 55%，提示获客成本与平台议价风险。"
    },
    "改造预算较重": {
      source: "改造预算.xlsx",
      field: "renovation_capex",
      rule: "risk.capex.heavy",
      logic: "改造投入超过 400 万元演示阈值，进入情景敏感性复核。"
    },
    "RevPAR": {
      source: "经营月报.xlsx",
      field: "occupancy × ADR",
      rule: "metric.revpar",
      logic: "入住率 × 平均房价 = RevPAR，由确定性指标引擎计算。"
    }
  };

  let decorating = false;

  function injectStyles() {
    if (document.getElementById("goai-plus-style")) return;
    const style = document.createElement("style");
    style.id = "goai-plus-style";
    style.textContent = `
      .gp-agent{margin-top:18px;border:1px solid #d9e4f0;background:#f8fbff;border-radius:14px;padding:16px}
      .gp-agent-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}
      .gp-agent-title{font-weight:800;color:#233d5b}.gp-badge{font-size:11px;color:#315c8c;background:#e5f0fd;border-radius:999px;padding:5px 9px}
      .gp-trace{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.gp-event{padding:10px;border-radius:10px;background:#eef3f8;color:#7890aa;min-height:82px}
      .gp-event.active{background:#e0edff;color:#164f91;box-shadow:inset 0 0 0 1px #bad5f8}.gp-event.done{background:#e9f7ee;color:#28704a}
      .gp-dot{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#d8e1eb;font-size:11px;font-weight:900;margin-bottom:7px}
      .gp-event.active .gp-dot{background:#1669d5;color:#fff}.gp-event.done .gp-dot{background:#2b8a57;color:#fff}
      .gp-event strong{display:block;font-size:12px}.gp-event small{display:block;font-size:10px;line-height:1.45;margin-top:4px;opacity:.86}
      .gp-evidence-btn{margin-top:10px;border:0;background:none;color:#1669d5;padding:0;font-weight:800;cursor:pointer}.gp-evidence-btn:hover{text-decoration:underline}
      .gp-drawer-bg{position:fixed;inset:0;background:rgba(11,28,48,.38);z-index:999;display:none;justify-content:flex-end}.gp-drawer-bg.open{display:flex}
      .gp-drawer{width:min(440px,92vw);height:100%;background:#fff;padding:24px;box-shadow:-16px 0 40px rgba(12,29,49,.2);overflow:auto}
      .gp-drawer-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;border-bottom:1px solid #e5edf5;padding-bottom:14px}
      .gp-drawer-head h3{margin:5px 0 0;font-size:22px}.gp-close{border:0;background:#eef3f8;border-radius:8px;width:34px;height:34px;font-size:22px;cursor:pointer}
      .gp-drawer dl{display:grid;grid-template-columns:100px 1fr;gap:12px;margin:20px 0}.gp-drawer dt{font-size:12px;font-weight:800;color:#60768f}
      .gp-drawer dd{margin:0;font-size:13px;line-height:1.6;color:#21364e}.gp-drawer code{background:#eef3f8;padding:3px 6px;border-radius:5px}
      .gp-note{background:#f5f8fc;border-radius:10px;padding:13px;color:#62778f;font-size:12px;line-height:1.65}
      .gp-export{background:#e6edf5!important;color:#203551!important}
      @media(max-width:900px){.gp-trace{grid-template-columns:repeat(3,1fr)}}@media(max-width:620px){.gp-trace{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function getStep() {
    const text = (document.getElementById("stepCounter") || {}).textContent || "1 / 6";
    const m = text.match(/^(\d+)/);
    return m ? Math.max(1, Math.min(6, Number(m[1]))) : 1;
  }

  function buildTrace(step) {
    const wrap = document.createElement("div");
    wrap.className = "gp-agent";
    wrap.dataset.goaiPlus = "trace";
    wrap.innerHTML = `
      <div class="gp-agent-head">
        <div><div class="section-kicker">AGENT TRACE</div><div class="gp-agent-title">可追溯执行链</div></div>
        <span class="gp-badge">确定性工具优先</span>
      </div>
      <div class="gp-trace">
        ${TRACE.map((item, i) => {
          const pos = i + 1;
          const cls = pos < step ? "done" : pos === step ? "active" : "";
          return `<div class="gp-event ${cls}">
            <span class="gp-dot">${pos < step ? "✓" : pos}</span>
            <strong>${item[0]}</strong><small>${item[1]} · ${item[2]}</small>
          </div>`;
        }).join("")}
      </div>`;
    return wrap;
  }

  function openEvidence(title) {
    const e = EVIDENCE[title];
    if (!e) return;
    let bg = document.getElementById("gpDrawerBg");
    if (!bg) {
      bg = document.createElement("div");
      bg.id = "gpDrawerBg";
      bg.className = "gp-drawer-bg";
      document.body.appendChild(bg);
    }
    bg.innerHTML = `<aside class="gp-drawer">
      <div class="gp-drawer-head"><div><div class="section-kicker">EVIDENCE TRACE</div><h3>${title}</h3></div><button class="gp-close" aria-label="关闭">×</button></div>
      <dl>
        <dt>来源</dt><dd>${e.source}</dd>
        <dt>字段 / 公式</dt><dd>${e.field}</dd>
        <dt>规则 ID</dt><dd><code>${e.rule}</code></dd>
        <dt>判定逻辑</dt><dd>${e.logic}</dd>
        <dt>复核状态</dt><dd>公开 Demo：模拟数据 / 人工复核语义</dd>
      </dl>
      <div class="gp-note">正式产品会继续保存文件位置、字段版本、人工确认、规则版本和审计记录。公开仓库仅保留可复现的演示证据结构。</div>
    </aside>`;
    bg.classList.add("open");
    bg.querySelector(".gp-close").onclick = () => bg.classList.remove("open");
    bg.onclick = ev => { if (ev.target === bg) bg.classList.remove("open"); };
  }

  function addEvidenceButtons(stage) {
    stage.querySelectorAll(".risk-card,.metric-card").forEach(card => {
      if (card.querySelector(".gp-evidence-btn")) return;
      const strong = card.querySelector("strong");
      if (!strong) return;
      const title = strong.textContent.trim();
      if (!EVIDENCE[title]) return;
      const btn = document.createElement("button");
      btn.className = "gp-evidence-btn";
      btn.textContent = title === "RevPAR" ? "查看计算证据" : "展开证据链";
      btn.onclick = () => openEvidence(title);
      card.appendChild(btn);
    });
  }

  function exportReport() {
    const stage = document.getElementById("stage");
    const reportText = stage ? stage.innerText.trim() : "";
    const content = `# 程掌柜 · Hotel AI Demo 报告

生成时间：${new Date().toLocaleString("zh-CN")}

${reportText}

---
边界声明：本报告由公开赛事 Demo 基于模拟数据生成，仅用于经营与投资风险辅助研判。
`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chengzhanggui-demo-report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function addExportButton(stage, step) {
    if (step !== 6 || stage.querySelector("#gpExport")) return;
    const actions = stage.querySelector(".actions");
    if (!actions) return;
    const btn = document.createElement("button");
    btn.id = "gpExport";
    btn.className = "secondary-btn gp-export";
    btn.textContent = "导出 Demo 报告";
    btn.onclick = exportReport;
    actions.insertBefore(btn, actions.lastElementChild);
  }

  function decorate() {
    if (decorating) return;
    const stage = document.getElementById("stage");
    if (!stage) return;
    decorating = true;
    try {
      injectStyles();
      const step = getStep();
      const oldTrace = stage.querySelector('[data-goai-plus="trace"]');
      if (oldTrace) oldTrace.remove();
      const actions = stage.querySelector(".actions");
      const trace = buildTrace(step);
      if (actions) stage.insertBefore(trace, actions);
      else stage.appendChild(trace);
      addEvidenceButtons(stage);
      addExportButton(stage, step);
    } finally {
      decorating = false;
    }
  }

  const observer = new MutationObserver(() => {
    window.clearTimeout(observer._t);
    observer._t = window.setTimeout(decorate, 0);
  });

  function init() {
    injectStyles();
    const stage = document.getElementById("stage");
    if (!stage) return;
    observer.observe(stage, { childList: true, subtree: true });
    const counter = document.getElementById("stepCounter");
    if (counter) observer.observe(counter, { childList: true, characterData: true, subtree: true });
    decorate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();