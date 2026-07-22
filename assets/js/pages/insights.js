/* Mobsie Connect — Analytics + Documents */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN, Rk=DB.fmtRk;

  Pages.analytics={
    render(){
      const gs=DB.growthSeries;
      const months=gs.labels;
      const engagement=[62,64,67,71,74,78];
      const retention=[97.2,96.8,96.9,96.1,96.4,96.4];
      const leaderboard=DB.schools.slice(0,8).map((s,i)=>({
        name:s.name,city:s.city,students:s.students,growth:(14-i*1.8).toFixed(1),
        engagement:92-i*3,revenue:s.mrr}));
      const tbl=UI.table({
        pageSize:8, rows:leaderboard,
        columns:[
          {key:'name',label:'School',render:r=>`<div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.city)}</div>`},
          {key:'students',label:'Students',num:true,render:r=>F(r.students)},
          {key:'growth',label:'Growth',num:true,render:r=>`<span class="delta up">${MCIcon('trendUp')}${r.growth}%</span>`},
          {key:'engagement',label:'Engagement',render:r=>`<div style="display:flex;align-items:center;gap:10px;min-width:130px"><span class="meter purple"><i style="width:${r.engagement}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.engagement}%</b></div>`},
          {key:'revenue',label:'MRR',num:true,render:r=>Rk(r.revenue)},
        ],
      });
      return `
        ${UI.pageHead('Analytics','Platform intelligence — growth, engagement, retention and revenue.',
          `<button class="select">${MCIcon('calendar')} Last 6 months ${MCIcon('chevDown')}</button>
           <button class="btn btn-purple">${MCIcon('download')} Export Insights</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'trendUp',tint:'t-green',label:'Platform Growth',value:'+33%',deltaHtml:`<span class="delta flat">schools · 6 months</span>`,spark:Charts.spark(gs.schools,'#16A34A')})}
          ${UI.statCard({icon:'zap',tint:'t-purple',label:'Engagement Score',value:'78',deltaHtml:UI.delta(4,'up','vs April'),spark:Charts.spark(engagement,'#7C3AED')})}
          ${UI.statCard({icon:'heart',tint:'t-blue',label:'Retention (12mo)',value:'96.4%',deltaHtml:UI.delta(0.3,'down','churn watch'),spark:Charts.spark(retention,'#2563EB')})}
          ${UI.statCard({icon:'creditUp',tint:'t-orange',label:'ARR Run-rate',value:Rk(DB.totals.mrr*12),deltaHtml:UI.delta(11,'up','vs Q1'),spark:Charts.spark([31,33,36,38,41,44],'#EA580C')})}
        </div>
        <div class="grid cards-2" style="margin-bottom:20px">
          ${UI.card('Schools joined',`
            ${UI.legend([{color:'#EA580C',label:'Schools on platform',line:true}])}
            <div class="chart-box" style="margin-top:6px">${Charts.line({labels:months,series:[{name:'Schools',color:'#EA580C',data:gs.schools,fmt:v=>F(v)}],height:224,money:false})}</div>`)}
          ${UI.card('Student growth',`
            ${UI.legend([{color:'#7C3AED',label:'Enrolled students',line:true}])}
            <div class="chart-box" style="margin-top:6px">${Charts.line({labels:months,series:[{name:'Students',color:'#7C3AED',data:gs.students,fmt:v=>F(v)}],height:224,money:false})}</div>`)}
        </div>
        <div class="grid cards-2" style="margin-bottom:20px">
          ${UI.card('Monthly platform revenue',`<div class="chart-box">${Charts.bars({labels:months,series:[{name:'Revenue',color:'#16A34A',data:[1.62e6,1.78e6,1.9e6,2.05e6,2.21e6,2.45e6]}],height:224,money:true})}</div>`,{sub:'Fees processed through Mobsie Pay'})}
          ${UI.card('Parent app engagement',`
            ${UI.meterRow('Daily active parents',68,'purple')}
            ${UI.meterRow('Weekly active parents',91,'purple')}
            ${UI.meterRow('Messages read < 1 hour',84)}
            ${UI.meterRow('Gallery views / album',76,'orange')}
            ${UI.meterRow('Homework acknowledged',78,'blue')}
            <div class="divider"></div>
            <div class="small muted">Engagement is strongest on <b style="color:var(--ink-900)">Fridays</b> when galleries and newsletters land.</div>`)}
        </div>
        <div class="card"><div class="card-head"><div><h3>School performance leaderboard</h3><div class="sub">Composite of growth, engagement, attendance and payments</div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    }
  };

  Pages.documents={
    render(){
      const folders=[
        {name:'Policies',count:24,tint:'t-orange'},{name:'Compliance',count:18,tint:'t-red'},
        {name:'Finance',count:41,tint:'t-green'},{name:'HR',count:33,tint:'t-purple'},
        {name:'Academics',count:57,tint:'t-blue'},{name:'Marketing',count:12,tint:'t-pink'},
      ];
      const tbl=UI.table({
        pageSize:8, rows:DB.documentsList,
        columns:[
          {key:'name',label:'Document',render:r=>`<div class="person-cell"><span class="f-ic t-blue" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center">${MCIcon('file')}</span><div class="pc-txt"><div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${r.size}</div></div></div>`},
          {key:'folder',label:'Folder',render:r=>UI.badge(r.folder,'ink')},
          {key:'by',label:'Owner',render:r=>UI.personCell(r.by)},
          {key:'shared',label:'Shared with'},
          {key:'date',label:'Updated'},
          {label:'',sortable:false,render:()=>`<span style="display:inline-flex;gap:4px"><button class="icon-btn">${MCIcon('download')}</button><button class="icon-btn">${MCIcon('campaigns')}</button><button class="icon-btn">${MCIcon('more')}</button></span>`},
        ],
      });
      Pages.documents._tid=UI.lastTableId();
      return `
        ${UI.pageHead('Documents','Central document hub — share policies and packs to any school, branch or role.',
          `<button class="btn btn-ghost">${MCIcon('plus')} New Folder</button>
           <button class="btn btn-primary">${MCIcon('upload')} Upload</button>`)}
        <div class="grid cards-6" style="margin-bottom:20px">${folders.map(f=>`
          <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer">
            <span class="s-ic ${f.tint}" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center">${MCIcon('documents')}</span>
            <div><div style="font-weight:700;color:var(--ink-900)">${f.name}</div>
            <div class="small muted">${f.count} files</div></div>
          </div>`).join('')}</div>
        <div class="card"><div class="card-head"><div><h3>All documents</h3></div><span class="spacer"></span>
          <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="dQ" placeholder="Search documents…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){ root.querySelector('#dQ').addEventListener('input',e=>UI.tableFilter(Pages.documents._tid,e.target.value)); }
  };
})();
