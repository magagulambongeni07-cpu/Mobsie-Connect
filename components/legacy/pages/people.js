/* Mobsie Connect — People: Learners, Parents, Teachers */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN, R=DB.fmtR;

  /* ---------- Learners ---------- */
  function openLearner(l){
    UI.drawer({
      title:'Learner Profile',
      body:`
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">${UI.avatar(l.name,'xl')}
          <div><div style="font-size:17px;font-weight:800;color:var(--ink-900)">${esc(l.name)}</div>
          <div class="muted small">${esc(l.grade)} ${esc(l.cls)} · ${esc(l.school)}</div></div>
          <span style="margin-left:auto">${UI.status(l.status)}</span></div>
        <div class="grid cards-3" style="gap:10px;margin-bottom:18px">
          <div class="mini-stat"><span class="ms-ic t-green">${MCIcon('attendance')}</span><div><div class="ms-val">${l.attendance}%</div><div class="ms-lbl">Attendance</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-purple">${MCIcon('homework')}</span><div><div class="ms-val">92%</div><div class="ms-lbl">Homework done</div></div></div>
          <div class="mini-stat"><span class="ms-ic ${l.fees==='Paid'?'t-green':'t-red'}">${MCIcon('payments')}</span><div><div class="ms-val">${l.fees}</div><div class="ms-lbl">Fees status</div></div></div>
        </div>
        ${UI.dl([['Age',l.age+' years'],['Parent',esc(l.parent)],['School',esc(l.school)],['Branch',esc(l.branch)],['Class',esc(l.grade)+' '+esc(l.cls)]])}
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">Recent activity</h4>
        <div class="feed">
          <div class="feed-item"><span class="f-ic t-green">${MCIcon('check')}</span><div class="f-txt"><div class="f-main">Marked present</div><div class="f-sub">Today, 07:42</div></div></div>
          <div class="feed-item"><span class="f-ic t-blue">${MCIcon('homework')}</span><div class="f-txt"><div class="f-main">Homework submitted — Counting to 20</div><div class="f-sub">Yesterday</div></div></div>
          <div class="feed-item"><span class="f-ic t-amber">${MCIcon('gallery')}</span><div class="f-txt"><div class="f-main">Tagged in 4 photos — Sports Day</div><div class="f-sub">May 16</div></div></div>
        </div>`,
      foot:`<button class="btn btn-ghost" data-go="messages">${MCIcon('messages')} Message Parent</button>
            <button class="btn btn-primary" data-go="reports">${MCIcon('reports')} View Full Report</button>`,
      mount(root,close){
        root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{close();App.go(b.dataset.go);}));
      }
    });
  }

  Pages.learners={
    render(){
      const rows=App.scoped(DB.learners);
      const enrolled=rows.filter(l=>l.status==='Enrolled').length;
      const tbl=UI.table({
        pageSize:10, rows, onRow:openLearner,
        columns:[
          {key:'name',label:'Learner',render:r=>UI.personCell(r.name,r.age+' yrs')},
          {key:'branch',label:'Campus'},
          {key:'grade',label:'Class',render:r=>`${esc(r.grade)} ${esc(r.cls)}`},
          {key:'parent',label:'Parent'},
          {key:'attendance',label:'Attendance',render:r=>`<div style="display:flex;align-items:center;gap:10px;min-width:120px"><span class="meter"><i style="width:${r.attendance}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.attendance}%</b></div>`},
          {key:'fees',label:'Fees',render:r=>UI.status(r.fees==='Paid'?'Paid':'Overdue')},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      Pages.learners._tid=UI.lastTableId();
      return `
        ${UI.pageHead('Learners','Every enrolled child across your campuses — profiles, attendance and fees at a glance.',
          `<button class="btn btn-ghost" id="lImport">${MCIcon('upload')} Bulk Import</button>
           <button class="btn btn-primary" id="lEnrol">${MCIcon('plus')} Enrol Learner</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'learners',tint:'t-purple',label:'Total Learners',value:F(DB.totals.students),deltaHtml:UI.delta(0,'up','this month').replace('0%','42')})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Enrolled & Active',value:Math.round(enrolled/rows.length*100)+'%',deltaHtml:`<span class="delta flat">of visible sample</span>`})}
          ${UI.statCard({icon:'attendance',tint:'t-orange',label:'Avg Attendance',value:'92%',deltaHtml:UI.delta(4.3,'up','vs last month')})}
          ${UI.statCard({icon:'payments',tint:'t-blue',label:'Fees Collected',value:'87%',deltaHtml:UI.delta(2.1,'up','vs last month')})}
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Learner directory</h3><div class="sub">Click a learner to open their full profile</div></div>
            <span class="spacer"></span>
            <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="lQ" placeholder="Search learners…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div>
        </div>`;
    },
    mount(root){
      root.querySelector('#lQ').addEventListener('input',e=>UI.tableFilter(Pages.learners._tid,e.target.value));
      root.querySelector('#lImport').addEventListener('click',()=>UI.toast('Drop an Excel file to import learners — template downloaded'));
      root.querySelector('#lEnrol').addEventListener('click',()=>UI.modal({
        title:'Enrol Learner',
        body:`<div class="form-row">
            <div class="field"><label>Child's name</label><input type="text" data-f="name" placeholder="Full name"></div>
            <div class="field"><label>Age</label><input type="number" data-f="age" placeholder="e.g. 4"></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Campus</label><select data-f="branch">${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Class</label><select data-f="grade">${DB.GRADES.map(g=>`<option>${g}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>Parent / guardian</label><select data-f="parent">${DB.parents.slice(0,20).map(p=>`<option>${esc(p.name)}</option>`).join('')}</select></div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Enrol Learner</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            if(!v.name){UI.toast('Enter the child\'s name first','alert');return;}
            DB.learners.unshift({id:'l-'+Date.now(),name:v.name,school:DB.SCHOOL_NAME,schoolId:'sch-1',
              branch:v.branch,grade:v.grade,cls:'A',parent:v.parent,age:+v.age||4,attendance:100,
              fees:'Paid',status:'Enrolled'});
            const b=DB.branches.find(x=>x.name===v.branch); if(b) b.students++;
            DB.log('Enrolled learner',v.name+' — '+v.branch,'ok');
            close();UI.toast(v.name+' enrolled at '+v.branch+' 🎉');App.refresh();
          });
        }
      }));
    }
  };

  /* ---------- Parents ---------- */
  function openParent(p){
    const kids=DB.learners.filter(l=>l.parent===p.name);
    UI.drawer({
      title:'Parent Profile',
      body:`
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">${UI.avatar(p.name,'xl')}
          <div><div style="font-size:17px;font-weight:800;color:var(--ink-900)">${esc(p.name)}</div>
          <div class="muted small">${esc(p.school)} · ${esc(p.branch)}</div></div>
          <span style="margin-left:auto">${UI.status(p.status)}</span></div>
        ${UI.dl([['Email',esc(p.email)],['Phone',esc(p.phone)],['Children',String(p.children)],['Joined',esc(p.joined)],
          ['Balance',p.balance?`<b style="color:var(--red-600)">${R(p.balance)} outstanding</b>`:'<b style="color:var(--green-600)">Fully paid</b>']])}
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">Children${kids.length?` (${kids.length} on record)`:''}</h4>
        ${kids.length?`<div class="feed">${kids.map(k=>`
          <div class="feed-item">${UI.avatar(k.name)}<div class="f-txt"><div class="f-main"><b>${esc(k.name)}</b></div>
          <div class="f-sub">${esc(k.grade)} ${esc(k.cls)} · ${k.attendance}% attendance</div></div></div>`).join('')}</div>`
        :`<p class="small muted">Linked child records appear here.</p>`}
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">Engagement</h4>
        ${UI.meterRow('App opens',86,'purple')}
        ${UI.meterRow('Messages read',94)}
        ${UI.meterRow('Payments on time',p.balance?58:98,p.balance?'amber':'')}`,
      foot:`<button class="btn btn-ghost" data-go="statements">${MCIcon('invoices')} Statement</button>
            <button class="btn btn-primary" data-go="messages">${MCIcon('messages')} Send Message</button>`,
      mount(root,close){
        root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{close();App.go(b.dataset.go);}));
      }
    });
  }

  Pages.parents={
    render(){
      const rows=App.scoped(DB.parents);
      const owing=rows.filter(p=>p.balance>0);
      const tbl=UI.table({
        pageSize:10, rows, onRow:openParent,
        columns:[
          {key:'name',label:'Parent',render:r=>UI.personCell(r.name,r.email)},
          {key:'branch',label:'Campus'},
          {key:'children',label:'Children',num:true},
          {key:'phone',label:'Phone'},
          {key:'balance',label:'Balance',num:true,render:r=>r.balance?`<b style="color:var(--red-600)">${R(r.balance)}</b>`:`<span style="color:var(--green-600);font-weight:650">R0</span>`},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
          {label:'',sortable:false,render:()=>`<button class="icon-btn">${MCIcon('chevRight')}</button>`},
        ],
      });
      Pages.parents._tid=UI.lastTableId();
      return `
        ${UI.pageHead('Parents','Families using the Mobsie Connect app — accounts, balances and engagement.',
          `<button class="btn btn-ghost" id="pEmailAll">${MCIcon('campaigns')} Email All</button>
           <button class="btn btn-primary" id="pAdd">${MCIcon('plus')} Add Parent</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'parents',tint:'t-blue',label:'Total Parents',value:F(DB.totals.parents),deltaHtml:UI.delta(0,'up','this month').replace('0%','31')})}
          ${UI.statCard({icon:'push',tint:'t-purple',label:'App Adoption',value:'94%',deltaHtml:UI.delta(1.2,'up','vs last month')})}
          ${UI.statCard({icon:'alert',tint:'t-red',label:'Accounts in Arrears',value:F(38),deltaHtml:UI.delta(3.4,'down','improving')})}
          ${UI.statCard({icon:'heart',tint:'t-green',label:'Satisfaction (CSAT)',value:'4.6/5',deltaHtml:`<span class="delta flat">from 412 ratings</span>`})}
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Parent directory</h3></div><span class="spacer"></span>
            <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="pQ" placeholder="Search parents…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div>
        </div>`;
    },
    mount(root){
      root.querySelector('#pQ').addEventListener('input',e=>UI.tableFilter(Pages.parents._tid,e.target.value));
      root.querySelector('#pEmailAll').addEventListener('click',()=>App.go('campaigns'));
      root.querySelector('#pAdd').addEventListener('click',()=>UI.modal({
        title:'Add Parent',
        body:`<div class="field"><label>Full name</label><input type="text" data-f="name" placeholder="Full name"></div>
          <div class="form-row">
            <div class="field"><label>Email</label><input type="email" data-f="email" placeholder="name@email.com"></div>
            <div class="field"><label>Phone</label><input type="text" data-f="phone" placeholder="0xx xxx xxxx"></div>
          </div>
          <div class="field"><label>Campus</label><select data-f="branch">${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Add & Send App Invite</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            if(!v.name){UI.toast('Enter the parent\'s name first','alert');return;}
            DB.parents.unshift({id:'p-'+Date.now(),name:v.name,email:v.email||DB.email(v.name),
              phone:v.phone||DB.phone(),school:DB.SCHOOL_NAME,schoolId:'sch-1',branch:v.branch,
              children:0,balance:0,status:'Active',joined:'May 2026'});
            DB.log('Added parent',v.name+' — '+v.branch,'ok');
            close();UI.toast('Parent added — Mobsie app invite sent');App.refresh();
          });
        }
      }));
    }
  };

  /* ---------- Teachers ---------- */
  function openTeacher(t){
    UI.drawer({
      title:'Teacher Profile',
      body:`
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">${UI.avatar(t.name,'xl')}
          <div><div style="font-size:17px;font-weight:800;color:var(--ink-900)">${esc(t.name)}</div>
          <div class="muted small">${esc(t.cls)} · ${esc(t.school)}</div></div>
          <span style="margin-left:auto">${UI.status(t.status)}</span></div>
        <div class="grid cards-3" style="gap:10px;margin-bottom:18px">
          <div class="mini-stat"><span class="ms-ic t-purple">${MCIcon('learners')}</span><div><div class="ms-val">${t.students}</div><div class="ms-lbl">Learners</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-amber">${MCIcon('star')}</span><div><div class="ms-val">${t.rating}</div><div class="ms-lbl">Parent rating</div></div></div>
          <div class="mini-stat"><span class="ms-ic t-blue">${MCIcon('briefcase')}</span><div><div class="ms-val">${t.years} yrs</div><div class="ms-lbl">Experience</div></div></div>
        </div>
        ${UI.dl([['Email',esc(t.email)],['Phone',esc(t.phone)],['School',esc(t.school)],['Branch',esc(t.branch)],['Class',esc(t.cls)]])}
        <div class="divider"></div>
        <h4 style="margin-bottom:10px">This week</h4>
        <div class="feed">
          <div class="feed-item"><span class="f-ic t-green">${MCIcon('attendance')}</span><div class="f-txt"><div class="f-main">Attendance captured 5 of 5 days</div><div class="f-sub">Class average 93%</div></div></div>
          <div class="feed-item"><span class="f-ic t-blue">${MCIcon('homework')}</span><div class="f-txt"><div class="f-main">3 homework activities posted</div><div class="f-sub">Numbers, shapes & story time</div></div></div>
          <div class="feed-item"><span class="f-ic t-amber">${MCIcon('gallery')}</span><div class="f-txt"><div class="f-main">18 photos shared to class gallery</div><div class="f-sub">Approved by principal</div></div></div>
        </div>`,
      foot:`<button class="btn btn-ghost" data-go="messages">${MCIcon('messages')} Message</button>
            <button class="btn btn-primary" data-go="attendance">${MCIcon('external')} Open Classroom</button>`,
      mount(root,close){
        root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{close();App.go(b.dataset.go);}));
      }
    });
  }

  Pages.teachers={
    render(){
      const rows=App.scoped(DB.teachers);
      const tbl=UI.table({
        pageSize:10, rows, onRow:openTeacher,
        columns:[
          {key:'name',label:'Teacher',render:r=>UI.personCell(r.name,r.email)},
          {key:'branch',label:'Campus'},
          {key:'cls',label:'Class'},
          {key:'students',label:'Learners',num:true},
          {key:'years',label:'Experience',num:true,render:r=>r.years+' yrs'},
          {key:'rating',label:'Rating',render:r=>`<span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;color:var(--ink-900)"><span style="color:var(--amber-500)">${MCIcon('star')}</span>${r.rating}</span>`},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      Pages.teachers._tid=UI.lastTableId();
      return `
        ${UI.pageHead('Teachers','Teaching staff across all campuses — classes, ratings and workload.',
          `<button class="btn btn-ghost" id="tExp">${MCIcon('download')} Export</button>
           <button class="btn btn-primary" id="tAdd">${MCIcon('plus')} Add Teacher</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'teachers',tint:'t-teal',label:'Total Teachers',value:F(DB.totals.teachers),deltaHtml:UI.delta(0,'up','this month').replace('0%','4')})}
          ${UI.statCard({icon:'learners',tint:'t-purple',label:'Avg Class Size',value:'16',deltaHtml:`<span class="delta flat">across all campuses</span>`})}
          ${UI.statCard({icon:'star',tint:'t-amber',label:'Avg Parent Rating',value:'4.5',deltaHtml:UI.delta(0.2,'up','vs last term').replace('0.2%','0.2')})}
          ${UI.statCard({icon:'attendance',tint:'t-green',label:'Registers On Time',value:'97%',deltaHtml:UI.delta(1.1,'up','vs last month')})}
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Teacher directory</h3></div><span class="spacer"></span>
            <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="tQ" placeholder="Search teachers…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div>
        </div>`;
    },
    mount(root){
      root.querySelector('#tQ').addEventListener('input',e=>UI.tableFilter(Pages.teachers._tid,e.target.value));
      root.querySelector('#tExp').addEventListener('click',()=>UI.downloadCSV('mobsie-teachers.csv',
        ['Teacher','Email','Campus','Class','Learners','Experience (yrs)','Rating','Status'],
        DB.teachers.map(t=>[t.name,t.email,t.branch,t.cls,t.students,t.years,t.rating,t.status])));
      root.querySelector('#tAdd').addEventListener('click',()=>UI.modal({
        title:'Add Teacher',
        body:`<div class="field"><label>Full name</label><input type="text" data-f="name" placeholder="Full name"></div>
          <div class="form-row">
            <div class="field"><label>Campus</label><select data-f="branch">${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Class</label><select data-f="grade">${DB.GRADES.map(g=>`<option>${g}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label>Email</label><input type="email" data-f="email" placeholder="name@mobsie.co.za"></div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Add & Invite</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            if(!v.name){UI.toast('Enter the teacher\'s name first','alert');return;}
            DB.teachers.unshift({id:'t-'+Date.now(),name:v.name,email:v.email||DB.email(v.name),phone:DB.phone(),
              school:DB.SCHOOL_NAME,schoolId:'sch-1',branch:v.branch,grade:v.grade,cls:v.grade+' A',
              students:0,years:0,rating:'—',status:'Active'});
            const b=DB.branches.find(x=>x.name===v.branch); if(b) b.teachers++;
            DB.log('Added teacher',v.name+' — '+v.branch,'ok');
            close();UI.toast(v.name+' added — classroom invite sent');App.refresh();
          });
        }
      }));
    }
  };
})();
