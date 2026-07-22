/* Mobsie Connect — Platform module: Schools directory + Branch management */
window.Pages=window.Pages||{};
(function(){
  const F=DB.fmtN, Rk=DB.fmtRk, esc=UI.esc;

  /* =============== SCHOOLS =============== */
  const sState={q:'',plan:'All Plans',st:'All Statuses',page:1};
  const PER=12;

  function schoolFilter(){
    let rows=DB.schools;
    if(sState.q){ const q=sState.q.toLowerCase();
      rows=rows.filter(s=>(s.name+' '+s.city+' '+s.owner).toLowerCase().includes(q)); }
    if(sState.plan!=='All Plans') rows=rows.filter(s=>s.plan===sState.plan);
    if(sState.st!=='All Statuses') rows=rows.filter(s=>s.status===sState.st);
    return rows;
  }

  function schoolCard(s){
    const planTone=s.plan==='Enterprise'?'purple':s.plan==='Growth'?'blue':'ink';
    return `<div class="card school-card" data-school="${s.id}">
      <div class="sc-top">
        <span class="school-logo" style="background:${s.color}">${s.initials}</span>
        <div style="min-width:0;flex:1">
          <div class="sc-nm">${esc(s.name)}</div>
          <div class="sc-owner">${esc(s.owner)} · ${esc(s.city)}</div>
        </div>
        <button class="icon-btn sc-menu" data-school-menu="${s.id}">${MCIcon('more')}</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 18px 0">${UI.badge(s.plan+' · '+Rk(s.planFee)+'/mo',planTone)} ${UI.status(s.status)}</div>
      <div class="sc-stats">
        <div class="sc-stat"><div class="n">${s.branches}</div><div class="l">Branches</div></div>
        <div class="sc-stat"><div class="n">${F(s.students)}</div><div class="l">Students</div></div>
        <div class="sc-stat"><div class="n">${F(s.parents)}</div><div class="l">Parents</div></div>
        <div class="sc-stat"><div class="n">${s.teachers}</div><div class="l">Teachers</div></div>
      </div>
      <div class="sc-foot">
        <button class="btn btn-soft btn-sm" data-school-view="${s.id}">${MCIcon('external')} View Dashboard</button>
        <span style="margin-left:auto" class="small muted">MRR <b style="color:var(--ink-900)">${Rk(s.mrr)}</b></span>
      </div>
    </div>`;
  }

  function renderSchoolGrid(){
    const rows=schoolFilter();
    const pages=Math.max(1,Math.ceil(rows.length/PER));
    sState.page=Math.min(sState.page,pages);
    const slice=rows.slice((sState.page-1)*PER,sState.page*PER);
    const host=document.getElementById('schoolGrid');
    if(!host) return;
    host.innerHTML=slice.length
      ? `<div class="grid cards-3">${slice.map(schoolCard).join('')}</div>`
      : `<div class="card">${UI.empty('school','No schools found','Try a different search or clear your filters.')}</div>`;
    document.getElementById('schoolCount').innerHTML=`Showing <b>${slice.length?((sState.page-1)*PER+1):0}–${Math.min(rows.length,sState.page*PER)}</b> of <b>${rows.length}</b> schools`;
    const pg=document.getElementById('schoolPages');
    let out='';
    const btn=(p,l,dis,on)=>`<button class="pg ${on?'on':''}" data-p="${p}" ${dis?'disabled':''}>${l}</button>`;
    out+=btn(sState.page-1,'‹',sState.page===1);
    for(let p=1;p<=pages;p++){ if(pages>8&&p>2&&p<pages-1&&Math.abs(p-sState.page)>1){ if(!out.endsWith('…</span>')) out+='<span class="pg" style="cursor:default">…</span>'; continue;} out+=btn(p,p,false,p===sState.page); }
    out+=btn(sState.page+1,'›',sState.page===pages);
    pg.innerHTML=out;
    pg.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{
      const p=+b.dataset.p; if(p>=1&&p<=pages){sState.page=p;renderSchoolGrid();window.scrollTo({top:0,behavior:'smooth'});}
    }));
    bindSchoolCards(host);
  }

  function bindSchoolCards(host){
    host.querySelectorAll('[data-school-view]').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation();
      const s=DB.schools.find(x=>x.id===b.dataset.schoolView);
      App.ctx.school=s.id; App.ctx.branch=null;
      App.go('dashboard'); UI.toast('Now viewing '+s.name);
    }));
    host.querySelectorAll('[data-school-menu]').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation();
      const s=DB.schools.find(x=>x.id===b.dataset.schoolMenu);
      UI.menu(b,[
        {icon:'external',label:'View dashboard',onClick:()=>{App.ctx.school=s.id;App.go('dashboard');}},
        {icon:'edit',label:'Edit school',onClick:()=>editSchool(s)},
        {icon:'analytics',label:'Analytics',onClick:()=>App.go('analytics')},
        {icon:'payments',label:'Finance & billing',onClick:()=>App.go('payments')},
        '-',
        {icon:'pause',label:s.status==='Suspended'?'Reactivate':'Suspend school',onClick:()=>UI.toast((s.status==='Suspended'?'Reactivated ':'Suspended ')+s.name)},
        {icon:'trash',label:'Archive',danger:true,onClick:()=>UI.toast(s.name+' moved to archive')},
      ],{align:'right'});
    }));
    host.querySelectorAll('.school-card').forEach(c=>c.addEventListener('click',e=>{
      if(e.target.closest('button')) return;
      openSchool(DB.schools.find(x=>x.id===c.dataset.school));
    }));
  }

  function openSchool(s){
    const brs=DB.branches.filter(b=>b.schoolId===s.id);
    UI.drawer({
      title:s.name,
      headIcon:`<span class="school-logo" style="background:${s.color};width:38px;height:38px;border-radius:12px;font-size:13px">${s.initials}</span>`,
      body:`
        <div style="display:flex;gap:8px;margin-bottom:18px">${UI.badge(s.plan+' plan','purple')} ${UI.status(s.status)} ${UI.badge(s.city,'ink')}</div>
        <div class="grid cards-4" style="gap:10px;margin-bottom:20px">
          <div class="mini-stat"><span class="ms-ic t-green">${MCIcon('branches')}</span><div><div class="ms-val">${s.branches}</div><div class="ms-lbl">Branches</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-purple">${MCIcon('learners')}</span><div><div class="ms-val">${F(s.students)}</div><div class="ms-lbl">Students</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-blue">${MCIcon('parents')}</span><div><div class="ms-val">${F(s.parents)}</div><div class="ms-lbl">Parents</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-teal">${MCIcon('teachers')}</span><div><div class="ms-val">${s.teachers}</div><div class="ms-lbl">Teachers</div></div></div>
        </div>
        <h4 style="margin-bottom:10px">School details</h4>
        ${UI.dl([
          ['Owner',esc(s.owner)],['Email',esc(s.ownerEmail)],['Phone',esc(s.phone)],
          ['Joined',esc(s.joined)],['Performance',s.perf+'%'],
        ])}
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">Subscription</h4>
        ${UI.dl([
          ['Plan',`${s.plan} — ${Rk(s.planFee)}/month`],
          ['MRR',Rk(s.mrr)],
          ['Seats',`${s.teachers} of ${s.seats} used`],
          ['Storage',`${s.storageGB} GB of 100 GB`],
          ['Next renewal','1 Jun 2026'],
        ])}
        <div style="margin-top:8px">${UI.meterRow('Storage',s.storageGB,'purple',' GB')}</div>
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">Branches (${brs.length})</h4>
        <div class="feed">${brs.map(b=>`
          <div class="feed-item"><span class="f-ic t-green">${MCIcon('branches')}</span>
          <div class="f-txt"><div class="f-main"><b>${esc(b.name)}</b></div>
          <div class="f-sub">${esc(b.principal)} · ${F(b.students)} students · ${b.attendance}% attendance</div></div>
          <span style="margin-left:auto;align-self:center">${UI.status(b.status)}</span></div>`).join('')}</div>`,
      foot:`<button class="btn btn-ghost" id="drwEdit">${MCIcon('edit')} Edit</button>
            <button class="btn btn-primary" id="drwOpen">${MCIcon('external')} Open School Dashboard</button>`,
      mount(root,close){
        root.querySelector('#drwOpen').addEventListener('click',()=>{close();App.ctx.school=s.id;App.ctx.branch=null;App.go('dashboard');UI.toast('Now viewing '+s.name);});
        root.querySelector('#drwEdit').addEventListener('click',()=>{close();editSchool(s);});
      }
    });
  }

  function editSchool(s){
    UI.modal({
      title:s?'Edit School':'Add New School',
      body:`
        <div class="field"><label>School name</label><input type="text" value="${s?esc(s.name):''}" placeholder="e.g. Little Stars Academy"></div>
        <div class="form-row">
          <div class="field"><label>Owner</label><input type="text" value="${s?esc(s.owner):''}" placeholder="Full name"></div>
          <div class="field"><label>City</label><input type="text" value="${s?esc(s.city):''}" placeholder="City"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Subscription plan</label>
            <select>${['Enterprise','Growth','Starter'].map(p=>`<option ${s&&s.plan===p?'selected':''}>${p}</option>`).join('')}</select></div>
          <div class="field"><label>Status</label>
            <select>${['Active','Trial','Suspended'].map(p=>`<option ${s&&s.status===p?'selected':''}>${p}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Owner email</label><input type="email" value="${s?esc(s.ownerEmail):''}" placeholder="owner@school.co.za"></div>`,
      foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-save>${s?'Save Changes':'Create School'}</button>`,
      mount(root,close){
        root.querySelector('[data-x]').addEventListener('click',close);
        root.querySelector('[data-save]').addEventListener('click',()=>{close();UI.toast(s?'School updated':'School created — onboarding email sent');});
      }
    });
  }

  function renderSchools(){
    const t=DB.totals;
    const active=DB.schools.filter(s=>s.status==='Active').length;
    const trial=DB.schools.filter(s=>s.status==='Trial').length;
    const susp=DB.schools.filter(s=>s.status==='Suspended').length;
    return `
      ${UI.pageHead('Schools','Every school on the platform — plans, performance and quick actions.',
        `<button class="btn btn-ghost">${MCIcon('download')} Export</button>
         <button class="btn btn-primary" id="addSchool">${MCIcon('plus')} Add School</button>`)}
      <div class="grid cards-5" style="margin-bottom:20px">
        ${UI.statCard({icon:'school',tint:'t-orange',label:'Total Schools',value:F(t.schools),deltaHtml:UI.delta(6,'up','this month').replace('6%','6')})}
        ${UI.statCard({icon:'checkCircle',tint:'t-green',label:'Active',value:F(active),deltaHtml:`<span class="delta flat">${Math.round(active/t.schools*100)}% of platform</span>`})}
        ${UI.statCard({icon:'sparkle',tint:'t-purple',label:'On Trial',value:F(trial),deltaHtml:`<span class="delta flat">converting at 74%</span>`})}
        ${UI.statCard({icon:'alert',tint:'t-red',label:'Suspended',value:F(susp),deltaHtml:`<span class="delta flat">mostly billing holds</span>`})}
        ${UI.statCard({icon:'creditUp',tint:'t-blue',label:'Combined MRR',value:Rk(t.mrr),deltaHtml:UI.delta(9.3,'up','vs last month')})}
      </div>
      <div class="toolbar">
        <div class="input-wrap">${MCIcon('search')}<input id="schoolQ" placeholder="Search schools, owners, cities…"></div>
        <button class="select" id="planSel">${MCIcon('layers')} <span>${sState.plan}</span> ${MCIcon('chevDown')}</button>
        <button class="select" id="stSel">${MCIcon('filter')} <span>${sState.st}</span> ${MCIcon('chevDown')}</button>
        <span class="spacer"></span>
        <span class="muted small" id="schoolCount"></span>
      </div>
      <div id="schoolGrid"></div>
      <div class="table-foot" style="border:0;padding:16px 4px"><div class="pages" id="schoolPages" style="margin-left:auto"></div></div>`;
  }

  function mountSchools(root){
    renderSchoolGrid();
    root.querySelector('#schoolQ').addEventListener('input',e=>{sState.q=e.target.value;sState.page=1;renderSchoolGrid();});
    root.querySelector('#addSchool').addEventListener('click',()=>editSchool(null));
    root.querySelector('#planSel').addEventListener('click',e=>{
      UI.menu(e.currentTarget,['All Plans','Enterprise','Growth','Starter'].map(p=>({label:p,checked:sState.plan===p,onClick:()=>{sState.plan=p;sState.page=1;e.currentTarget.querySelector('span').textContent=p;renderSchoolGrid();}})));
    });
    root.querySelector('#stSel').addEventListener('click',e=>{
      UI.menu(e.currentTarget,['All Statuses','Active','Trial','Suspended'].map(p=>({label:p,checked:sState.st===p,onClick:()=>{sState.st=p;sState.page=1;e.currentTarget.querySelector('span').textContent=p;renderSchoolGrid();}})));
    });
  }

  Pages.schools={render:renderSchools,mount:mountSchools};

  /* =============== BRANCHES =============== */
  function openBranch(b){
    const s=DB.schools.find(x=>x.id===b.schoolId);
    UI.drawer({
      title:b.name,
      headIcon:`<span class="s-ic t-green" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center">${MCIcon('branches')}</span>`,
      body:`
        <div style="display:flex;gap:8px;margin-bottom:18px">${UI.badge(b.school,'orange')} ${UI.status(b.status)}</div>
        <div class="grid cards-4" style="gap:10px;margin-bottom:20px">
          <div class="mini-stat"><span class="ms-ic t-purple">${MCIcon('learners')}</span><div><div class="ms-val">${F(b.students)}</div><div class="ms-lbl">Students</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-teal">${MCIcon('teachers')}</span><div><div class="ms-val">${b.teachers}</div><div class="ms-lbl">Teachers</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-green">${MCIcon('payments')}</span><div><div class="ms-val">${Rk(b.revenue)}</div><div class="ms-lbl">Revenue /mo</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-orange">${MCIcon('attendance')}</span><div><div class="ms-val">${b.attendance}%</div><div class="ms-lbl">Attendance</div></div></div>
        </div>
        <h4 style="margin-bottom:10px">Branch details</h4>
        ${UI.dl([['Principal',esc(b.principal)],['School',esc(b.school)],['City',esc(b.city)],['Phone',esc(b.phone)]])}
        <div class="divider"></div>
        <h4 style="margin-bottom:6px">This branch includes</h4>
        <div class="tag-row" style="margin-top:8px">${['Gallery','Reports','Calendar','Communications','Attendance','Finance'].map(x=>UI.badge(x,'ink')).join('')}</div>`,
      foot:`<button class="btn btn-ghost">${MCIcon('edit')} Edit</button>
            <button class="btn btn-green" id="brOpen">${MCIcon('external')} Open Branch View</button>`,
      mount(root,close){
        root.querySelector('#brOpen').addEventListener('click',()=>{
          close(); App.ctx.school=b.schoolId; App.ctx.branch=b.id; App.go('dashboard');
          UI.toast('Now viewing '+b.name+' — '+b.school);
        });
      }
    });
  }

  function renderBranches(){
    const scoped=App.school()?DB.branches.filter(b=>b.schoolId===App.school().id):DB.branches;
    const avgAtt=Math.round(scoped.reduce((a,b)=>a+b.attendance,0)/(scoped.length||1));
    const tbl=UI.table({
      pageSize:10,
      rows:scoped,
      onRow:openBranch,
      columns:[
        {key:'name',label:'Branch',render:r=>`<div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.city)}</div>`},
        {key:'school',label:'School'},
        {key:'principal',label:'Principal',render:r=>UI.personCell(r.principal)},
        {key:'students',label:'Students',num:true,render:r=>F(r.students)},
        {key:'teachers',label:'Teachers',num:true},
        {key:'revenue',label:'Revenue /mo',num:true,render:r=>Rk(r.revenue)},
        {key:'attendance',label:'Attendance',render:r=>`<div style="display:flex;align-items:center;gap:10px;min-width:130px"><span class="meter"><i style="width:${r.attendance}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.attendance}%</b></div>`},
        {key:'status',label:'Status',render:r=>UI.status(r.status)},
      ],
    });
    const tid=UI.lastTableId();
    Pages.branches._tid=tid;
    return `
      ${UI.pageHead('Branches',(App.school()?App.school().name+' — branch network.':'Every branch across all schools — unlimited branches per school.'),
        `<button class="btn btn-ghost">${MCIcon('download')} Export</button>
         <button class="btn btn-primary" id="addBranch">${MCIcon('plus')} Add Branch</button>`)}
      <div class="grid cards-4" style="margin-bottom:20px">
        ${UI.statCard({icon:'branches',tint:'t-green',label:'Total Branches',value:F(scoped.length),deltaHtml:UI.delta(14,'up','this month').replace('14%','14')})}
        ${UI.statCard({icon:'learners',tint:'t-purple',label:'Students Across Branches',value:F(scoped.reduce((a,b)=>a+b.students,0))})}
        ${UI.statCard({icon:'attendance',tint:'t-orange',label:'Average Attendance',value:avgAtt+'%',deltaHtml:UI.delta(1.8,'up','vs last month')})}
        ${UI.statCard({icon:'payments',tint:'t-blue',label:'Branch Revenue /mo',value:Rk(scoped.reduce((a,b)=>a+b.revenue,0))})}
      </div>
      <div class="card">
        <div class="card-head"><div><h3>All branches</h3><div class="sub">Click a branch for its profile, principal and performance</div></div>
          <span class="spacer"></span>
          <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="brQ" placeholder="Search branches…"></div></div>
        </div>
        <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div>
      </div>`;
  }

  Pages.branches={
    render:renderBranches,
    mount(root){
      root.querySelector('#brQ').addEventListener('input',e=>UI.tableFilter(Pages.branches._tid,e.target.value));
      root.querySelector('#addBranch').addEventListener('click',()=>UI.modal({
        title:'Add Branch',
        body:`
          <div class="field"><label>School</label><select>${DB.schools.slice(0,20).map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></div>
          <div class="form-row">
            <div class="field"><label>Branch name</label><input type="text" placeholder="e.g. Rustenburg Branch"></div>
            <div class="field"><label>City</label><input type="text" placeholder="City"></div>
          </div>
          <div class="field"><label>Principal</label><input type="text" placeholder="Full name"></div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Create Branch</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{close();UI.toast('Branch created — principal invite sent');});
        }
      }));
    }
  };
})();
