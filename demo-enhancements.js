(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const uploaded=[];
let recognition=null;
let recognizing=false;

function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function size(n){if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';return(n/1048576).toFixed(1)+' MB';}

function injectStyles(){
 const s=document.createElement('style');
 s.textContent=`
 .input-dock{position:relative}.attachment-menu{position:absolute;left:0;bottom:58px;width:228px;padding:8px;background:#fff;border:1px solid var(--line,#e1e7ee);border-radius:12px;box-shadow:0 14px 34px rgba(18,31,47,.16);z-index:90;display:none}.attachment-menu.open{display:block}.attachment-menu button{width:100%;display:flex;align-items:center;gap:10px;padding:10px 11px;border:0;background:transparent;border-radius:8px;text-align:left;color:var(--ink,#27384c);cursor:pointer;font-size:13px}.attachment-menu button:hover{background:var(--navy-soft,#eef4fb)}.attachment-menu i{width:16px;color:var(--navy,#173d6d)}
 .attachment-strip{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.attachment-chip{display:inline-flex;align-items:center;gap:6px;max-width:280px;padding:6px 9px;border:1px solid var(--line,#e1e7ee);border-radius:8px;background:#fff;font-size:12px;color:var(--ink,#27384c)}.attachment-chip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.attachment-chip button{border:0;background:none;color:#8996a5;cursor:pointer;font-size:16px;line-height:1}
 .voice-status-demo{display:none;align-items:center;gap:7px;margin-bottom:7px;font-size:12px;color:var(--muted,#7c8999)}.voice-status-demo.show{display:flex}.voice-status-demo.recording{color:#bd4e4e}.voice-dot{width:8px;height:8px;border-radius:50%;background:currentColor;animation:voicePulse 1.1s infinite}@keyframes voicePulse{50%{transform:scale(1.6);opacity:.45}}.dock-icon-btn.recording{background:#fff0f0!important;color:#bd4e4e!important}
 .demo-upload-row{outline:1px dashed rgba(23,61,109,.22);outline-offset:-1px}.operation-priority-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.operation-priority{padding:11px;border:1px solid var(--line,#e1e7ee);border-radius:9px;background:#fff}.operation-priority b{display:block;font-size:12px;margin-bottom:4px}.operation-priority span{font-size:12px;color:var(--muted,#7c8999)}
 @media(max-width:767px){.attachment-menu{position:fixed;left:12px;right:12px;bottom:78px;width:auto}.operation-priority-grid{grid-template-columns:1fr}}
 `;
 document.head.appendChild(s);
}

function assistant(text){
 const history=$('#chat-history');if(!history)return;
 const row=document.createElement('div');row.className='message-row assistant';
 row.innerHTML='<div class="message-avatar">程</div><div class="message-bubble"><div class="message-meta">程掌柜 · 酒店投资经营军师</div>'+esc(text)+'</div>';
 history.appendChild(row);const sc=$('#chat-scroll');if(sc)requestAnimationFrame(()=>sc.scrollTop=sc.scrollHeight);
}

function renderAttachments(){
 const box=$('#attachment-strip');if(!box)return;
 box.innerHTML=uploaded.map((f,i)=>`<div class="attachment-chip"><i class="fa fa-paperclip"></i><span title="${esc(f.name)}">${esc(f.name)}</span><small>${size(f.size||0)}</small><button type="button" data-remove="${i}" aria-label="移除">×</button></div>`).join('');
 $$('[data-remove]',box).forEach(b=>b.onclick=()=>{uploaded.splice(Number(b.dataset.remove),1);renderAttachments();patchUploadRows();});
}

function patchUploadRows(){
 const list=$('#workspace-content .file-list');if(!list)return;
 $$('.demo-upload-row',list).forEach(n=>n.remove());
 uploaded.slice().reverse().forEach(f=>{
   const row=document.createElement('div');row.className='file-row demo-upload-row';
   row.innerHTML=`<div class="file-icon"><i class="fa fa-cloud-upload"></i></div><div><div class="file-name">${esc(f.name)}</div><div class="file-meta">本次上传 · ${size(f.size||0)} · 当前浏览器会话</div></div><span class="status-chip info">${f.demo?'已解析演示':'待解析确认'}</span>`;
   list.insertBefore(row,list.firstChild);
 });
}

function openData(){
 const inv=$('.workspace-mode-tab[data-workspace-mode="investment"]');if(inv)inv.click();
 const data=$('.stage-tab[data-stage="data"]');if(data)data.click();
 setTimeout(patchUploadRows,50);
}

function addFiles(files){
 const arr=Array.from(files||[]);if(!arr.length)return;
 arr.forEach(f=>{if(!uploaded.some(x=>x.name===f.name&&x.size===f.size))uploaded.push({name:f.name,size:f.size||0,type:f.type||'',demo:false});});
 renderAttachments();openData();assistant(`收到 ${arr.length} 份资料，已经挂到当前演示项目。你可以在右侧“资料”查看，然后继续创建快照、运行诊断。公开 Demo 不上传到服务器，文件只在当前浏览器会话中处理。`);
}

function loadDemoFiles(){
 const names=['经营月报.xlsx','OTA渠道月报.xlsx','租赁摘要.pdf','品牌合作方案.pdf','翻牌改造预算.xlsx','物业信息.pdf'];
 names.forEach((name,i)=>{if(!uploaded.some(x=>x.name===name))uploaded.push({name,size:(i+1)*183000,demo:true});});
 renderAttachments();openData();assistant('已加载 6 份脱敏演示材料。右侧资料页可以查看字段确认，再运行诊断。');
}

function setupUpload(){
 const plus=$('.dock-plus-btn'),menu=$('#attachment-menu'),input=$('#demo-file-input');if(!plus||!menu||!input)return;
 plus.onclick=e=>{e.stopPropagation();menu.classList.toggle('open');menu.setAttribute('aria-hidden',menu.classList.contains('open')?'false':'true');};
 document.addEventListener('click',e=>{if(!menu.contains(e.target)&&e.target!==plus){menu.classList.remove('open');menu.setAttribute('aria-hidden','true');}});
 $('[data-attach="upload"]',menu).onclick=()=>{menu.classList.remove('open');input.click();};
 $('[data-attach="demo"]',menu).onclick=()=>{menu.classList.remove('open');loadDemoFiles();};
 $('[data-attach="project"]',menu).onclick=()=>{menu.classList.remove('open');loadDemoFiles();assistant('已从当前项目档案选择已有材料。演示版用脱敏材料替代真实客户文件。');};
 input.onchange=()=>{addFiles(input.files);input.value='';};
}

function voiceStatus(text,on){
 const box=$('#voice-status-demo');if(!box)return;
 box.className='voice-status-demo show'+(on?' recording':'');box.innerHTML=`<span class="voice-dot"></span><span>${esc(text)}</span>`;
 if(!on)setTimeout(()=>{if(!recognizing)box.className='voice-status-demo';},2200);
}

function setupVoice(){
 const btn=$('.dock-icon-btn');const input=$('#user-input');if(!btn||!input)return;
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 btn.onclick=()=>{
   if(!SR){voiceStatus('当前浏览器不支持语音转写，请使用 Chrome / Edge。',false);return;}
   if(recognizing){recognition&&recognition.stop();return;}
   recognition=new SR();recognition.lang='zh-CN';recognition.interimResults=true;recognition.continuous=false;
   let finalText='';
   recognition.onstart=()=>{recognizing=true;btn.classList.add('recording');voiceStatus('正在听，请说出酒店情况或问题…',true);};
   recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=t;else interim+=t;}input.value=(finalText||interim).slice(0,500);$('#dock-count').textContent=input.value.length+'/500';};
   recognition.onerror=e=>voiceStatus(e.error==='not-allowed'?'麦克风权限未开启，请允许浏览器使用麦克风。':'语音识别暂时不可用，请重试。',false);
   recognition.onend=()=>{recognizing=false;btn.classList.remove('recording');voiceStatus(input.value?'语音已转成文字，可检查后发送。':'语音输入已结束。',false);};
   recognition.start();
 };
}

function patchOperationConclusion(){
 const operation=$('.workspace-mode-tab[data-workspace-mode="operation"]');
 const conclusion=$('.stage-tab[data-stage="conclusion"]');
 const box=$('#workspace-content');
 if(!operation||!conclusion||!box||!operation.classList.contains('active')||!conclusion.classList.contains('active'))return;
 if(box.dataset.operationFixed==='1')return;
 box.dataset.operationFixed='1';
 box.innerHTML=`
 <div class="ws-title-row"><div><div class="ws-kicker">Operation Diagnosis</div><div class="ws-title">经营诊断结论</div><div class="ws-desc">把经营问题按影响与可执行性排序，形成改善动作和复盘指标。</div></div><span class="status-chip warn">3 项优先问题</span></div>
 <div class="gate-card"><div class="gate-top"><span class="gate-badge" style="background:var(--warning)">诊断完成</span><strong>当前经营核心问题：渠道依赖偏高 + 固定成本承压 + 价格提升空间未充分验证</strong></div><p>经营改善先处理影响最大的变量，再用实际经营数据验证动作效果。</p></div>
 <div class="operation-priority-grid"><div class="operation-priority"><b>P1 渠道结构</b><span>OTA 64%，优先压降平台依赖，建立直销与协议客户增量。</span></div><div class="operation-priority"><b>P1 租金承受力</b><span>租金占比 29%，固定成本对利润弹性形成明显压力。</span></div><div class="operation-priority"><b>P2 ADR 优化</b><span>分日期、房型、客群验证价格带，避免单纯降价换入住率。</span></div></div>
 <div class="action-plan"><div class="action-box"><div class="action-day">30</div><strong>定位问题</strong><p>拆渠道成本、客源结构、租金和人工，建立经营基线。</p></div><div class="action-box"><div class="action-day">60</div><strong>执行改善</strong><p>测试直销、协议客和 ADR 策略，按周跟踪指标变化。</p></div><div class="action-box"><div class="action-day">90</div><strong>复盘验证</strong><p>回填 OCC、ADR、RevPAR、OTA、利润率，验证动作是否有效。</p></div></div>
 <div class="ws-card soft" style="margin-top:9px"><h4>复盘指标</h4><p style="margin-top:6px">OCC · ADR · RevPAR · OTA 占比 · 获客成本 · 租金占比 · 人工成本率 · GOP/经营利润。</p></div>`;
}

function observeWorkspace(){
 const box=$('#workspace-content');if(!box)return;
 new MutationObserver(()=>{box.dataset.operationFixed='';setTimeout(()=>{patchOperationConclusion();patchUploadRows();},0);}).observe(box,{childList:true});
 document.addEventListener('click',()=>setTimeout(()=>{patchOperationConclusion();patchUploadRows();},20));
}

injectStyles();setupUpload();setupVoice();observeWorkspace();
setTimeout(()=>{patchOperationConclusion();patchUploadRows();},100);
})();
