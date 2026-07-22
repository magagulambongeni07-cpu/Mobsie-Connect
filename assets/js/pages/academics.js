/* Mobsie Connect — Academics: Attendance, Homework, Reports, Calendar */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN;

  /* ---------- Attendance ---------- */
  Pages.attendance={
    render(){
      const days=['11','12','13','14','15','18'];
      const grades=DB.GRADES;
      const data=grades.map((g,i)=>days.map((d,j)=>{
        const v=88+((i*3+j*5)%11); return v>98?98:v;
      }));
      const branchRows=DB.branches.slice(0,60);
      const tbl=UI.table({
        pageSize:8, rows:App.school()?branchRows.filter(b=>b.schoolId===App.school().id):branchRows,
        columns:[
          {key:'name',label:'Branch',render:r=>`<div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.school)}</div>`},
          {key:'students',label:'Learners',num:true,render:r=>F(r.students)},
          {key:'attendance',label:'This week',render:r=>`<div style="display:flex;align-items:center;gap:10px;min-width:150px"><span class="meter"><i style="width:${r.attendance}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.attendance}%</b></div>`},
          {label:'Late arrivals',num:true,sortable:false,render:r=>String(Math.max(0,Math.round((100-r.attendance)*1.4)))},
          {label:'Absent today',num:true,sortable:false,render:r=>String(Math.max(0,Math.round((100-r.attendance)*.9)))},
          {label:'Trend',sortable:false,render:r=>Charts.spark([r.attendance-4,r.attendance-2,r.attendance-3,r.attendance-1,r.attendance],'#16A34A',86,26)},
        ],
      });
      return `
        ${UI.pageHead('Attendance','Live attendance across every school, branch and class.',
          `<button class="btn btn-ghost">${MCIcon('download')} Export Register</button>
           <button class="btn btn-primary">${MCIcon('attendance')} Capture Attendance</button>`)}
        <div class="grid" style="grid-template-columns:1fr 1.6fr;margin-bottom:20px" id="attTop">
          ${UI.card('Platform average',`
            <div style="display:flex;align-items:center;gap:20px">
              <div style="width:130px;flex-shrink:0">${Charts.ring({pct:92,size:132,thick:12})}</div>
              <div style="flex:1">
                <div style="font-weight:700;color:var(--ink-900);font-size:15px">Average Attendance</div>
                ${UI.delta(4.3,'up','vs last month')}
                <div class="divider"></div>
                <div class="small muted">Best day this week <b style="color:var(--ink-900)">Tuesday (95%)</b><br>Most improved <b style="color:var(--ink-900)">Mamelodi Branch (+3.2%)</b></div>
              </div>
            </div>
            <div class="divider"></div>
            ${UI.meterRow('Playgroup',93)}${UI.meterRow('Nursery',91)}${UI.meterRow('Grade R',92)}${UI.meterRow('Grade 1',91)}${UI.meterRow('Grade 2',90)}`)}
          ${UI.card('Attendance heatmap','<div class="chart-box" style="overflow-x:auto">'+Charts.heatmap({rows:grades,cols:days,data})+'</div>',{sub:'Grade × school day (May) · % present',right:UI.legend([{color:'#DCFCE7',label:'≤84%'},{color:'#4ADE80',label:'88–92%'},{color:'#15803D',label:'96%+'}])})}
        </div>
        <div class="card"><div class="card-head"><div><h3>Attendance by branch</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>
        <style>@media(max-width:1100px){#attTop{grid-template-columns:1fr}}</style>`;
    }
  };

  /* ---------- Homework ---------- */
  Pages.homework={
    render(){
      const items=[
        {title:'Counting to 20 with objects',cls:'Grade R A',school:'Little Stars Academy',teacher:'Naledi Khumalo',due:'May 19',done:88,subject:'Numeracy',tint:'t-orange'},
        {title:'My Family — drawing & telling',cls:'Nursery B',school:'Hebron Preschool',teacher:'Sipho Dlamini',due:'May 19',done:74,subject:'Life Skills',tint:'t-green'},
        {title:'Letter sounds: S, A, T',cls:'Grade R B',school:'Bright Kids Academy',teacher:'Palesa Nkosi',due:'May 20',done:65,subject:'Literacy',tint:'t-purple'},
        {title:'Shapes hunt at home',cls:'Grade 1 A',school:'Future Leaders Academy',teacher:'Karabo Mnisi',due:'May 20',done:52,subject:'Numeracy',tint:'t-blue'},
        {title:'Read-along: The Hungry Caterpillar',cls:'Grade 1 B',school:'Sunshine Kids',teacher:'Zanele Mabaso',due:'May 21',done:41,subject:'Literacy',tint:'t-teal'},
        {title:'Winter clothing collage',cls:'Grade 2 A',school:'Little Stars Academy',teacher:'Lerato Mokoena',due:'May 22',done:12,subject:'Art',tint:'t-pink'},
      ];
      return `
        ${UI.pageHead('Homework','Activities set by teachers, with live completion tracking for parents.',
          `<button class="btn btn-primary">${MCIcon('plus')} New Activity</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'homework',tint:'t-purple',label:'Active Activities',value:'312',deltaHtml:UI.delta(0,'up','this week').replace('0%','48')})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Avg Completion',value:'78%',deltaHtml:UI.delta(5.2,'up','vs last week')})}
          ${UI.statCard({icon:'parents',tint:'t-blue',label:'Parent Views',value:'14,208',deltaHtml:UI.delta(11,'up','this week')})}
          ${UI.statCard({icon:'clock',tint:'t-amber',label:'Due This Week',value:'96',deltaHtml:`<span class="delta flat">across 42 classes</span>`})}
        </div>
        <div class="grid cards-3">${items.map(h=>`
          <div class="card" style="padding:18px">
            <div style="display:flex;align-items:flex-start;gap:11px">
              <span class="s-ic ${h.tint}" style="width:38px;height:38px;border-radius:11px;display:grid;place-items:center">${MCIcon('homework')}</span>
              <div style="min-width:0;flex:1">
                <div style="font-weight:700;color:var(--ink-900);line-height:1.3">${esc(h.title)}</div>
                <div class="small muted" style="margin-top:2px">${esc(h.cls)} · ${esc(h.school)}</div>
              </div>
              ${UI.badge(h.subject,h.tint.replace('t-',''))}
            </div>
            <div class="divider" style="margin:14px 0 10px"></div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              ${UI.avatar(h.teacher,'sm')}<span class="small" style="font-weight:600;color:var(--ink-600)">${esc(h.teacher)}</span>
              <span class="small muted" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px">${MCIcon('calendar')} Due ${h.due}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="meter ${h.done<50?'amber':''}"><i style="width:${h.done}%"></i></span>
              <b class="small" style="font-variant-numeric:tabular-nums">${h.done}%</b>
            </div>
          </div>`).join('')}</div>`;
    }
  };

  /* ---------- Reports ---------- */
  Pages.reports={
    render(){
      const reports=[
        {name:'Term 2 Progress Reports',type:'Report cards',scope:'All schools',date:'Due Jun 20',status:'In Progress',done:64,tint:'t-purple'},
        {name:'Attendance Summary — May',type:'Attendance',scope:'All branches',date:'Generated May 18',status:'Completed',done:100,tint:'t-green'},
        {name:'Fee Collection Report — May',type:'Finance',scope:'All schools',date:'Generated May 18',status:'Completed',done:100,tint:'t-blue'},
        {name:'Learner Development — Playgroup',type:'Milestones',scope:'12 schools',date:'Due May 30',status:'In Progress',done:38,tint:'t-orange'},
        {name:'Staff Performance Q2',type:'HR',scope:'Platform',date:'Due Jun 30',status:'Scheduled',done:0,tint:'t-teal'},
      ];
      const gs=DB.growthSeries;
      return `
        ${UI.pageHead('Reports','Report cards, milestone tracking and operational reporting.',
          `<button class="btn btn-ghost">${MCIcon('download')} Download Centre</button>
           <button class="btn btn-purple">${MCIcon('sparkle')} Generate Report</button>`)}
        <div class="grid" style="grid-template-columns:1.5fr 1fr;margin-bottom:20px" id="repTop">
          ${UI.card('Report card completion by grade',`
            ${UI.meterRow('Playgroup',82,'purple')}
            ${UI.meterRow('Nursery',75,'purple')}
            ${UI.meterRow('Grade RR',68,'purple')}
            ${UI.meterRow('Grade R',71,'purple')}
            ${UI.meterRow('Grade 1',54,'purple')}
            ${UI.meterRow('Grade 2',49,'purple')}`,
            {sub:'Term 2 · teacher submissions received'})}
          ${UI.card('Reports generated',`<div class="chart-box">${Charts.bars({labels:gs.labels,series:[{name:'Reports',color:'#7C3AED',data:[840,910,1180,1050,1320,1465]}],height:208,capLabels:true})}</div>`,{sub:'Monthly, all schools'})}
        </div>
        <div class="card"><div class="card-head"><div><h3>Report runs</h3></div></div>
          <div class="card-body" style="padding-top:8px">
            <div class="feed">${reports.map(r=>`
              <div class="feed-item" style="align-items:center">
                <span class="f-ic ${r.tint}">${MCIcon('reports')}</span>
                <div class="f-txt" style="flex:0 0 280px"><div class="f-main"><b>${esc(r.name)}</b></div><div class="f-sub">${esc(r.type)} · ${esc(r.scope)}</div></div>
                <span class="meter" style="max-width:180px"><i style="width:${r.done}%"></i></span>
                <span class="small" style="font-weight:700;width:40px;text-align:right;font-variant-numeric:tabular-nums">${r.done}%</span>
                <span class="small muted" style="width:130px">${esc(r.date)}</span>
                ${UI.status(r.status)}
                <button class="icon-btn" style="margin-left:auto">${MCIcon('download')}</button>
              </div>`).join('')}</div>
          </div></div>
        <style>@media(max-width:1100px){#repTop{grid-template-columns:1fr}}</style>`;
    }
  };

  /* ---------- Calendar ---------- */
  Pages.calendar={
    render(){
      // May 2026: 1st = Friday. Grid starts Mon Apr 27.
      const evByDay={4:[{t:'Public holiday — recovery day',c:'blue'}],
        12:[{t:'Newsletter: May Updates',c:'purple'}],
        16:[{t:'Sports Day — Hebron',c:'green'}],
        18:[{t:'Fees run generated',c:'orange'}],
        20:[{t:"Principal's Meeting",c:'orange'},{t:'Gr R outing forms due',c:'teal'}],
        22:[{t:'Sports Day — all branches',c:'green'}],
        24:[{t:'Parent Workshop',c:'purple'}],
        26:[{t:'Planetarium trip — Gr R',c:'blue'}],
        28:[{t:'Mid Term Break begins',c:'red'}]};
      const tone={orange:['var(--orange-100)','var(--orange-700)'],green:['var(--green-100)','var(--green-700)'],
        purple:['var(--purple-100)','var(--purple-700)'],blue:['var(--blue-100)','var(--blue-600)'],
        teal:['var(--teal-100)','var(--teal-600)'],red:['var(--red-100)','var(--red-600)']};
      let cells='';
      const dows=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      dows.forEach(d=>cells+=`<div class="cal-dow">${d}</div>`);
      for(let i=0;i<35;i++){
        const day=i-3; // Apr 27..30 then May 1..31
        const isMay=day>=1&&day<=31;
        const label=isMay?day:(27+i);
        const evs=isMay?(evByDay[day]||[]):[];
        cells+=`<div class="cal-cell ${isMay?'':'dim'} ${day===18?'today':''}">
          <span class="d">${label}</span>
          ${evs.map(e=>`<span class="cal-ev" style="background:${tone[e.c][0]};color:${tone[e.c][1]}">${esc(e.t)}</span>`).join('')}
        </div>`;
      }
      return `
        ${UI.pageHead('Calendar','A single calendar across the platform — filter to any school or branch.',
          `<button class="select" id="calMonth">${MCIcon('calendar')} May 2026 ${MCIcon('chevDown')}</button>
           <button class="btn btn-primary" id="addEvent">${MCIcon('plus')} Add Event</button>`)}
        <div class="grid" style="grid-template-columns:2.4fr 1fr" id="calWrap">
          <div class="card"><div class="card-body" style="padding:0"><div class="cal-grid">${cells}</div></div></div>
          <div>
            ${UI.card('Upcoming events',`<div>${DB.events.map(e=>`
              <div class="event-item"><span class="ev-date ${e.tint}"><span class="mo">${e.mo}</span><span class="dy">${e.dy}</span></span>
              <span class="e-txt"><div class="e-nm">${esc(e.name)}</div><div class="e-sub">${esc(e.sub)}</div></span>
              <span class="e-time">${e.time}</span></div>`).join('')}</div>`)}
            <div style="height:20px"></div>
            ${UI.card('Event categories',`
              <div class="toggle-row"><span class="t-txt"><span class="t-nm">School events</span></span><span style="width:12px;height:12px;border-radius:4px;background:var(--green-500)"></span></div>
              <div class="toggle-row"><span class="t-txt"><span class="t-nm">Meetings</span></span><span style="width:12px;height:12px;border-radius:4px;background:var(--orange-500)"></span></div>
              <div class="toggle-row"><span class="t-txt"><span class="t-nm">Parent engagements</span></span><span style="width:12px;height:12px;border-radius:4px;background:var(--purple-500)"></span></div>
              <div class="toggle-row"><span class="t-txt"><span class="t-nm">Trips & outings</span></span><span style="width:12px;height:12px;border-radius:4px;background:var(--blue-500)"></span></div>
              <div class="toggle-row"><span class="t-txt"><span class="t-nm">Holidays & closures</span></span><span style="width:12px;height:12px;border-radius:4px;background:var(--red-500)"></span></div>`)}
          </div>
        </div>
        <style>@media(max-width:1100px){#calWrap{grid-template-columns:1fr}}</style>`;
    },
    mount(root){
      root.querySelector('#calMonth').addEventListener('click',e=>{
        UI.menu(e.currentTarget,['April 2026','May 2026','June 2026','July 2026'].map((m,i)=>({label:m,checked:i===1,onClick:()=>UI.toast('Showing '+m)})));
      });
      root.querySelector('#addEvent').addEventListener('click',()=>UI.modal({
        title:'Add Event',
        body:`<div class="field"><label>Event name</label><input type="text" placeholder="e.g. Sports Day"></div>
          <div class="form-row">
            <div class="field"><label>Date</label><input type="text" value="May 22, 2026"></div>
            <div class="field"><label>Time</label><input type="text" placeholder="08:00"></div>
          </div>
          <div class="field"><label>Audience</label><select><option>Entire platform</option><option>Specific school</option><option>Specific branch</option><option>Specific grade</option><option>Specific class</option></select></div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Create Event</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{close();UI.toast('Event created and pushed to parent apps');});
        }
      }));
    }
  };
})();
