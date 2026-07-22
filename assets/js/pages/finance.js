/* Mobsie Connect — Finance: Payments, Invoices, Statements, Discounts */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN, R=DB.fmtR, Rk=DB.fmtRk;

  /* ---------- Payments ---------- */
  Pages.payments={
    render(){
      const rows=App.scoped(DB.payments);
      const rs=DB.revSeries;
      const tbl=UI.table({
        pageSize:9, rows,
        onRow:p=>UI.drawer({
          title:'Payment '+p.id,
          body:`
            <div style="display:flex;gap:8px;margin-bottom:18px">${UI.status(p.status)} ${UI.badge(p.method,'blue')}</div>
            <div style="font-size:30px;font-weight:800;color:var(--ink-900);letter-spacing:-.02em;margin-bottom:16px">${R(p.amount)}</div>
            ${UI.dl([['Parent',esc(p.parent)],['School',esc(p.school)],['Branch',esc(p.branch)],['Invoice',esc(p.ref)],['Date',esc(p.date)],['Method',esc(p.method)],['Gateway fee',R(Math.round(p.amount*0.029))]])}`,
          foot:`<button class="btn btn-ghost">${MCIcon('printer')} Receipt</button>${p.status==='Failed'?`<button class="btn btn-primary">${MCIcon('refresh')} Retry Payment</button>`:''}`
        }),
        columns:[
          {key:'id',label:'Reference'},
          {key:'parent',label:'Parent',render:r=>UI.personCell(r.parent,r.school)},
          {key:'amount',label:'Amount',num:true,render:r=>`<b>${R(r.amount)}</b>`},
          {key:'method',label:'Method'},
          {key:'date',label:'Date'},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      Pages.payments._tid=UI.lastTableId();
      const methods=[['Card',46,'#EA580C'],['Debit Order',28,'#7C3AED'],['EFT',18,'#16A34A'],['Cash / other',8,'#2563EB']];
      return `
        ${UI.pageHead('Payments','Money moving through the platform in real time.',
          `<button class="btn btn-ghost">${MCIcon('download')} Export</button>
           <button class="btn btn-green">${MCIcon('plus')} Record Payment</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'payments',tint:'t-green',label:'Collected This Month',value:'R2,450,800',deltaHtml:UI.delta(12.5,'up','vs last month')})}
          ${UI.statCard({icon:'waiting',tint:'t-amber',label:'Pending Settlement',value:'R84,300',deltaHtml:`<span class="delta flat">clears in 1–2 days</span>`})}
          ${UI.statCard({icon:'alert',tint:'t-red',label:'Failed Payments',value:'R23,150',deltaHtml:UI.delta(1.8,'down','improving')})}
          ${UI.statCard({icon:'creditUp',tint:'t-purple',label:'Success Rate',value:'96.8%',deltaHtml:UI.delta(0.4,'up','vs last month')})}
        </div>
        <div class="grid" style="grid-template-columns:1.7fr 1fr;margin-bottom:20px" id="payMid">
          ${UI.card('Collections this week',`
            ${UI.legend([{color:'#16A34A',label:'Collections',line:true}])}
            <div class="chart-box" style="margin-top:6px">${Charts.line({labels:rs.labels,series:[{name:'Collections',color:'#16A34A',data:rs.revenue.map(v=>Math.round(v/7))}],height:224})}</div>`)}
          ${UI.card('Payment methods',`
            ${methods.map(m=>`<div class="meter-row"><span class="m-lbl">${m[0]}</span><span class="meter"><i style="width:${m[1]}%;background:${m[2]}"></i></span><span class="m-val">${m[1]}%</span></div>`).join('')}
            <div class="divider"></div>
            <div class="small muted">Debit orders keep growing — <b style="color:var(--ink-900)">+6% this quarter</b>. Failed card retries recover <b style="color:var(--ink-900)">62%</b> automatically.</div>`,{sub:'Share of value · this month'})}
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Recent payments</h3></div><span class="spacer"></span>
            <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="payQ" placeholder="Search payments…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div>
        </div>
        <style>@media(max-width:1100px){#payMid{grid-template-columns:1fr}}</style>`;
    },
    mount(root){ root.querySelector('#payQ').addEventListener('input',e=>UI.tableFilter(Pages.payments._tid,e.target.value)); }
  };

  /* ---------- Invoices ---------- */
  Pages.invoices={
    render(){
      const rows=App.scoped(DB.invoices);
      const due=DB.invoices.filter(i=>i.status==='Due').length;
      const over=DB.invoices.filter(i=>i.status==='Overdue').length;
      const tbl=UI.table({
        pageSize:9, rows,
        onRow:inv=>UI.drawer({
          title:inv.id,
          body:`
            <div style="display:flex;gap:8px;margin-bottom:18px">${UI.status(inv.status)}</div>
            <div style="font-size:30px;font-weight:800;color:var(--ink-900);letter-spacing:-.02em;margin-bottom:16px">${R(inv.amount)}</div>
            ${UI.dl([['Billed to',esc(inv.parent)],['School',esc(inv.school)],['Description',esc(inv.desc)],['Issued',esc(inv.issued)],['Due',esc(inv.due)]])}
            <div class="divider"></div>
            <h4 style="margin-bottom:10px">Line items</h4>
            <table class="mc" style="min-width:0"><tbody>
              <tr><td>${esc(inv.desc)}</td><td class="num"><b>${R(inv.amount-120)}</b></td></tr>
              <tr><td>Mobsie app service fee</td><td class="num"><b>R120</b></td></tr>
              <tr><td class="cell-main">Total</td><td class="num cell-main">${R(inv.amount)}</td></tr>
            </tbody></table>`,
          foot:`<button class="btn btn-ghost">${MCIcon('download')} PDF</button>
                <button class="btn btn-ghost">${MCIcon('campaigns')} Resend</button>
                ${inv.status!=='Paid'?`<button class="btn btn-green">${MCIcon('check')} Mark Paid</button>`:''}`
        }),
        columns:[
          {key:'id',label:'Invoice'},
          {key:'parent',label:'Billed to',render:r=>UI.personCell(r.parent,r.school)},
          {key:'desc',label:'Description'},
          {key:'amount',label:'Amount',num:true,render:r=>`<b>${R(r.amount)}</b>`},
          {key:'due',label:'Due date'},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      Pages.invoices._tid=UI.lastTableId();
      return `
        ${UI.pageHead('Invoices','Automated billing for every family, every month.',
          `<button class="btn btn-ghost">${MCIcon('settings')} Billing Rules</button>
           <button class="btn btn-primary">${MCIcon('plus')} New Invoice</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'invoices',tint:'t-blue',label:'Issued This Month',value:F(18742),deltaHtml:`<span class="delta flat">auto-run May 18, 08:00</span>`})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Paid',value:'87%',deltaHtml:UI.delta(2.1,'up','vs last month')})}
          ${UI.statCard({icon:'waiting',tint:'t-amber',label:'Due',value:F(due*74),deltaHtml:`<span class="delta flat">value R412,900</span>`})}
          ${UI.statCard({icon:'alert',tint:'t-red',label:'Overdue',value:F(over*57),deltaHtml:`<span class="delta flat">value R320,450</span>`})}
        </div>
        <div class="card">
          <div class="card-head"><div><h3>All invoices</h3></div><span class="spacer"></span>
            <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="invQ" placeholder="Search invoices…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div>
        </div>`;
    },
    mount(root){ root.querySelector('#invQ').addEventListener('input',e=>UI.tableFilter(Pages.invoices._tid,e.target.value)); }
  };

  /* ---------- Statements ---------- */
  Pages.statements={
    render(){
      const rows=DB.schools.slice(0,14).map((s,i)=>({
        school:s.name, period:'May 2026', invoiced:s.mrr, collected:Math.round(s.mrr*(0.82+(i%9)*0.015)),
        fees:Math.round(s.mrr*0.029), payout:0, status:i<3?'Paid':(i<5?'Processing':'Scheduled'),
      })).map(r=>({...r,payout:r.collected-r.fees}));
      const tbl=UI.table({
        pageSize:8, rows,
        onRow:st=>UI.drawer({
          title:'Statement — '+st.school,
          body:`
            <div style="display:flex;gap:8px;margin-bottom:18px">${UI.badge(st.period,'purple')} ${UI.status(st.status)}</div>
            ${UI.dl([['Invoiced',R(st.invoiced)],['Collected',R(st.collected)],['Platform & gateway fees','−'+R(st.fees)],['Net payout',`<b style="color:var(--green-600)">${R(st.payout)}</b>`],['Payout account','FNB ····8821'],['Payout date','1 Jun 2026']])}
            <div class="divider"></div>
            ${UI.meterRow('Collection rate',Math.round(st.collected/st.invoiced*100))}`,
          foot:`<button class="btn btn-ghost">${MCIcon('download')} Download PDF</button><button class="btn btn-primary">${MCIcon('campaigns')} Email to Owner</button>`
        }),
        columns:[
          {key:'school',label:'School',render:r=>`<span class="cell-main">${esc(r.school)}</span>`},
          {key:'period',label:'Period'},
          {key:'invoiced',label:'Invoiced',num:true,render:r=>R(r.invoiced)},
          {key:'collected',label:'Collected',num:true,render:r=>R(r.collected)},
          {key:'fees',label:'Fees',num:true,render:r=>'−'+R(r.fees)},
          {key:'payout',label:'Net payout',num:true,render:r=>`<b style="color:var(--green-600)">${R(r.payout)}</b>`},
          {key:'status',label:'Payout',render:r=>UI.status(r.status)},
        ],
      });
      return `
        ${UI.pageHead('Statements','Monthly school statements and payout reconciliation.',
          `<button class="select">${MCIcon('calendar')} May 2026 ${MCIcon('chevDown')}</button>
           <button class="btn btn-primary">${MCIcon('download')} Download All</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'statements',tint:'t-purple',label:'Statements Generated',value:'128',deltaHtml:`<span class="delta flat">1 per school · May</span>`})}
          ${UI.statCard({icon:'payments',tint:'t-green',label:'Total Collected',value:Rk(DB.totals.mrr*0.87),deltaHtml:UI.delta(9.1,'up','vs April')})}
          ${UI.statCard({icon:'wallet',tint:'t-blue',label:'Payouts Scheduled',value:Rk(DB.totals.mrr*0.84),deltaHtml:`<span class="delta flat">runs 1 Jun</span>`})}
          ${UI.statCard({icon:'discounts',tint:'t-amber',label:'Platform Fees',value:Rk(DB.totals.mrr*0.029),deltaHtml:`<span class="delta flat">2.9% blended</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>School statements — May 2026</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    }
  };

  /* ---------- Discounts ---------- */
  Pages.discounts={
    render(){
      const tbl=UI.table({
        pageSize:8, rows:DB.discounts,
        columns:[
          {key:'code',label:'Code',render:r=>`<span class="badge t-orange" style="font-family:ui-monospace,monospace;font-weight:700">${r.code}</span>`},
          {key:'desc',label:'Description',render:r=>`<div class="cell-main">${esc(r.desc)}</div><div class="cell-sub">${esc(r.schools)}</div>`},
          {key:'type',label:'Benefit'},
          {key:'uses',label:'Uses',num:true,render:r=>`${F(r.uses)}<span class="muted"> / ${r.limit}</span>`},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
          {label:'',sortable:false,render:r=>`<button class="icon-btn" data-dmenu="${r.code}">${MCIcon('more')}</button>`},
        ],
      });
      return `
        ${UI.pageHead('Discounts','Sibling, staff and promotional discounts across the platform.',
          `<button class="btn btn-primary" id="newDisc">${MCIcon('plus')} Create Discount</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'discounts',tint:'t-orange',label:'Active Discounts',value:'4',deltaHtml:`<span class="delta flat">2 platform-wide</span>`})}
          ${UI.statCard({icon:'parents',tint:'t-purple',label:'Families Benefiting',value:F(888),deltaHtml:UI.delta(6,'up','this term')})}
          ${UI.statCard({icon:'wallet',tint:'t-amber',label:'Value This Month',value:'R186,400',deltaHtml:`<span class="delta flat">7.6% of billing</span>`})}
          ${UI.statCard({icon:'creditUp',tint:'t-green',label:'Retention Impact',value:'+3.8%',deltaHtml:`<span class="delta flat">discounted vs not</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>Discount codes</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){
      root.addEventListener('click',e=>{
        const b=e.target.closest('[data-dmenu]');
        if(b) UI.menu(b,[
          {icon:'edit',label:'Edit discount',onClick:()=>UI.toast('Edit '+b.dataset.dmenu)},
          {icon:'copy',label:'Duplicate',onClick:()=>UI.toast('Duplicated '+b.dataset.dmenu)},
          {icon:'pause',label:'Pause',onClick:()=>UI.toast('Paused '+b.dataset.dmenu)},
          '-',
          {icon:'trash',label:'Delete',danger:true,onClick:()=>UI.toast('Deleted '+b.dataset.dmenu)},
        ],{align:'right'});
      });
      root.querySelector('#newDisc').addEventListener('click',()=>UI.modal({
        title:'Create Discount',
        body:`<div class="form-row">
            <div class="field"><label>Code</label><input type="text" placeholder="e.g. SPRING10"></div>
            <div class="field"><label>Benefit</label><select><option>% off fees</option><option>Fixed amount off</option><option>Waive registration</option></select></div>
          </div>
          <div class="field"><label>Description</label><input type="text" placeholder="What is this discount for?"></div>
          <div class="form-row">
            <div class="field"><label>Applies to</label><select><option>All schools</option><option>Selected schools</option><option>One school</option></select></div>
            <div class="field"><label>Usage limit</label><input type="number" placeholder="Unlimited"></div>
          </div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Create Discount</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{close();UI.toast('Discount created and live');});
        }
      }));
    }
  };
})();
