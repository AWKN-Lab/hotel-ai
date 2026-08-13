(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const state={
  mode:'investment',stage:'data',
  project:{name:'厦门海湾城际酒店（演示）',city:'厦门',rooms:80,type:'接手 + 翻牌评估'},
  data:{occ:.68,adr:328,rentRatio:.29,otaRatio:.64,laborRatio:.23,annualRent:2380000,renovation:4200000,brandFee:.052},
  conversations:[
    {id:'goai',title:'GOAI 酒店投融尽调',active:true},
    {id:'rent',title:'租金与改造预算讨论'},
    {id:'channel',title:'渠道结构与直销提升'}
  ]
};

const welcome=`来了？酒店行业进入下半场，我们只谈生存和盈利逻辑。\n\n我是程掌柜，帮你拆穿品牌方测算单里的注水项，看清真实回本周期。\n\n600万在广州投酒店，说实话不算宽裕，得卡准位置和档次才活得下去。\n\n你现在是有具体物业在看，还是还在扫盘阶段？告诉我你现在手里有什么，我帮你做判断。`;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(n){return new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0}).format(n);}
function pct(n){return (n*100).toFixed(1)+'%';}
function roomRevenue(occ=state.data.occ,adr=state.data.adr){return state.project.rooms*365*occ*adr;}
function revpar(){return state.data.occ*state.data.adr;}
function scenarios(){
  const variants=[{name:'乐观',occ:.76,adr:355,cost:.43},{name:'基准',occ:.70,adr:338,cost:.47},{name:'压力',occ:.60,adr:305,cost:.52}];
  return variants.map(v=>{const revenue=roomRevenue(v.occ,v.adr);const ebitda=revenue*(1-v.cost-state.data.brandFee)-state.data.annualRent;return{...v,revenue,ebitda,roi:ebitda/state.data.renovation,payback:ebitda>0?state.data.renovation/ebitda*12:null};});
}
function risks(){return[
  {level:'danger',title:'租金承压',text:`当前租金占收入约 ${pct(state.data.rentRatio)}，超过演示风控规则 25% 警戒线。`,source:'租赁摘要.pdf → 年租金 / 经营底稿收入'},
  {level:'warning',title:'渠道依赖偏高',text:`OTA 占比 ${pct(state.data.otaRatio)}，获客成本与平台议价风险偏高。`,source:'OTA渠道月报.xlsx → 渠道结构'},
  {level:'warning',title:'改造预算敏感',text:`改造预算 ${money(state.data.renovation)}，回收期对入住率和 ADR 提升较敏感。`,source:'翻牌改造预算.xlsx → CAPEX'}
];}

function renderConversations(){
  $('#conversation-list').innerHTML=state.conversations.map(c=>`<button class="conversation-item ${c.active?'active':''}" data-conversation="${c.id}"><i class="fa fa-comment-o"></i><span>${esc(c.title)}</span></button>`).join('');
  $$('.conversation-item').forEach(btn=>btn.onclick=()=>{
    state.conversations.forEach(c=>c.active=c.id===btn.dataset.conversation);
    renderConversations();
    if(btn.dataset.conversation==='goai'){resetChat();return;}
    clearChat();
    appendAssistant(btn.dataset.conversation==='rent'?'这条对话聚焦租赁条款和改造投入。当前最值得先核验的是租金递增、免租期、品牌费用叠加和 CAPEX 漏项。':'渠道结构里先看 OTA 依赖、协议客户、会员直销和获客成本。演示项目 OTA 占比 64%，属于需要重点压降的变量。');
  });
}

function msgHtml(role,text){
  const safe=esc(text).replace(/\n/g,'<br>');
  if(role==='user')return `<div class="message-row user"><div class="message-bubble">${safe}</div><div class="message-avatar">你</div></div>`;
  return `<div class="message-row assistant"><div class="message-avatar">程</div><div class="message-bubble"><div class="message-meta">程掌柜 · 酒店投资经营军师</div>${safe}</div></div>`;
}
function appendAssistant(text){$('#chat-history').insertAdjacentHTML('beforeend',msgHtml('assistant',text));scrollChat();}
function appendUser(text){$('#chat-history').insertAdjacentHTML('beforeend',msgHtml('user',text));scrollChat();}
function clearChat(){$('#chat-history').innerHTML='';$('.quick-prompts')?.remove();}
function renderQuickPrompts(){
  const html=`<div class="quick-prompts">
    <button class="quick-prompt" data-prompt="把这个项目的关键风险给我">看关键风险</button>
    <button class="quick-prompt" data-prompt="给我看乐观基准压力三情景">看三情景</button>
    <button class="quick-prompt" data-prompt="最后给我30 60 90天行动计划">看行动计划</button>
  </div>`;
  $('#chat-history').insertAdjacentHTML('afterend',html);
  $$('.quick-prompt').forEach(b=>b.onclick=()=>handleChat(b.dataset.prompt));
}
function resetChat(){clearChat();appendAssistant(welcome);renderQuickPrompts();}
function scrollChat(){const el=$('#chat-scroll');requestAnimationFrame(()=>el.scrollTop=el.scrollHeight);}

function replyFor(text){
  if(/风险|尽调|判断/.test(text)){
    setMode('investment');setStage('diagnosis');openWorkspaceMobile();
    return `我先给结论：这个项目可以继续尽调，当前先放在“研究池”。\n\n三个高影响变量要先核验：年租金 238 万、OTA 占比 64%、改造预算 420 万。租金压力已经触发演示风控线。右侧“诊断”页已经打开，风险都带来源。`;
  }
  if(/情景|测算|回本|ROI|方案/.test(text)){
    setMode('investment');setStage('plan');openWorkspaceMobile();
    const base=scenarios()[1];
    return `三情景已经重算。基准情景 ROI 约 ${pct(base.roi)}，静态回收约 ${base.payback?base.payback.toFixed(1)+' 个月':'无法回收'}。先看成立条件，再决定是否进入下一轮投资评审。`;
  }
  if(/30|60|90|行动|报告|结论/.test(text)){
    setMode('investment');setStage('conclusion');openWorkspaceMobile();
    return `我把结论收敛成 30 / 60 / 90 天动作了：30 天核验底稿，60 天验证经营改善，90 天用真实参数重跑模型。高风险结论仍保留人工复核门禁。`;
  }
  if(/经营|入住|ADR|RevPAR|OTA/.test(text)){
    setMode('operation');setStage('diagnosis');openWorkspaceMobile();
    return `经营侧先看四个数：入住率 ${pct(state.data.occ)}、ADR ${money(state.data.adr)}、RevPAR ${money(revpar())}、OTA 占比 ${pct(state.data.otaRatio)}。右侧经营分析已经切到诊断视图。`;
  }
  return `我按这个项目的现有底稿继续拆。你可以让我直接看“关键风险”“三情景”或“30/60/90 天行动计划”。公开 Demo 使用模拟数据，所有结论都保留证据和人工复核边界。`;
}
function handleChat(text){
  const value=String(text||'').trim();if(!value)return;
  appendUser(value);$('#user-input').value='';$('#dock-count').textContent='0/500';
  setTimeout(()=>appendAssistant(replyFor(value)),180);
}

function dataView(){return `
  <div class="ws-title-row"><div><div class="ws-kicker">Data & Evidence</div><div class="ws-title">资料与字段确认</div><div class="ws-desc">模拟资料沿用正式产品的“来源 → 标准字段 → 人工确认 → 快照”路径。</div></div><span class="status-chip ok"><i class="fa fa-check-circle"></i> 6/6 已加载</span></div>
  <div class="file-list">
    ${[['经营月报.xlsx','12 个经营字段','ok'],['OTA渠道月报.xlsx','渠道结构已识别','ok'],['租赁摘要.pdf','租金递增需复核','warn'],['品牌合作方案.pdf','综合费率已提取','ok'],['翻牌改造预算.xlsx','CAPEX 敏感项','warn'],['物业信息.pdf','基础信息完整','ok']].map(f=>`<div class="file-row"><div class="file-icon"><i class="fa fa-file-o"></i></div><div><div class="file-name">${f[0]}</div><div class="file-meta">模拟脱敏资料 · Evidence 已建立</div></div><span class="status-chip ${f[2]==='ok'?'ok':'warn'}">${f[1]}</span></div>`).join('')}
  </div>
  <div class="ws-card soft" style="margin-top:10px"><div class="ws-card-head"><h4>高影响字段确认</h4><span class="status-chip warn">人工确认</span></div>
    <table class="field-table"><thead><tr><th>字段</th><th>标准值</th><th>状态</th></tr></thead><tbody>
      <tr><td>客房数</td><td>80 间</td><td>已确认</td></tr><tr><td>年租金</td><td>${money(state.data.annualRent)}</td><td>待复核</td></tr><tr><td>改造预算</td><td>${money(state.data.renovation)}</td><td>已确认</td></tr><tr><td>品牌综合费率</td><td>${pct(state.data.brandFee)}</td><td>已确认</td></tr>
    </tbody></table>
  </div>
  <button class="ws-action" data-next-stage="diagnosis"><i class="fa fa-play"></i> 创建演示快照并运行诊断</button>`;}

function diagnosisView(){
  const rs=risks();return `
  <div class="ws-title-row"><div><div class="ws-kicker">Diagnosis</div><div class="ws-title">经营诊断与风险门</div><div class="ws-desc">确定性指标先计算，Agent 负责组织证据、解释冲突和给出追问。</div></div><span class="status-chip warn">需复核</span></div>
  <div class="metric-grid"><div class="metric"><div class="metric-label">入住率 OCC</div><div class="metric-value">${pct(state.data.occ)}</div><div class="metric-hint">PMS 月报</div></div><div class="metric"><div class="metric-label">ADR</div><div class="metric-value">${money(state.data.adr)}</div><div class="metric-hint">平均房价</div></div><div class="metric"><div class="metric-label">RevPAR</div><div class="metric-value">${money(revpar())}</div><div class="metric-hint">OCC × ADR</div></div><div class="metric"><div class="metric-label">OTA 占比</div><div class="metric-value">${pct(state.data.otaRatio)}</div><div class="metric-hint">渠道风险</div></div></div>
  <div class="gate-card"><div class="gate-top"><span class="gate-badge">研究池</span><strong>可继续尽调，暂缓进入投资候选池</strong></div><p>先核验租金承压、渠道依赖、改造预算三个变量，再复核项目可行性。</p></div>
  ${rs.map((r,i)=>`<div class="ws-card ${r.level}"><div class="ws-card-head"><h4>${r.title}</h4><span class="status-chip ${r.level}">${i===0?'高影响':'需关注'}</span></div><p>${r.text}</p><button class="evidence-btn" data-evidence="e${i}"><i class="fa fa-link"></i> 查看 Evidence Trace</button><div class="evidence-trace" id="e${i}"><strong>来源：</strong>${r.source}<br><strong>规则：</strong>${i===0?'rent_ratio > 25%':i===1?'ota_ratio > 55%':'capex > 4,000,000'}<br><strong>复核：</strong>公开 Demo 使用模拟数据，高风险输出需人工确认。</div></div>`).join('')}
  <div class="ws-card soft"><div class="ws-card-head"><h4>Agent 执行轨迹</h4><span class="status-chip ok">completed</span></div><div class="timeline"><div class="timeline-item"><strong>材料解析</strong><span>6 份资料 → 标准字段</span></div><div class="timeline-item"><strong>字段核验</strong><span>单位 / 周期 / 冲突 / 来源</span></div><div class="timeline-item"><strong>指标与风控规则</strong><span>RevPAR / 租金 / 渠道 / CAPEX</span></div><div class="timeline-item"><strong>风险研判</strong><span>Decision Gate + Evidence</span></div></div></div>
  <button class="ws-action" data-next-stage="plan">进入三情景方案</button>`;}

function planView(){const ss=scenarios();return `
  <div class="ws-title-row"><div><div class="ws-kicker">Scenario</div><div class="ws-title">乐观 / 基准 / 压力三情景</div><div class="ws-desc">保持正式 run 不变，在白名单变量范围内做演示推演。</div></div><span class="status-chip info">Preview</span></div>
  <div class="scenario-grid">${ss.map((s,i)=>`<div class="scenario ${i===1?'featured':''}"><div class="scenario-name">${s.name}情景</div><div class="scenario-value">${pct(s.roi)}</div><p>ROI<br>OCC ${pct(s.occ)}<br>ADR ${money(s.adr)}<br>${s.payback?'回收 '+s.payback.toFixed(1)+' 月':'不可回收'}</p></div>`).join('')}</div>
  <div class="ws-card warning"><div class="ws-card-head"><h4>敏感性判断</h4><span class="status-chip warn">高敏感</span></div><p>项目对入住率、ADR、租金和 CAPEX 同时敏感。乐观情景需要经营改善与渠道优化共同成立。</p><div class="source">Scenario Preview · 不覆盖正式历史运行</div></div>
  <div class="ws-card soft"><h4>基准情景成立条件</h4><p style="margin-top:6px">入住率稳定在 70% 左右；ADR 达到约 338 元；品牌费用维持当前假设；改造预算不得继续明显扩大。</p></div>
  <button class="ws-action" data-next-stage="conclusion">形成尽调结论</button>`;}

function conclusionView(){const base=scenarios()[1];return `
  <div class="ws-title-row"><div><div class="ws-kicker">Decision Bundle</div><div class="ws-title">尽调结论与行动计划</div><div class="ws-desc">结论、证据、条件、行动共享同一演示上下文。</div></div><span class="status-chip warn">条件推进</span></div>
  <div class="gate-card"><div class="gate-top"><span class="gate-badge">条件推进</span><strong>完成关键条款核验后再进入下一轮投资评审</strong></div><p>基准情景演示 ROI ${pct(base.roi)}。项目价值受租金、渠道结构和改造投入显著影响。</p></div>
  <div class="action-plan"><div class="action-box"><div class="action-day">30</div><strong>核验底稿</strong><p>租赁递增、品牌费叠加、改造漏项、真实渠道成本。</p></div><div class="action-box"><div class="action-day">60</div><strong>验证经营改善</strong><p>直销提升、OTA 降依赖、ADR 优化小规模验证。</p></div><div class="action-box"><div class="action-day">90</div><strong>重跑模型</strong><p>用核验后的租金、CAPEX、经营参数提交人工评审。</p></div></div>
  <div class="ws-card soft" style="margin-top:10px"><div class="ws-card-head"><h4>证据索引</h4><span class="status-chip ok">可追溯</span></div><p>租赁摘要.pdf · OTA渠道月报.xlsx · 翻牌改造预算.xlsx · PMS经营月报 · 风控规则 · 三情景参数</p></div>
  <button class="ws-action secondary" id="export-report-btn"><i class="fa fa-download"></i> 导出 Demo 报告</button>
  <div class="ws-card soft" style="margin-top:9px"><p><strong>边界声明：</strong>输出用于经营与投资风险辅助研判，不能替代投资人及专业机构的最终判断。</p></div>`;}

function operationView(){
  if(state.stage==='data')return `<div class="ws-title-row"><div><div class="ws-kicker">Operation</div><div class="ws-title">经营分析资料</div><div class="ws-desc">沿用当前项目的经营底稿与已确认字段。</div></div><span class="status-chip ok">已同步</span></div>${dataView().replace('资料与字段确认','经营资料与字段确认')}`;
  if(state.stage==='diagnosis')return `<div class="ws-title-row"><div><div class="ws-kicker">Health Check</div><div class="ws-title">六维经营体检</div><div class="ws-desc">收入、成本、租金、渠道、产品、物业。</div></div><span class="status-chip warn">2 项重点</span></div><div class="metric-grid"><div class="metric"><div class="metric-label">OCC</div><div class="metric-value">${pct(state.data.occ)}</div></div><div class="metric"><div class="metric-label">ADR</div><div class="metric-value">${money(state.data.adr)}</div></div><div class="metric"><div class="metric-label">RevPAR</div><div class="metric-value">${money(revpar())}</div></div><div class="metric"><div class="metric-label">OTA</div><div class="metric-value">${pct(state.data.otaRatio)}</div></div></div><div class="ws-card warning"><h4>收入与渠道</h4><p style="margin-top:6px">入住率尚可，OTA 依赖偏高，增量更适合来自直销和协议客结构改善。</p></div><div class="ws-card danger"><h4>租金承受力</h4><p style="margin-top:6px">租金占比 29%，经营改善需要先覆盖固定成本压力。</p></div><button class="ws-action" data-next-stage="plan">查看经营改善方案</button>`;
  if(state.stage==='plan')return `<div class="ws-title-row"><div><div class="ws-kicker">Action</div><div class="ws-title">经营改善方案</div></div><span class="status-chip info">3 项</span></div><div class="ws-card"><h4>渠道结构</h4><p style="margin-top:6px">把 OTA 占比从 64% 分阶段压到 55% 以下，优先验证会员直销和协议客户。</p></div><div class="ws-card"><h4>ADR 策略</h4><p style="margin-top:6px">用周末/节假日需求分层测试价格带，避免单纯降价换入住率。</p></div><div class="ws-card"><h4>成本门禁</h4><p style="margin-top:6px">租金、人工、品牌费用按月跟踪，任何新增 CAPEX 必须进入投资回收重算。</p></div><button class="ws-action" data-next-stage="conclusion">形成经营结论</button>`;
  return `<div class="ws-title-row"><div><div class="ws-kicker">Operation Diagnosis</div><div class="ws-title">经营诊断结论</div><div class="ws-desc">把经营问题按影响与可执行性排序，形成改善动作和复盘指标。</div></div><span class="status-chip warn">3 项优先问题</span></div><div class="gate-card"><div class="gate-top"><span class="gate-badge" style="background:var(--warning)">诊断完成</span><strong>当前经营核心问题：渠道依赖偏高 + 固定成本承压 + 价格提升空间未充分验证</strong></div><p>经营改善先处理影响最大的变量，再用实际经营数据验证动作效果。</p></div><div class="action-plan"><div class="action-box"><div class="action-day">30</div><strong>定位问题</strong><p>拆渠道成本、客源结构、租金和人工，建立经营基线。</p></div><div class="action-box"><div class="action-day">60</div><strong>执行改善</strong><p>测试直销、协议客和 ADR 策略，按周跟踪指标变化。</p></div><div class="action-box"><div class="action-day">90</div><strong>复盘验证</strong><p>回填 OCC、ADR、RevPAR、OTA、利润率，验证动作是否有效。</p></div></div><div class="ws-card soft" style="margin-top:9px"><h4>复盘指标</h4><p style="margin-top:6px">OCC · ADR · RevPAR · OTA 占比 · 获客成本 · 租金占比 · 人工成本率 · GOP/经营利润。</p></div>`;
}

function renderWorkspace(){
  const box=$('#workspace-content');
  box.innerHTML=state.mode==='operation'?operationView():state.stage==='data'?dataView():state.stage==='diagnosis'?diagnosisView():state.stage==='plan'?planView():conclusionView();
  $$('.stage-tab').forEach(b=>b.classList.toggle('active',b.dataset.stage===state.stage));
  $$('.workspace-mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.workspaceMode===state.mode));
  $$('.workspace-entry-btn').forEach(b=>b.classList.toggle('active',b.dataset.workspace===state.mode));
  $$('[data-next-stage]',box).forEach(b=>b.onclick=()=>setStage(b.dataset.nextStage));
  $$('.evidence-btn',box).forEach(b=>b.onclick=()=>$('#'+b.dataset.evidence)?.classList.toggle('open'));
  const exportBtn=$('#export-report-btn');if(exportBtn)exportBtn.onclick=exportReport;
}
function setStage(stage){state.stage=stage;renderWorkspace();}
function setMode(mode){state.mode=mode==='operation'?'operation':'investment';renderWorkspace();}

function exportReport(){
  const base=scenarios()[1];const text=`# 程掌柜·酒店投融尽调 Agent — Demo 报告\n\n项目：${state.project.name}\n城市：${state.project.city}\n客房：${state.project.rooms} 间\n\n## 决策门\n条件推进 / 研究池\n\n## 关键风险\n- 租金承压：${pct(state.data.rentRatio)}\n- OTA 依赖：${pct(state.data.otaRatio)}\n- 改造预算：${money(state.data.renovation)}\n\n## 基准情景\n- ROI：${pct(base.roi)}\n- 静态回收：${base.payback?base.payback.toFixed(1)+' 个月':'不可回收'}\n\n## 30/60/90\n30天核验底稿；60天验证经营改善；90天重跑投资模型。\n\n> 本报告使用模拟数据，仅用于经营与投资风险辅助研判。`;
  const blob=new Blob([text],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='chengzhanggui-goai-demo-report.md';a.click();URL.revokeObjectURL(url);
}

function openWorkspaceMobile(){if(innerWidth>1023)return;$('#investment-workspace').classList.add('open');$('#mobile-workspace-overlay').classList.add('open');}
function closeWorkspaceMobile(){$('#investment-workspace').classList.remove('open');$('#mobile-workspace-overlay').classList.remove('open');}
function openSidebar(){$('#sidebar').classList.add('open');$('#sidebar-overlay').classList.add('open');}
function closeSidebar(){$('#sidebar').classList.remove('open');$('#sidebar-overlay').classList.remove('open');}
function setMobileTab(tab){$$('#mobile-bottom-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));}

function bind(){
  $('#chat-form').addEventListener('submit',e=>{e.preventDefault();handleChat($('#user-input').value);});
  $('#user-input').addEventListener('input',e=>$('#dock-count').textContent=`${e.target.value.length}/500`);
  $('#new-conversation-btn').onclick=()=>{state.conversations.forEach(c=>c.active=false);renderConversations();clearChat();appendAssistant(welcome);$('#user-input').focus();};
  $('#project-select').onchange=e=>{const demo=e.target.value==='goai';state.project.name=demo?'厦门海湾城际酒店（演示）':'默认项目';$('#workspace-project-name').textContent=state.project.name;};
  $$('.workspace-entry-btn').forEach(b=>b.onclick=()=>{setMode(b.dataset.workspace);openWorkspaceMobile();});
  $$('.workspace-mode-tab').forEach(b=>b.onclick=()=>setMode(b.dataset.workspaceMode));
  $$('.stage-tab').forEach(b=>b.onclick=()=>setStage(b.dataset.stage));
  $('#reset-demo-btn').onclick=resetDemo;
  $('#share-chat-btn').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);appendAssistant('当前 Demo 链接已经复制。评委打开后可以直接体验同一套工作台。');}catch(_){appendAssistant('当前页面就是公开 Demo 地址，可以直接复制浏览器地址分享。');}};
  $('#sidebar-toggle').onclick=openSidebar;$('#sidebar-close-btn').onclick=closeSidebar;$('#sidebar-overlay').onclick=closeSidebar;$('#mobile-workspace-overlay').onclick=closeWorkspaceMobile;
  $$('#mobile-bottom-tabs .tab-btn').forEach(b=>b.onclick=()=>{const tab=b.dataset.tab;setMobileTab(tab);if(tab==='chat'){closeWorkspaceMobile();closeSidebar();}else if(tab==='project'){closeWorkspaceMobile();openSidebar();}else{closeSidebar();setMode(tab==='operation'?'operation':'investment');openWorkspaceMobile();}});
  bindResizers();
}
function bindResizers(){
  $$('.resizer').forEach(r=>{r.addEventListener('pointerdown',e=>{if(innerWidth<=1023)return;e.preventDefault();r.setPointerCapture(e.pointerId);const side=r.dataset.side;const start=e.clientX;const root=document.documentElement;const current=parseInt(getComputedStyle(root).getPropertyValue(side==='left'?'--left-width':'--right-width'))|| (side==='left'?220:360);const move=ev=>{const delta=ev.clientX-start;let value=side==='left'?current+delta:current-delta;value=Math.max(side==='left'?180:300,Math.min(side==='left'?360:520,value));root.style.setProperty(side==='left'?'--left-width':'--right-width',value+'px');};const up=()=>{r.removeEventListener('pointermove',move);r.removeEventListener('pointerup',up);};r.addEventListener('pointermove',move);r.addEventListener('pointerup',up);});});
}
function resetDemo(){state.mode='investment';state.stage='data';state.conversations.forEach(c=>c.active=c.id==='goai');renderConversations();resetChat();renderWorkspace();closeWorkspaceMobile();setMobileTab('chat');}

renderConversations();resetChat();renderWorkspace();bind();
})();