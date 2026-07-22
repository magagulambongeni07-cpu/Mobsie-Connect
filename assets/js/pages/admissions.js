/* Mobsie Connect — Admissions: Applications, Interviews, Waiting List */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN;

  /* ---------- Applications ---------- */
  function openApplication(a){
    UI.drawer({
      title:'Application '+a.id,
      headIcon:`<span class="s-ic t-orange" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center">${MCIcon('applications')}</span>`,
      body:`
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
          ${UI.avatar(a.child,'xl')}
          <div><div style="font-size:17px;font-weight:800;color:var(--ink-900)">${esc(a.child)}</div>
          <div class="muted small">Applying for ${esc(a.grade)} · ${esc(a.school)}</div></div>
          <span style="margin-left:auto">${UI.status(a.status)}</span>
        </div>
        ${UI.dl([
          ['Parent',esc(a.parent)],['Email',esc(a.email)],['Phone',esc(a.phone)],
          ['School',esc(a.school)],['Branch',esc(a.branch)],['Grade',esc(a.grade)],
          ['Submitted',esc(a.date)],['Documents',`${a.docs} of 6 uploaded`],
        ])}
        <div style="margin-top:10px">${UI.meterRow('Documents',Math.round(a.docs/6*100),'orange')}</div>
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">Application timeline</h4>
        <div class="feed">
          <div class="feed-item"><span class="f-ic t-green">${MCIcon('check')}</span><div class="f-txt"><div class="f-main">Application submitted via parent app</div><div class="f-sub">${esc(a.date)}</div></div></div>
          <div class="feed-item"><span class="f-ic t-blue">${MCIcon('file')}</span><div class="f-txt"><div class="f-main">${a.docs} documents uploaded</div><div class="f-sub">Birth certificate, immunisation card…</div></div></div>
          <div class="feed-item"><span class="f-ic t-amber">${MCIcon('waiting')}</span><div class="f-txt"><div class="f-main">Awaiting admissions review</div><div class="f-sub">Assigned to Mpho Baloyi</div></div></div>
        </div>`,
      foot:`<button class="btn btn-danger">${MCIcon('x')} Reject</button>
            <button class="btn btn-ghost">${MCIcon('interviews')} Schedule Interview</button>
            <button class="btn btn-green" id="apApprove">${MCIcon('check')} Approve</button>`,
      mount(root,close){
        root.querySelector('#apApprove').addEventListener('click',()=>{close();UI.toast('Application approved — welcome pack sent to '+a.parent);});
      }
    });
  }

  const aState={tab:'All'};
  function renderApplications(){
    const total=DB.appCounts.reduce((a,b)=>a+b,0);
    const stages=[
      {label:'Applications',value:total},
      {label:'Docs complete',value:total-DB.appCounts[1]},
      {label:'Interviewed',value:DB.appCounts[2]+DB.appCounts[3]+DB.appCounts[4]},
      {label:'Approved',value:DB.appCounts[3]},
      {label:'Enrolled',value:16},
    ];
    const rows=App.scoped(DB.applications).filter(r=>aState.tab==='All'||r.status===aState.tab);
    const tbl=UI.table({
      pageSize:9, rows, onRow:openApplication,
      columns:[
        {key:'id',label:'ID',render:r=>`<span class="cell-main" style="font-variant-numeric:tabular-nums">${r.id}</span>`},
        {key:'child',label:'Child',render:r=>UI.personCell(r.child,r.grade)},
        {key:'parent',label:'Parent',render:r=>`<div>${esc(r.parent)}</div><div class="cell-sub">${esc(r.phone)}</div>`},
        {key:'school',label:'School',render:r=>`<div>${esc(r.school)}</div><div class="cell-sub">${esc(r.branch)}</div>`},
        {key:'date',label:'Submitted'},
        {key:'docs',label:'Docs',num:true,render:r=>`${r.docs}/6`},
        {key:'status',label:'Status',render:r=>UI.status(r.status)},
        {label:'',sortable:false,render:r=>`<button class="icon-btn">${MCIcon('chevRight')}</button>`},
      ],
    });
    Pages.applications._tid=UI.lastTableId();
    const tabs=['All','Pending Review','Documents Required','Interview Scheduled','Approved','Rejected'];
    const counts={All:DB.applications.length};
    tabs.slice(1).forEach(t=>counts[t]=DB.applications.filter(a=>a.status===t).length);
    return `
      ${UI.pageHead('Applications','Every admission application across the platform, from first click to enrolment.',
        `<button class="btn btn-ghost">${MCIcon('download')} Export</button>
         <button class="btn btn-primary" id="newApp">${MCIcon('plus')} New Application</button>`)}
      <div class="grid" style="grid-template-columns:1.3fr 1fr 1fr;margin-bottom:20px" id="admTop">
        ${UI.card('Admissions funnel',Charts.funnel({stages}),{sub:'This term · conversion from application to enrolment'})}
        ${UI.card('This month',`
          <div class="grid cards-2" style="gap:10px">
            <div class="mini-stat"><span class="ms-ic t-orange">${MCIcon('applications')}</span><div><div class="ms-val">${total}</div><div class="ms-lbl">New applications</div></div></div>
            <div class="mini-stat"><span class="ms-ic t-amber">${MCIcon('waiting')}</span><div><div class="ms-val">${DB.appCounts[0]}</div><div class="ms-lbl">Pending review</div></div></div>
            <div class="mini-stat"><span class="ms-ic t-green">${MCIcon('check')}</span><div><div class="ms-val">${DB.appCounts[3]}</div><div class="ms-lbl">Approved</div></div></div>
            <div class="mini-stat"><span class="ms-ic t-teal">${MCIcon('interviews')}</span><div><div class="ms-val">${DB.appCounts[2]}</div><div class="ms-lbl">Interviews set</div></div></div>
          </div>
          <div class="divider"></div>
          <div class="small muted">Average time to decision <b style="color:var(--ink-900)">3.2 days</b> · fastest school <b style="color:var(--ink-900)">Little Stars (0.9 d)</b></div>`)}
        ${UI.card('Top intake schools',`<div class="rank-list">${DB.schools.slice(0,4).map((s,i)=>`
          <div class="rank-item"><span class="rk">${i+1}</span>
          <span class="r-txt"><div class="r-nm">${esc(s.name)}</div><div class="r-sub">${esc(s.city)}</div></span>
          <span class="meter orange" style="flex:1"><i style="width:${90-i*16}%"></i></span>
          <span class="r-val">${44-i*9}</span></div>`).join('')}</div>`,{sub:'Applications this month'})}
      </div>
      <div class="card">
        <div class="card-body" style="padding-bottom:0">
          <div class="tabs" style="margin-bottom:0">${tabs.map(t=>`<button class="${aState.tab===t?'on':''}" data-tab="${t}">${t}<span class="cnt">${counts[t]}</span></button>`).join('')}</div>
        </div>
        <div class="card-body" style="padding-top:10px;padding-left:0;padding-right:0">${tbl}</div>
      </div>
      <style>@media(max-width:1280px){#admTop{grid-template-columns:1fr 1fr}}@media(max-width:860px){#admTop{grid-template-columns:1fr}}</style>`;
  }
  Pages.applications={
    render:renderApplications,
    mount(root){
      root.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{aState.tab=b.dataset.tab;App.route='applications';document.getElementById('content').innerHTML=renderApplications();UI.hydrate();Pages.applications.mount(document.getElementById('content'));}));
      const na=root.querySelector('#newApp');
      if(na) na.addEventListener('click',()=>UI.modal({
        title:'New Application',
        body:`<div class="form-row">
            <div class="field"><label>Child's name</label><input type="text" placeholder="Full name"></div>
            <div class="field"><label>Grade applying for</label><select>${DB.GRADES.map(g=>`<option>${g}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>Parent / guardian</label><input type="text" placeholder="Full name"></div>
          <div class="form-row">
            <div class="field"><label>School</label><select>${DB.schools.slice(0,15).map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Preferred branch</label><select><option>Main branch</option></select></div>
          </div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Submit Application</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{close();UI.toast('Application captured — parent notified in the app');});
        }
      }));
    }
  };

  /* ---------- Interviews ---------- */
  function renderInterviews(){
    const rows=App.scoped(DB.interviews);
    const today=rows.slice(0,3);
    const tbl=UI.table({
      pageSize:8, rows,
      onRow:iv=>UI.drawer({
        title:'Interview '+iv.id,
        body:`
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">${UI.avatar(iv.child,'xl')}
          <div><div style="font-size:17px;font-weight:800;color:var(--ink-900)">${esc(iv.child)}</div>
          <div class="muted small">${esc(iv.grade)} · ${esc(iv.school)}</div></div>
          <span style="margin-left:auto">${UI.status(iv.status)}</span></div>
          ${UI.dl([['Parent',esc(iv.parent)],['Date',esc(iv.date)],['Time',iv.time],['Mode',esc(iv.mode)],['Interviewer',esc(iv.interviewer)],['Branch',esc(iv.branch)]])}`,
        foot:`<button class="btn btn-ghost">${MCIcon('calendar')} Reschedule</button><button class="btn btn-green">${MCIcon('check')} Mark Completed</button>`,
      }),
      columns:[
        {key:'id',label:'ID'},
        {key:'child',label:'Child',render:r=>UI.personCell(r.child,r.grade)},
        {key:'school',label:'School',render:r=>`<div>${esc(r.school)}</div><div class="cell-sub">${esc(r.branch)}</div>`},
        {key:'date',label:'Date',render:r=>`<div class="cell-main">${r.date}</div><div class="cell-sub">${r.time}</div>`},
        {key:'mode',label:'Mode',render:r=>UI.status(r.mode)},
        {key:'interviewer',label:'Interviewer',render:r=>UI.personCell(r.interviewer)},
        {key:'status',label:'Status',render:r=>UI.status(r.status)},
      ],
    });
    return `
      ${UI.pageHead('Interviews','Admission interviews across all schools and branches.',
        `<button class="btn btn-primary">${MCIcon('plus')} Schedule Interview</button>`)}
      <div class="grid cards-3" style="margin-bottom:20px">${today.map(iv=>`
        <div class="card" style="padding:16px 18px">
          <div style="display:flex;align-items:center;gap:12px">${UI.avatar(iv.child,'lg')}
            <div style="min-width:0"><div style="font-weight:700;color:var(--ink-900)">${esc(iv.child)}</div>
            <div class="small muted">${esc(iv.school)}</div></div>
            <span style="margin-left:auto">${UI.badge(iv.mode,iv.mode==='Virtual'?'purple':'blue')}</span></div>
          <div class="divider" style="margin:12px 0"></div>
          <div style="display:flex;align-items:center;gap:14px" class="small">
            <span style="display:inline-flex;align-items:center;gap:6px;color:var(--ink-600);font-weight:600">${MCIcon('calendar')} ${iv.date}</span>
            <span style="display:inline-flex;align-items:center;gap:6px;color:var(--ink-600);font-weight:600">${MCIcon('clock')} ${iv.time}</span>
            <button class="btn btn-soft btn-sm" style="margin-left:auto">Join</button>
          </div>
        </div>`).join('')}</div>
      <div class="card"><div class="card-head"><div><h3>All interviews</h3></div></div>
        <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
  }
  Pages.interviews={render:renderInterviews};

  /* ---------- Waiting List ---------- */
  function renderWaiting(){
    const rows=App.scoped(DB.waitingList);
    const tbl=UI.table({
      pageSize:10, rows,
      columns:[
        {key:'position',label:'#',num:true,render:r=>`<b style="font-variant-numeric:tabular-nums">${r.position}</b>`},
        {key:'child',label:'Child',render:r=>UI.personCell(r.child,r.grade)},
        {key:'parent',label:'Parent'},
        {key:'school',label:'School',render:r=>`<div>${esc(r.school)}</div><div class="cell-sub">${esc(r.branch)}</div>`},
        {key:'since',label:'On list since'},
        {key:'priority',label:'Priority',render:r=>UI.status(r.priority)},
        {label:'',sortable:false,render:r=>`<button class="btn btn-soft btn-sm" data-offer="${r.id}">Offer place</button>`},
      ],
    });
    return `
      ${UI.pageHead('Waiting List','Families queued for a place, with sibling and staff priority handling.',
        `<button class="btn btn-ghost">${MCIcon('campaigns')} Notify All</button>
         <button class="btn btn-primary">${MCIcon('plus')} Add to List</button>`)}
      <div class="grid cards-4" style="margin-bottom:20px">
        ${UI.statCard({icon:'waiting',tint:'t-amber',label:'On Waiting List',value:F(DB.waitingList.length*31),deltaHtml:UI.delta(12,'up','this term')})}
        ${UI.statCard({icon:'parents',tint:'t-purple',label:'Sibling Priority',value:'118',deltaHtml:`<span class="delta flat">24% of list</span>`})}
        ${UI.statCard({icon:'check',tint:'t-green',label:'Placed This Month',value:'37',deltaHtml:UI.delta(9,'up','vs April')})}
        ${UI.statCard({icon:'clock',tint:'t-blue',label:'Avg Wait Time',value:'6.4 wks',deltaHtml:UI.delta(4,'down','improving')})}
      </div>
      <div class="card"><div class="card-head"><div><h3>Current waiting list</h3><div class="sub">Ordered by position — offers release automatically when a seat opens</div></div></div>
        <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
  }
  Pages['waiting-list']={
    render:renderWaiting,
    mount(root){
      root.querySelectorAll('[data-offer]').forEach(b=>b.addEventListener('click',()=>UI.toast('Offer sent — family has 48 hours to accept')));
    }
  };
})();
