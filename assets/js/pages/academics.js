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
      const tbl=UI.table({
        pageSize:8, rows:DB.liveBranches(),
        columns:[
          {key:'name',label:'Campus',render:r=>`<div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.city)}</div>`},
          {key:'students',label:'Learners',num:true,render:r=>F(r.students)},
          {key:'attendance',label:'This week',render:r=>`<div style="display:flex;align-items:center;gap:10px;min-width:150px"><span class="meter"><i style="width:${r.attendance}%"></i></span><b style="font-variant-numeric:tabular-nums">${r.attendance}%</b></div>`},
          {label:'Late arrivals',num:true,sortable:false,render:r=>String(Math.max(0,Math.round((100-r.attendance)*1.4)))},
          {label:'Absent today',num:true,sortable:false,render:r=>String(Math.max(0,Math.round((100-r.attendance)*.9)))},
          {label:'Trend',sortable:false,render:r=>Charts.spark([r.attendance-4,r.attendance-2,r.attendance-3,r.attendance-1,r.attendance],'#16A34A',86,26)},
        ],
      });
      return `
        ${UI.pageHead('Attendance','Live attendance across every campus and class.',
          `<button class="btn btn-ghost" id="attExp">${MCIcon('download')} Export Register</button>
           <button class="btn btn-primary" id="attCap">${MCIcon('attendance')} Capture Attendance</button>`)}
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
        <div class="card"><div class="card-head"><div><h3>Attendance by campus</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>
        <style>@media(max-width:1100px){#attTop{grid-template-columns:1fr}}</style>`;
    },
    mount(root){
      root.querySelector('#attExp').addEventListener('click',()=>UI.downloadCSV('attendance-register-may.csv',
        ['Campus','Learners','This week %','Late arrivals','Absent today'],
        DB.liveBranches().map(b=>[b.name,b.students,b.attendance,Math.round((100-b.attendance)*1.4),Math.round((100-b.attendance)*.9)])));
      root.querySelector('#attCap').addEventListener('click',()=>UI.modal({
        title:'Capture Attendance',
        body:`<div class="form-row">
            <div class="field"><label>Campus</label><select data-f="branch">${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Class</label><select data-f="grade">${DB.GRADES.map(g=>`<option>${g}</option>`).join('')}</select></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Present</label><input type="number" data-f="present" value="18"></div>
            <div class="field"><label>Absent</label><input type="number" data-f="absent" value="2"></div>
          </div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Save Register</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            DB.log('Captured attendance',v.grade+' — '+v.branch+' ('+v.present+' present, '+v.absent+' absent)','ok');
            close();UI.toast('Register saved — parents of absentees notified');App.refresh();
          });
        }
      }));
    }
  };

  /* ---------- Homework ---------- */
  Pages.homework={
    render(){
      const items=DB.homeworkList;
      return `
        ${UI.pageHead('Homework','Activities set by teachers, with live completion tracking for parents.',
          `<button class="btn btn-primary" id="hwNew">${MCIcon('plus')} New Activity</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'homework',tint:'t-purple',label:'Active Activities',value:String(items.length+26),deltaHtml:UI.delta(0,'up','this week').replace('0%','8')})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Avg Completion',value:'78%',deltaHtml:UI.delta(5.2,'up','vs last week')})}
          ${UI.statCard({icon:'parents',tint:'t-blue',label:'Parent Views',value:'2,408',deltaHtml:UI.delta(11,'up','this week')})}
          ${UI.statCard({icon:'clock',tint:'t-amber',label:'Due This Week',value:'18',deltaHtml:`<span class="delta flat">across 42 classes</span>`})}
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
    },
    mount(root){
      root.querySelector('#hwNew').addEventListener('click',()=>UI.modal({
        title:'New Homework Activity',
        body:`<div class="field"><label>Activity title</label><input type="text" data-f="title" placeholder="e.g. Colour the seasons"></div>
          <div class="form-row">
            <div class="field"><label>Campus</label><select data-f="school">${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Class</label><select data-f="cls">${DB.GRADES.map(g=>`<option>${g} A</option>`).join('')}</select></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Subject</label><select data-f="subject"><option>Numeracy</option><option>Literacy</option><option>Life Skills</option><option>Art</option></select></div>
            <div class="field"><label>Due</label><input type="text" data-f="due" value="May 23"></div>
          </div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Publish to Parents</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            if(!v.title){UI.toast('Give the activity a title first','alert');return;}
            const tints={Numeracy:'t-orange',Literacy:'t-purple','Life Skills':'t-green',Art:'t-pink'};
            DB.homeworkList.unshift({title:v.title,cls:v.cls,school:v.school,teacher:'Thandi Admin',
              due:v.due,done:0,subject:v.subject,tint:tints[v.subject]||'t-blue'});
            DB.log('Published homework',v.title+' — '+v.cls,'ok');
            close();UI.toast('Activity published — parents notified in the app');App.refresh();
          });
        }
      }));
    }
  };

  /* ---------- Reports ---------- */
  Pages.reports={
    render(){
      const reports=DB.reportRuns;
      const gs=DB.growthSeries;
      return `
        ${UI.pageHead('Reports','Report cards, milestone tracking and operational reporting.',
          `<button class="btn btn-ghost" id="repDl">${MCIcon('download')} Download Centre</button>
           <button class="btn btn-purple" id="repGen">${MCIcon('sparkle')} Generate Report</button>`)}
        <div class="grid" style="grid-template-columns:1.5fr 1fr;margin-bottom:20px" id="repTop">
          ${UI.card('Report card completion by grade',`
            ${UI.meterRow('Playgroup',82,'purple')}
            ${UI.meterRow('Nursery',75,'purple')}
            ${UI.meterRow('Grade RR',68,'purple')}
            ${UI.meterRow('Grade R',71,'purple')}
            ${UI.meterRow('Grade 1',54,'purple')}
            ${UI.meterRow('Grade 2',49,'purple')}`,
            {sub:'Term 2 · teacher submissions received'})}
          ${UI.card('Reports generated',`<div class="chart-box">${Charts.bars({labels:gs.labels,series:[{name:'Reports',color:'#7C3AED',data:[184,210,248,232,286,312]}],height:208,capLabels:true})}</div>`,{sub:'Monthly, all campuses'})}
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
                <button class="icon-btn" style="margin-left:auto" data-repdl="${esc(r.name)}">${MCIcon('download')}</button>
              </div>`).join('')}</div>
          </div></div>
        <style>@media(max-width:1100px){#repTop{grid-template-columns:1fr}}</style>`;
    },
    mount(root){
      root.addEventListener('click',e=>{
        const b=e.target.closest('[data-repdl]');
        if(b){
          const r=DB.reportRuns.find(x=>x.name===b.dataset.repdl);
          if(r&&r.done===100) UI.downloadCSV(r.name.replace(/[^\w]+/g,'-').toLowerCase()+'.csv',
            ['Report','Type','Scope','Status','Completion %'],[[r.name,r.type,r.scope,r.status,r.done]]);
          else UI.toast('Report still generating — '+(r?r.done:0)+'% complete');
        }
      });
      root.querySelector('#repDl').addEventListener('click',()=>UI.downloadCSV('mobsie-report-runs.csv',
        ['Report','Type','Scope','Date','Status','Completion %'],
        DB.reportRuns.map(r=>[r.name,r.type,r.scope,r.date,r.status,r.done])));
      root.querySelector('#repGen').addEventListener('click',()=>UI.modal({
        title:'Generate Report',
        body:`<div class="field"><label>Report type</label><select data-f="type"><option>Attendance</option><option>Finance</option><option>Report cards</option><option>Milestones</option><option>Operations</option></select></div>
          <div class="form-row">
            <div class="field"><label>Scope</label><select data-f="scope"><option>All campuses</option>${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Period</label><select data-f="period"><option>May 2026</option><option>Term 2</option><option>Year to date</option></select></div>
          </div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-purple" data-s>${MCIcon('sparkle')} Generate</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            const tints={Attendance:'t-green',Finance:'t-blue','Report cards':'t-purple',Milestones:'t-orange',Operations:'t-teal'};
            const run={name:v.type+' — '+v.period,type:v.type,scope:v.scope,date:'Generating now',
              status:'Generating',done:8,tint:tints[v.type]};
            DB.reportRuns.unshift(run);
            DB.log('Generated report',run.name,'info');
            close();UI.toast('Report queued — you\'ll be notified when it\'s ready');App.refresh();
            setTimeout(()=>{run.done=100;run.status='Completed';run.date='Generated May 18';
              if(App.route==='reports')App.refresh();UI.toast(run.name+' is ready 📊');},2600);
          });
        }
      }));
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
        20:[{t:"Principals' Meeting",c:'orange'},{t:'Gr R outing forms due',c:'teal'}],
        22:[{t:'Sports Day — Soshanguve 1',c:'green'}],
        24:[{t:'Parent Workshop — Mamelodi',c:'purple'}],
        26:[{t:'Planetarium trip — Gr R',c:'blue'}],
        28:[{t:'Mid Term Break begins',c:'red'}]};
      DB.customCal.forEach(ev=>{ (evByDay[ev.day]=evByDay[ev.day]||[]).push({t:ev.t,c:ev.c}); });
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
        ${UI.pageHead('Calendar','One calendar across all campuses — from sports days to term breaks.',
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
        body:`<div class="field"><label>Event name</label><input type="text" data-f="name" placeholder="e.g. Sports Day"></div>
          <div class="form-row">
            <div class="field"><label>Day (May 2026)</label><input type="number" data-f="day" value="25" min="1" max="31"></div>
            <div class="field"><label>Time</label><input type="text" data-f="time" value="08:00 AM"></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Audience</label><select data-f="aud"><option>All campuses</option>${DB.liveBranches().map(b=>`<option>${esc(b.name)}</option>`).join('')}</select></div>
            <div class="field"><label>Category</label><select data-f="cat"><option value="green">School event</option><option value="orange">Meeting</option><option value="purple">Parent engagement</option><option value="blue">Trip / outing</option><option value="red">Holiday / closure</option></select></div>
          </div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Create Event</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            const day=Math.min(31,Math.max(1,+v.day||25));
            if(!v.name){UI.toast('Give the event a name first','alert');return;}
            DB.customCal.push({day,t:v.name,c:v.cat});
            const tints={green:'t-green',orange:'t-orange',purple:'t-purple',blue:'t-blue',red:'t-red'};
            DB.events.push({mo:'MAY',dy:String(day),name:v.name,sub:v.aud,time:v.time,tint:tints[v.cat],people:0});
            DB.events.sort((a,b)=>+a.dy-+b.dy);
            DB.log('Created calendar event',v.name+' — May '+day,'ok');
            close();UI.toast('Event created and pushed to parent apps');App.refresh();
          });
        }
      }));
    }
  };
})();
