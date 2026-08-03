/* Mobsie Connect — Daily Activity
   Staff build the day here; it becomes the timeline parents see in the Mobsie
   mobile app. Left: the editor. Right: a live phone preview of the parent view. */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc;

  // Current editing context (campus · class · date)
  const S={
    branch:null,          // set on first render to the first live campus
    cls:'Nursery',
    date:'2026-08-03',
  };

  const kindOf=k=>DB.ACTIVITY_KINDS.find(x=>x.kind===k)||DB.ACTIVITY_KINDS[2];
  const TONE_HEX={green:'#16A34A',teal:'#0D9488',purple:'#7C3AED',orange:'#F97316',
    pink:'#DB2777',blue:'#2563EB'};
  const TONE_SOFT={green:'#DCFCE7',teal:'#CCFBF1',purple:'#EDE9FE',orange:'#FFEDD5',
    pink:'#FCE7F3',blue:'#DBEAFE'};

  const mins=t=>{const [h,m]=String(t||'0:0').split(':').map(Number);return h*60+(m||0);};
  const fmtDate=iso=>{
    const d=new Date(iso+'T00:00:00');
    return d.toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  };
  const shortDate=iso=>{
    const d=new Date(iso+'T00:00:00');
    return d.toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short'});
  };

  function ensureCtx(){
    const live=DB.liveBranches();
    if(!S.branch||!live.some(b=>b.name===S.branch)) S.branch=live[0]?live[0].name:'';
  }

  // The plan for the current campus/class/date — created on demand
  function currentPlan(create){
    let p=DB.dailyPlans.find(x=>x.branch===S.branch&&x.cls===S.cls&&x.date===S.date);
    if(!p&&create){
      p={id:'dp-'+Date.now(),date:S.date,branch:S.branch,cls:S.cls,status:'Draft',
        updatedBy:'Thandi Admin',updatedAt:'now',items:[]};
      DB.dailyPlans.push(p);
    }
    return p;
  }
  const sorted=items=>[...items].sort((a,b)=>mins(a.from)-mins(b.from));

  /* ---------- Parent-app phone preview ---------- */
  function phonePreview(plan){
    const items=plan?sorted(plan.items):[];
    // "Happening now" = the block containing 10:38 on the demo clock
    const NOW=10*60+38;
    const nowItem=items.find(i=>mins(i.from)<=NOW&&NOW<mins(i.to));
    const pct=nowItem?Math.round((NOW-mins(nowItem.from))/(mins(nowItem.to)-mins(nowItem.from))*100):0;

    return `
      <div class="mc-phone">
        <div class="mc-phone-screen">
          <div class="mc-ph-status"><span>10:39</span><span>${MCIcon('phone2')}</span></div>
          <div class="mc-ph-head">
            <span class="mc-ph-back">${MCIcon('chevLeft')}</span>
            <span class="mc-ph-title">Daily Activity</span>
            <span class="mc-ph-bell">${MCIcon('bell')}</span>
          </div>
          <div class="mc-ph-body">
            <div class="mc-ph-date">${esc(fmtDate(S.date))}</div>
            <div class="mc-ph-sub">Kendall Molefe · ${esc(S.cls)} · 10:38</div>

            ${nowItem?`
              <div class="mc-ph-now">
                <span class="mc-ph-now-dot"></span>
                <div style="flex:1;min-width:0">
                  <div class="mc-ph-now-lbl">HAPPENING NOW</div>
                  <div class="mc-ph-now-title">${esc(nowItem.title)}</div>
                  <div class="mc-ph-now-sub">${esc(S.cls)} · ${esc(nowItem.to)}</div>
                </div>
                <div class="mc-ph-now-pct">${pct}%</div>
              </div>`:''}

            ${items.length?`<div class="mc-ph-timeline">${items.map(it=>{
              const k=kindOf(it.kind);
              const isNow=nowItem&&nowItem.id===it.id;
              return `
              <div class="mc-ph-row">
                <div class="mc-ph-time">${esc(it.from)}</div>
                <div class="mc-ph-rail"><span class="mc-ph-node" style="background:${TONE_HEX[k.tone]}"></span></div>
                <div class="mc-ph-card ${isNow?'is-now':''}" style="background:${TONE_SOFT[k.tone]}">
                  <span class="mc-ph-ic" style="color:${TONE_HEX[k.tone]}">${MCIcon(k.icon)}</span>
                  <div style="min-width:0;flex:1">
                    <div class="mc-ph-card-title">${esc(it.title)}</div>
                    <div class="mc-ph-card-time">${esc(it.from)} – ${esc(it.to)}</div>
                    ${it.note?`<div class="mc-ph-card-note">${esc(it.note)}</div>`:''}
                  </div>
                  ${isNow?`<span class="mc-ph-nowtag">NOW</span>`:''}
                </div>
              </div>`;}).join('')}</div>`
            :`<div class="mc-ph-empty">${MCIcon('calendar')}<p>No activities yet.<br>Add blocks on the left — parents see them here.</p></div>`}
          </div>
          <div class="mc-ph-tabs">
            <span class="on">${MCIcon('dashboard')}<i>Home</i></span>
            <span>${MCIcon('calendar')}<i>Calendar</i></span>
            <span>${MCIcon('messages')}<i>Messages</i></span>
            <span>${MCIcon('parents')}<i>Profile</i></span>
          </div>
        </div>
      </div>`;
  }

  /* ---------- Editor rows ---------- */
  function editorRows(plan){
    const items=plan?sorted(plan.items):[];
    if(!items.length){
      return UI.empty('calendar','No activities for this day',
        'Add a block below, or load the standard day template to start in one click.');
    }
    return `<div class="da-list">${items.map((it,i)=>{
      const k=kindOf(it.kind);
      return `
      <div class="da-row" data-item="${it.id}">
        <span class="da-drag" title="Order follows start time">${MCIcon('drag')}</span>
        <span class="da-ic" style="background:${TONE_SOFT[k.tone]};color:${TONE_HEX[k.tone]}">${MCIcon(k.icon)}</span>
        <div class="da-txt">
          <div class="da-title">${esc(it.title)}</div>
          <div class="da-note">${it.note?esc(it.note):'<span class="muted">No description</span>'}</div>
        </div>
        <div class="da-time">${esc(it.from)} – ${esc(it.to)}</div>
        ${UI.badge(it.kind,k.tone)}
        <span class="da-acts">
          <button class="icon-btn" data-edit="${it.id}" aria-label="Edit">${MCIcon('edit')}</button>
          <button class="icon-btn" data-del="${it.id}" aria-label="Remove">${MCIcon('trash')}</button>
        </span>
      </div>`;}).join('')}</div>`;
  }

  /* ---------- Add / edit modal ---------- */
  function itemModal(existing){
    const plan=currentPlan(true);
    UI.modal({
      title:existing?'Edit Activity':'Add Activity',
      body:`
        <div class="form-row">
          <div class="field"><label>Activity type</label>
            <select data-f="kind">${DB.ACTIVITY_KINDS.map(k=>{
              const sel=existing?existing.kind===k.kind:k.kind==='Lesson';
              return `<option ${sel?'selected':''}>${k.kind}</option>`;}).join('')}</select>
            <div class="hint">Sets the colour and icon parents see.</div></div>
          <div class="field"><label>Title parents see</label>
            <input type="text" data-f="title" value="${existing?esc(existing.title):''}" placeholder="e.g. Morning Assembly"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Starts</label><input type="time" data-f="from" value="${existing?esc(existing.from):'09:00'}"></div>
          <div class="field"><label>Ends</label><input type="time" data-f="to" value="${existing?esc(existing.to):'10:00'}"></div>
        </div>
        <div class="field"><label>What happened / what to expect</label>
          <textarea data-f="note" placeholder="A short friendly line for parents — e.g. Counting objects from 1 to 20.">${existing?esc(existing.note||''):''}</textarea>
          <div class="hint">This is the sentence shown under the activity in the parent app.</div>
        </div>`,
      foot:`<button class="btn btn-ghost" data-x>Cancel</button>
            <button class="btn btn-primary" data-s>${existing?'Save Changes':'Add to Day'}</button>`,
      mount(r,close){
        r.querySelector('[data-x]').addEventListener('click',close);
        r.querySelector('[data-s]').addEventListener('click',()=>{
          const v=UI.formVals(r);
          if(!v.title){UI.toast('Give the activity a title first','alert');return;}
          if(mins(v.to)<=mins(v.from)){UI.toast('End time must be after the start time','alert');return;}
          if(existing){
            Object.assign(existing,{kind:v.kind,title:v.title,from:v.from,to:v.to,note:v.note});
            DB.log('Updated daily activity',v.title+' — '+S.branch+' · '+S.cls,'info');
          }else{
            plan.items.push({id:'da-'+Date.now(),kind:v.kind,title:v.title,from:v.from,to:v.to,note:v.note});
            DB.log('Added daily activity',v.title+' — '+S.branch+' · '+S.cls,'ok');
          }
          plan.status='Draft'; plan.updatedBy='Thandi Admin'; plan.updatedAt='now';
          close(); UI.toast(existing?'Activity updated':'Activity added to the day'); App.refresh();
        });
      }
    });
  }

  /* ---------- Page ---------- */
  function render(){
    ensureCtx();
    const plan=currentPlan(false);
    const items=plan?plan.items:[];
    const live=DB.liveBranches();
    const covered=DB.dailyPlans.filter(p=>p.date===S.date&&p.items.length).length;
    const published=DB.dailyPlans.filter(p=>p.date===S.date&&p.status==='Published').length;
    const totalClasses=live.length*DB.GRADES.length;
    const firstStart=items.length?sorted(items)[0].from:'—';
    const lastEnd=items.length?sorted(items)[items.length-1].to:'—';

    return `
      ${UI.pageHead('Daily Activity',
        'Build each class’s day here — it appears instantly in the parents’ Mobsie app.',
        `<button class="btn btn-ghost" id="daTemplate">${MCIcon('layers')} Load Standard Day</button>
         <button class="btn btn-ghost" id="daCopy">${MCIcon('copy')} Copy Yesterday</button>
         <button class="btn btn-primary" id="daPublish">${MCIcon('send')} Publish to Parents</button>`)}

      <div class="grid cards-4" style="margin-bottom:20px">
        ${UI.statCard({icon:'calendar',tint:'t-orange',label:'Activities Today',value:String(items.length),
          deltaHtml:`<span class="delta flat">${firstStart} – ${lastEnd}</span>`})}
        ${UI.statCard({icon:'check',tint:'t-green',label:'Classes Published',value:published+' / '+totalClasses,
          deltaHtml:`<span class="delta flat">${covered} started today</span>`})}
        ${UI.statCard({icon:'parents',tint:'t-blue',label:'Parents Reached',value:DB.fmtN(788),
          deltaHtml:`<span class="delta flat">across all campuses</span>`})}
        ${UI.statCard({icon:'eye',tint:'t-purple',label:'Avg Parent Views',value:'82%',
          deltaHtml:UI.delta(6,'up','vs last week')})}
      </div>

      <div class="toolbar">
        <button class="select" id="daBranch">${MCIcon('branches')} <span>${esc(S.branch)}</span> ${MCIcon('chevDown')}</button>
        <button class="select" id="daClass">${MCIcon('learners')} <span>${esc(S.cls)}</span> ${MCIcon('chevDown')}</button>
        <label class="select" style="gap:9px;cursor:default">${MCIcon('calendar')}
          <input type="date" id="daDate" value="${S.date}"
            style="border:0;outline:0;background:transparent;font:inherit;font-weight:600;color:var(--ink-700);cursor:pointer">
        </label>
        <span class="spacer"></span>
        ${plan?UI.status(plan.status):UI.badge('Not started','ink')}
        ${plan?`<span class="muted small">Updated by ${esc(plan.updatedBy)} · ${esc(plan.updatedAt)}</span>`:''}
      </div>

      <div class="grid" style="grid-template-columns:1.55fr 1fr;align-items:start" id="daWrap">
        <div class="card">
          <div class="card-head">
            <div><h3>${esc(shortDate(S.date))} — ${esc(S.cls)}</h3>
              <div class="sub">${esc(S.branch)} · times order the timeline automatically</div></div>
            <span class="spacer"></span>
            <button class="btn btn-primary btn-sm" id="daAdd">${MCIcon('plus')} Add Activity</button>
          </div>
          <div class="card-body">
            ${editorRows(plan)}
            <div class="divider"></div>
            <div class="da-quick">
              <span class="small muted" style="font-weight:600">Quick add:</span>
              ${DB.activityTemplates.slice(0,6).map((t,i)=>{
                const k=kindOf(t.kind);
                return `<button class="da-chip" data-tpl="${i}" style="border-color:${TONE_SOFT[k.tone]}">
                  <span style="color:${TONE_HEX[k.tone]}">${MCIcon(k.icon)}</span>${esc(t.title)}</button>`;}).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><div><h3>Parent app preview</h3>
            <div class="sub">Exactly what families see on their phone</div></div>
            <span class="spacer"></span>${UI.badge('Live','green')}</div>
          <div class="card-body" style="display:flex;justify-content:center">
            ${phonePreview(plan)}
          </div>
        </div>
      </div>

      <style>
        @media(max-width:1200px){#daWrap{grid-template-columns:1fr}}

        /* Editor list */
        .da-list{display:flex;flex-direction:column}
        .da-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line-soft)}
        .da-row:last-child{border-bottom:0}
        .da-drag{color:var(--ink-300);display:grid;place-items:center;flex-shrink:0}
        .da-drag svg{width:16px;height:16px}
        .da-ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0}
        .da-ic svg{width:19px;height:19px}
        .da-txt{min-width:0;flex:1}
        .da-title{font-weight:650;color:var(--ink-900);font-size:14px}
        .da-note{font-size:12.5px;color:var(--ink-500);margin-top:2px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px}
        .da-time{font-size:13px;font-weight:650;color:var(--ink-700);
          font-variant-numeric:tabular-nums;white-space:nowrap;flex-shrink:0}
        .da-acts{display:flex;gap:2px;flex-shrink:0}
        .da-quick{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .da-chip{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line);
          background:var(--card);border-radius:99px;padding:6px 13px;font-size:12.5px;
          font-weight:600;color:var(--ink-700);transition:background .12s ease,transform .05s ease}
        .da-chip:hover{background:var(--bg)}
        .da-chip:active{transform:translateY(1px)}
        .da-chip svg{width:14px;height:14px}

        /* Phone preview */
        .mc-phone{width:300px;border-radius:38px;padding:10px;background:var(--ink-900);
          box-shadow:var(--shadow-pop);flex-shrink:0}
        .mc-phone-screen{background:#FAF6F0;border-radius:29px;overflow:hidden;
          height:600px;display:flex;flex-direction:column}
        .mc-ph-status{display:flex;justify-content:space-between;align-items:center;
          padding:10px 18px 4px;font-size:11.5px;font-weight:700;color:var(--ink-800)}
        .mc-ph-status svg{width:14px;height:14px}
        .mc-ph-head{display:flex;align-items:center;gap:10px;padding:4px 16px 10px}
        .mc-ph-head svg{width:17px;height:17px;color:var(--ink-800)}
        .mc-ph-title{flex:1;text-align:center;font-weight:800;font-size:14.5px;color:#0B3B32}
        .mc-ph-body{flex:1;overflow-y:auto;padding:0 14px 12px}
        .mc-ph-date{font-size:19px;font-weight:800;color:#0B3B32;letter-spacing:-.02em;line-height:1.15}
        .mc-ph-sub{font-size:11px;color:var(--ink-500);margin:3px 0 12px}
        .mc-ph-now{display:flex;align-items:center;gap:10px;background:#E8F4FE;
          border:1.5px solid #BFE0FA;border-radius:16px;padding:11px 13px;margin-bottom:14px}
        .mc-ph-now-dot{width:14px;height:14px;border-radius:99px;background:#1FA0F0;
          box-shadow:0 0 0 3px #fff inset;flex-shrink:0}
        .mc-ph-now-lbl{font-size:8.5px;font-weight:800;letter-spacing:.09em;color:#1FA0F0}
        .mc-ph-now-title{font-size:14px;font-weight:800;color:#0B3B32;line-height:1.2}
        .mc-ph-now-sub{font-size:10.5px;color:var(--ink-500)}
        .mc-ph-now-pct{font-size:14px;font-weight:800;color:#1FA0F0;flex-shrink:0}
        .mc-ph-timeline{position:relative}
        .mc-ph-row{display:flex;align-items:stretch;gap:8px;margin-bottom:8px}
        .mc-ph-time{width:34px;flex-shrink:0;font-size:9.5px;font-weight:600;color:var(--ink-400);
          padding-top:14px;font-variant-numeric:tabular-nums}
        .mc-ph-rail{width:12px;flex-shrink:0;display:flex;justify-content:center;position:relative}
        .mc-ph-rail::before{content:'';position:absolute;top:0;bottom:-8px;width:3px;
          background:#22C55E;border-radius:2px}
        .mc-ph-node{position:relative;width:9px;height:9px;border-radius:99px;margin-top:16px;
          box-shadow:0 0 0 2px #FAF6F0}
        .mc-ph-card{flex:1;min-width:0;display:flex;align-items:flex-start;gap:9px;
          border-radius:14px;padding:10px 11px}
        .mc-ph-card.is-now{outline:2px solid #1FA0F0;outline-offset:-2px}
        .mc-ph-ic{flex-shrink:0}
        .mc-ph-ic svg{width:17px;height:17px}
        .mc-ph-card-title{font-size:12.5px;font-weight:800;color:#0B3B32;line-height:1.25}
        .mc-ph-card-time{font-size:10px;color:var(--ink-600);font-variant-numeric:tabular-nums;margin-top:1px}
        .mc-ph-card-note{font-size:10px;color:var(--ink-500);margin-top:3px;line-height:1.35}
        .mc-ph-nowtag{background:#1FA0F0;color:#fff;font-size:8px;font-weight:800;
          padding:3px 7px;border-radius:99px;flex-shrink:0;letter-spacing:.04em}
        .mc-ph-empty{text-align:center;padding:40px 12px;color:var(--ink-400)}
        .mc-ph-empty svg{width:26px;height:26px;margin:0 auto 8px}
        .mc-ph-empty p{font-size:11.5px;line-height:1.5}
        .mc-ph-tabs{display:flex;border-top:1px solid var(--line);background:#fff;
          padding:8px 4px 10px;flex-shrink:0}
        .mc-ph-tabs span{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;
          color:var(--ink-400)}
        .mc-ph-tabs span.on{color:#0B7A5F}
        .mc-ph-tabs svg{width:17px;height:17px}
        .mc-ph-tabs i{font-size:8.5px;font-style:normal;font-weight:600}
      </style>`;
  }

  function rerender(){ App.refresh(); }

  function mount(root){
    const plan=()=>currentPlan(false);

    // Context switchers
    root.querySelector('#daBranch').addEventListener('click',e=>{
      UI.menu(e.currentTarget,DB.liveBranches().map(b=>({label:b.name,icon:'branches',
        checked:S.branch===b.name,onClick:()=>{S.branch=b.name;rerender();}})),{head:'Campus',scroll:true});
    });
    root.querySelector('#daClass').addEventListener('click',e=>{
      UI.menu(e.currentTarget,DB.GRADES.map(g=>({label:g,icon:'learners',
        checked:S.cls===g,onClick:()=>{S.cls=g;rerender();}})),{head:'Class'});
    });
    root.querySelector('#daDate').addEventListener('change',e=>{
      if(e.target.value){ S.date=e.target.value; rerender(); }
    });

    // Add / edit / delete
    root.querySelector('#daAdd').addEventListener('click',()=>itemModal(null));
    root.addEventListener('click',e=>{
      const ed=e.target.closest('[data-edit]');
      if(ed){
        const p=plan(); const it=p&&p.items.find(x=>x.id===ed.dataset.edit);
        if(it) itemModal(it);
        return;
      }
      const del=e.target.closest('[data-del]');
      if(del){
        const p=plan(); if(!p) return;
        const i=p.items.findIndex(x=>x.id===del.dataset.del);
        if(i>=0){
          const [gone]=p.items.splice(i,1);
          p.status='Draft';
          DB.log('Removed daily activity',gone.title+' — '+S.branch+' · '+S.cls,'warn');
          UI.toast('“'+gone.title+'” removed from the day');
          rerender();
        }
        return;
      }
      const chip=e.target.closest('[data-tpl]');
      if(chip){
        const t=DB.activityTemplates[+chip.dataset.tpl];
        const p=currentPlan(true);
        p.items.push({id:'da-'+Date.now(),kind:t.kind,title:t.title,from:t.from,to:t.to,note:t.note});
        p.status='Draft'; p.updatedBy='Thandi Admin'; p.updatedAt='now';
        UI.toast(t.title+' added');
        rerender();
      }
    });

    // Load the full standard day
    root.querySelector('#daTemplate').addEventListener('click',()=>UI.modal({
      title:'Load Standard Day',
      body:`<p class="small muted" style="margin-bottom:12px">This fills
        <b>${esc(S.cls)}</b> at <b>${esc(S.branch)}</b> for
        <b>${esc(shortDate(S.date))}</b> with the standard ${DB.activityTemplates.length}-block day.
        Anything already on the day is replaced.</p>
        <div class="da-quick">${DB.activityTemplates.map(t=>{
          const k=kindOf(t.kind);
          return `<span class="da-chip" style="cursor:default"><span style="color:${TONE_HEX[k.tone]}">${MCIcon(k.icon)}</span>${esc(t.title)}</span>`;
        }).join('')}</div>`,
      foot:`<button class="btn btn-ghost" data-x>Cancel</button>
            <button class="btn btn-primary" data-s>${MCIcon('layers')} Load Day</button>`,
      mount(r,close){
        r.querySelector('[data-x]').addEventListener('click',close);
        r.querySelector('[data-s]').addEventListener('click',()=>{
          const p=currentPlan(true);
          p.items=DB.activityTemplates.map((t,i)=>({id:'da-'+Date.now()+'-'+i,
            kind:t.kind,title:t.title,from:t.from,to:t.to,note:t.note}));
          p.status='Draft'; p.updatedBy='Thandi Admin'; p.updatedAt='now';
          DB.log('Loaded standard day',S.branch+' · '+S.cls+' · '+S.date,'ok');
          close(); UI.toast('Standard day loaded — review, then publish'); rerender();
        });
      }
    }));

    // Copy the previous day's plan for this class
    root.querySelector('#daCopy').addEventListener('click',()=>{
      const prev=new Date(S.date+'T00:00:00'); prev.setDate(prev.getDate()-1);
      const iso=prev.toISOString().slice(0,10);
      const src=DB.dailyPlans.find(x=>x.branch===S.branch&&x.cls===S.cls&&x.date===iso&&x.items.length);
      if(!src){ UI.toast('Nothing saved for '+shortDate(iso)+' to copy','alert'); return; }
      const p=currentPlan(true);
      p.items=src.items.map((t,i)=>({...t,id:'da-'+Date.now()+'-'+i}));
      p.status='Draft'; p.updatedBy='Thandi Admin'; p.updatedAt='now';
      DB.log('Copied daily plan',shortDate(iso)+' → '+shortDate(S.date),'info');
      UI.toast('Copied '+src.items.length+' activities from '+shortDate(iso));
      rerender();
    });

    // Publish → parents get a push notification
    root.querySelector('#daPublish').addEventListener('click',()=>{
      const p=plan();
      if(!p||!p.items.length){ UI.toast('Add at least one activity before publishing','alert'); return; }
      p.status='Published'; p.updatedBy='Thandi Admin'; p.updatedAt='now';
      const br=DB.branches.find(b=>b.name===S.branch);
      DB.pushLog.unshift({title:'Today’s activities are ready 📅',
        audience:S.branch+' · '+S.cls,time:'Just now',
        delivered:Math.round(((br&&br.students)||180)*0.78/DB.GRADES.length),
        opened:0,status:'Delivered'});
      DB.log('Published daily activity',S.branch+' · '+S.cls+' · '+S.date,'ok');
      UI.toast('Published — parents notified in the Mobsie app 🎉');
      rerender();
    });
  }

  Pages['daily-activity']={render,mount};
})();
