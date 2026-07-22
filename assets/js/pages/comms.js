/* Mobsie Connect — Communications: Messages, Newsletters, Push, SMS, Campaigns, Feedback */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN;

  /* ---------- Messages (chat) ---------- */
  const mState={active:0};
  Pages.messages={
    render(){
      const convs=DB.conversations;
      const c=convs[mState.active];
      return `
        ${UI.pageHead('Messages','Two-way chat between schools and families — synced with the parent app.',
          `<button class="btn btn-primary" id="newMsg">${MCIcon('plus')} New Message</button>`)}
        <div class="card"><div class="chat-layout">
          <div class="chat-list">${convs.map((cv,i)=>`
            <div class="chat-item ${i===mState.active?'on':''}" data-conv="${i}">
              ${UI.avatar(cv.who)}
              <div class="c-txt">
                <div class="c-top"><span class="c-nm">${esc(cv.who)}</span><span class="c-time">${cv.time}</span></div>
                <div class="c-prev">${esc(cv.preview)}</div>
              </div>
              ${cv.unread?`<span class="c-unread">${cv.unread}</span>`:''}
            </div>`).join('')}</div>
          <div class="chat-pane">
            <div class="chat-head">${UI.avatar(c.who)}
              <div><div style="font-weight:700;color:var(--ink-900)">${esc(c.who)}</div>
              <div class="small muted">${esc(c.school)} · ${esc(c.branch)}</div></div>
              <span style="margin-left:auto;display:flex;gap:6px">
                <button class="icon-btn">${MCIcon('phone')}</button>
                <button class="icon-btn">${MCIcon('info')}</button></span>
            </div>
            <div class="chat-msgs" id="chatMsgs">${c.msgs.map(m=>`
              <div class="msg ${m.dir}">${esc(m.text)}<span class="m-time">${m.time}</span></div>`).join('')}</div>
            <div class="chat-compose">
              <input id="chatInput" placeholder="Type a reply…">
              <button class="btn btn-primary" id="chatSend">${MCIcon('send')} Send</button>
            </div>
          </div>
        </div></div>`;
    },
    mount(root){
      root.querySelectorAll('[data-conv]').forEach(el=>el.addEventListener('click',()=>{
        mState.active=+el.dataset.conv;
        DB.conversations[mState.active].unread=0;
        document.getElementById('content').innerHTML=Pages.messages.render();
        UI.hydrate(); Pages.messages.mount(document.getElementById('content'));
      }));
      const send=()=>{
        const inp=root.querySelector('#chatInput');
        const txt=inp.value.trim(); if(!txt) return;
        const box=root.querySelector('#chatMsgs');
        box.insertAdjacentHTML('beforeend',`<div class="msg out">${esc(txt)}<span class="m-time">now</span></div>`);
        box.scrollTop=box.scrollHeight; inp.value='';
        setTimeout(()=>{box.insertAdjacentHTML('beforeend',`<div class="msg in">Thank you! 🙏<span class="m-time">now</span></div>`);box.scrollTop=box.scrollHeight;},900);
      };
      root.querySelector('#chatSend').addEventListener('click',send);
      root.querySelector('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter')send();});
      const box=root.querySelector('#chatMsgs'); box.scrollTop=box.scrollHeight;
      root.querySelector('#newMsg').addEventListener('click',()=>composeModal('Message'));
    }
  };

  function audienceFields(){
    return `<div class="field"><label>Send to</label>
      <select><option>Entire Platform</option><option>Specific School</option><option>Specific Branch</option><option>Specific Grade</option><option>Specific Class</option><option>Specific Parents</option><option>Specific Teachers</option></select></div>`;
  }
  function composeModal(kind){
    UI.modal({
      title:'New '+kind,
      body:`${audienceFields()}
        <div class="field"><label>${kind==='SMS'?'Message (160 chars)':'Subject'}</label><input type="text" placeholder="${kind==='SMS'?'Type your SMS…':'Subject line'}"></div>
        ${kind!=='SMS'?`<div class="field"><label>Message</label><textarea placeholder="Write your ${kind.toLowerCase()}…"></textarea></div>`:''}`,
      foot:`<button class="btn btn-ghost" data-x>Cancel</button>
            <button class="btn btn-ghost" data-d>${MCIcon('file')} Save Draft</button>
            <button class="btn btn-primary" data-s>${MCIcon('send')} Send</button>`,
      mount(r,close){
        r.querySelector('[data-x]').addEventListener('click',close);
        r.querySelector('[data-d]').addEventListener('click',()=>{close();UI.toast(kind+' saved to drafts');});
        r.querySelector('[data-s]').addEventListener('click',()=>{close();UI.toast(kind+' queued for delivery 🎉');});
      }
    });
  }

  /* ---------- Newsletters ---------- */
  Pages.newsletters={
    render(){
      const tbl=UI.table({
        pageSize:8, rows:DB.newsletters,
        columns:[
          {key:'title',label:'Newsletter',render:r=>`<div class="cell-main">${esc(r.title)}</div><div class="cell-sub">${esc(r.audience)}</div>`},
          {key:'sent',label:'Sent'},
          {key:'recipients',label:'Recipients',num:true,render:r=>r.recipients?F(r.recipients):'—'},
          {key:'openRate',label:'Open rate',render:r=>r.status==='Draft'?'—':`<div style="display:flex;align-items:center;gap:10px;min-width:130px"><span class="meter purple"><i style="width:${r.openRate}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.openRate}%</b></div>`},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
          {label:'',sortable:false,render:()=>`<button class="icon-btn">${MCIcon('chevRight')}</button>`},
        ],
      });
      return `
        ${UI.pageHead('Newsletters','Beautiful branded newsletters delivered to the app and inbox.',
          `<button class="btn btn-purple" id="newNl">${MCIcon('plus')} Compose Newsletter</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'newsletters',tint:'t-purple',label:'Sent This Term',value:'42',deltaHtml:UI.delta(8,'up','vs last term')})}
          ${UI.statCard({icon:'eye',tint:'t-blue',label:'Avg Open Rate',value:'67%',deltaHtml:UI.delta(3.1,'up','vs last term')})}
          ${UI.statCard({icon:'parents',tint:'t-green',label:'Subscribers',value:F(DB.totals.parents),deltaHtml:`<span class="delta flat">auto-synced with parents</span>`})}
          ${UI.statCard({icon:'star',tint:'t-amber',label:'Best Performer',value:'81%',deltaHtml:`<span class="delta flat">Sports Day — Hebron</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>All newsletters</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){ root.querySelector('#newNl').addEventListener('click',()=>composeModal('Newsletter')); }
  };

  /* ---------- Push notifications ---------- */
  Pages.push={
    render(){
      const tbl=UI.table({
        pageSize:8, rows:DB.pushLog,
        columns:[
          {key:'title',label:'Notification',render:r=>`<div class="cell-main">${esc(r.title)}</div><div class="cell-sub">${esc(r.audience)}</div>`},
          {key:'time',label:'Sent'},
          {key:'delivered',label:'Delivered',num:true,render:r=>F(r.delivered)},
          {key:'opened',label:'Opened',num:true,render:r=>`${F(r.opened)} <span class="muted">(${Math.round(r.opened/r.delivered*100)}%)</span>`},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      return `
        ${UI.pageHead('Push Notifications','Instant alerts straight to parents\' phones.',
          `<button class="btn btn-primary" id="newPush">${MCIcon('push')} Send Push</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'push',tint:'t-orange',label:'Sent This Month',value:F(214),deltaHtml:UI.delta(12,'up','vs April')})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Delivery Rate',value:'99.2%',deltaHtml:`<span class="delta flat">18.5K devices</span>`})}
          ${UI.statCard({icon:'eye',tint:'t-purple',label:'Avg Open Rate',value:'71%',deltaHtml:UI.delta(2.4,'up','vs April')})}
          ${UI.statCard({icon:'zap',tint:'t-blue',label:'Avg Delivery Time',value:'1.8s',deltaHtml:`<span class="delta flat">platform-wide</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>Recent notifications</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){ root.querySelector('#newPush').addEventListener('click',()=>composeModal('Push Notification')); }
  };

  /* ---------- SMS ---------- */
  Pages.sms={
    render(){
      const tbl=UI.table({
        pageSize:8, rows:DB.smsLog,
        columns:[
          {key:'to',label:'Audience',render:r=>`<span class="cell-main">${esc(r.to)}</span>`},
          {key:'msg',label:'Message',render:r=>`<span style="white-space:normal;display:block;max-width:380px">${esc(r.msg)}</span>`},
          {key:'time',label:'Sent'},
          {key:'count',label:'Recipients',num:true,render:r=>F(r.count)},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      return `
        ${UI.pageHead('SMS','For urgent word — reaches every phone, app or no app.',
          `<button class="btn btn-ghost" id="buyCred">${MCIcon('plus')} Buy Credits</button>
           <button class="btn btn-primary" id="newSms">${MCIcon('sms')} Send SMS</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'sms',tint:'t-blue',label:'Credits Remaining',value:F(48210),deltaHtml:`<span class="delta flat">≈ 2.5 platform sends</span>`})}
          ${UI.statCard({icon:'send',tint:'t-orange',label:'Sent This Month',value:F(12904),deltaHtml:UI.delta(4,'down','app adoption rising')})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Delivery Rate',value:'98.7%',deltaHtml:`<span class="delta flat">1 carrier degraded</span>`})}
          ${UI.statCard({icon:'wallet',tint:'t-purple',label:'Cost This Month',value:'R3,871',deltaHtml:`<span class="delta flat">R0.30 / message</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>SMS log</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){
      root.querySelector('#newSms').addEventListener('click',()=>composeModal('SMS'));
      root.querySelector('#buyCred').addEventListener('click',()=>UI.toast('Credit top-up flow opens billing'));
    }
  };

  /* ---------- Email campaigns ---------- */
  Pages.campaigns={
    render(){
      const tbl=UI.table({
        pageSize:8, rows:DB.campaigns,
        columns:[
          {key:'name',label:'Campaign',render:r=>`<div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.subject)}</div>`},
          {key:'audience',label:'Audience'},
          {key:'sent',label:'Sent',num:true,render:r=>F(r.sent)},
          {key:'openRate',label:'Opens',render:r=>`<div style="display:flex;align-items:center;gap:10px;min-width:120px"><span class="meter purple"><i style="width:${r.openRate}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.openRate}%</b></div>`},
          {key:'clickRate',label:'Clicks',num:true,render:r=>r.clickRate+'%'},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      return `
        ${UI.pageHead('Email Campaigns','Marketing and engagement campaigns with real funnel numbers.',
          `<button class="btn btn-purple" id="newCamp">${MCIcon('campaigns')} New Campaign</button>`)}
        <div class="grid" style="grid-template-columns:1.5fr 1fr;margin-bottom:20px" id="campTop">
          ${UI.card('Campaign funnel — 2027 Enrolment Drive',Charts.funnel({stages:[
            {label:'Delivered',value:12408},{label:'Opened',value:5832},{label:'Clicked',value:1489},
            {label:'Started application',value:406},{label:'Applied',value:158}],
            ramp:['#4C1D95','#6D28D9','#7C3AED','#8B5CF6','#A78BFA']}),{sub:'Running · updated 5 min ago'})}
          ${UI.card('Engagement over time',`
            ${UI.legend([{color:'#7C3AED',label:'Open rate',line:true}])}
            <div class="chart-box" style="margin-top:6px">${Charts.line({labels:['Jan','Feb','Mar','Apr','May'],series:[{name:'Open rate',color:'#7C3AED',data:[48,52,55,61,64],fmt:v=>v+'%'}],height:196,money:false})}</div>`)}
        </div>
        <div class="card"><div class="card-head"><div><h3>All campaigns</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>
        <style>@media(max-width:1100px){#campTop{grid-template-columns:1fr}}</style>`;
    },
    mount(root){ root.querySelector('#newCamp').addEventListener('click',()=>composeModal('Campaign')); }
  };

  /* ---------- Feedback Centre ---------- */
  Pages.feedback={
    render(){
      const stars=n=>Array.from({length:5},(_,i)=>`<span style="color:${i<n?'var(--amber-500)':'var(--ink-200)'};width:14px;display:inline-block">${MCIcon('star')}</span>`).join('');
      return `
        ${UI.pageHead('Feedback Centre','What families are saying — routed to the right school automatically.',
          `<button class="select">${MCIcon('filter')} All topics ${MCIcon('chevDown')}</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'heart',tint:'t-pink',label:'CSAT Score',value:'4.6/5',deltaHtml:UI.delta(0.2,'up','vs last term').replace('0.2%','0.2')})}
          ${UI.statCard({icon:'feedback',tint:'t-orange',label:'New This Week',value:'86',deltaHtml:`<span class="delta flat">9 need response</span>`})}
          ${UI.statCard({icon:'clock',tint:'t-blue',label:'Avg Response Time',value:'4.2h',deltaHtml:UI.delta(12,'down','improving')})}
          ${UI.statCard({icon:'trendUp',tint:'t-green',label:'NPS',value:'+62',deltaHtml:`<span class="delta flat">world-class</span>`})}
        </div>
        <div class="grid cards-3">${DB.feedback.map(f=>`
          <div class="card" style="padding:18px">
            <div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
              ${UI.avatar(f.who)}
              <div style="min-width:0"><div style="font-weight:700;color:var(--ink-900);font-size:13.5px">${esc(f.who)}</div>
              <div class="small muted">${esc(f.school)}</div></div>
              <span style="margin-left:auto">${UI.status(f.status)}</span>
            </div>
            <div style="display:flex;gap:1px;margin-bottom:8px">${stars(f.rating)}</div>
            <p style="font-size:13.5px;color:var(--ink-700);line-height:1.55">“${esc(f.text)}”</p>
            <div class="divider" style="margin:12px 0 10px"></div>
            <div style="display:flex;align-items:center">
              ${UI.badge(f.topic,'purple')}
              <span class="small muted" style="margin-left:auto">${f.date}</span>
              <button class="btn btn-soft btn-sm" style="margin-left:10px" data-reply="${f.id}">Reply</button>
            </div>
          </div>`).join('')}</div>`;
    },
    mount(root){
      root.addEventListener('click',e=>{
        const b=e.target.closest('[data-reply]');
        if(b) UI.toast('Reply sent to the family via the app');
      });
    }
  };
})();
