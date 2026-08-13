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
  <div class="ws-title-row"><div><div class="ws-kicker">Data & Evidence</div><div class="ws-title">资料与奷段确认</div><div class="ws-desc">模拟资料沿用正式产品的“来源 → 标准字段 → 人工确认 → 快照”路径。</div></div><span class="status-chip ok"><i class="fa fa-check-circle"></i> 6/6 已加载</span></div>
  <div class="file-list">
    ${[['经营月报.xlsx','12 个经营字段','ok'],['OTA渠道月报.xlsx','渠道结构已识别','ok'],['租赁摘要.pdf','租金递增需复核','warn'],['品牌合作方案.pdf','综合费率已提取','ok'],['翻牌改造预算.xlsx','CAPEX 敏感项','warn'],['物业信息.pdf',基本信息完整','ok']].map(f=>`<div class="file-row"><div class="file-icon"><i class="fa fa-file-o"></i></div><div><div class="file-name">${f[0]}</div><div class="file-meta">模拟脱宁料… Evidence 已建立�r��z{^�Ǟv��&�y����