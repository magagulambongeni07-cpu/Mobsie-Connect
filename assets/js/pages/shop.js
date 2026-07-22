/* Mobsie Connect — Shop: Products, Orders, Inventory */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN, R=DB.fmtR;

  function productArt(p,seed){
    return `<svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" style="width:100%;height:110px;display:block">
      <defs><linearGradient id="pa${seed}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p.hue}" stop-opacity=".18"/><stop offset="1" stop-color="${p.hue}" stop-opacity=".38"/></linearGradient></defs>
      <rect width="200" height="140" fill="url(#pa${seed})"/>
      <circle cx="${40+seed*31%120}" cy="${30+seed*17%70}" r="26" fill="#fff" opacity=".5"/>
      <rect x="${70+seed*13%60}" y="${50+seed*7%40}" width="52" height="52" rx="14" fill="${p.hue}" opacity=".55"/>
    </svg>`;
  }

  Pages.products={
    render(){
      return `
        ${UI.pageHead('Products','School shop catalogue — uniforms, stationery and more, sold in the parent app.',
          `<button class="btn btn-primary" id="addProd">${MCIcon('plus')} Add Product</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'products',tint:'t-orange',label:'Active Products',value:String(DB.products.filter(p=>p.status!=='Hidden').length+16),deltaHtml:`<span class="delta flat">across 5 campus shops</span>`})}
          ${UI.statCard({icon:'orders',tint:'t-green',label:'Shop Revenue',value:'R86,400',deltaHtml:UI.delta(14,'up','this month')})}
          ${UI.statCard({icon:'trendUp',tint:'t-purple',label:'Best Seller',value:'Golf Shirt',deltaHtml:`<span class="delta flat">218 sold</span>`})}
          ${UI.statCard({icon:'alert',tint:'t-red',label:'Stock Alerts',value:String(DB.products.filter(p=>p.stock<20).length),deltaHtml:`<span class="delta flat">${DB.products.filter(p=>p.stock===0).length} out of stock</span>`})}
        </div>
        <div class="grid cards-4">${DB.products.map((p,i)=>`
          <div class="card" style="overflow:hidden">
            ${productArt(p,i+2)}
            <div style="padding:14px 16px">
              <div style="display:flex;align-items:flex-start;gap:8px">
                <div style="min-width:0"><div style="font-weight:700;color:var(--ink-900)">${esc(p.name)}</div>
                <div class="small muted">${p.cat}</div></div>
                <span style="margin-left:auto;font-weight:800;color:var(--ink-900)">${R(p.price)}</span>
              </div>
              <div class="divider" style="margin:11px 0 10px"></div>
              <div style="display:flex;align-items:center;gap:8px">
                ${UI.status(p.status)}
                <span class="small muted" style="margin-left:auto">${p.sold} sold</span>
                <button class="icon-btn" data-pmenu="${i}">${MCIcon('more')}</button>
              </div>
            </div>
          </div>`).join('')}</div>`;
    },
    mount(root){
      root.addEventListener('click',e=>{
        const b=e.target.closest('[data-pmenu]');
        if(!b) return;
        const p=DB.products[+b.dataset.pmenu];
        UI.menu(b,[
          {icon:'edit',label:'Edit product',onClick:()=>UI.modal({
            title:'Edit Product',
            body:`<div class="field"><label>Name</label><input type="text" data-f="name" value="${esc(p.name)}"></div>
              <div class="form-row">
                <div class="field"><label>Price (R)</label><input type="number" data-f="price" value="${p.price}"></div>
                <div class="field"><label>Category</label><select data-f="cat">${['Uniform','Stationery','Accessories','Books'].map(c=>`<option ${p.cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
              </div>`,
            foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Save</button>`,
            mount(r,close){
              r.querySelector('[data-x]').addEventListener('click',close);
              r.querySelector('[data-s]').addEventListener('click',()=>{
                const v=UI.formVals(r);
                Object.assign(p,{name:v.name||p.name,price:Math.round(+v.price)||p.price,cat:v.cat});
                close();UI.toast('Product updated');App.refresh();
              });
            }
          })},
          {icon:'inventory',label:'Adjust stock',onClick:()=>App.go('inventory')},
          {icon:'pause',label:p.status==='Hidden'?'Show in shop':'Hide from shop',onClick:()=>{
            p.status=p.status==='Hidden'?(p.stock===0?'Out of Stock':p.stock<20?'Low Stock':'Active'):'Hidden';
            UI.toast(p.status==='Hidden'?p.name+' hidden from the shop':p.name+' is live again');
            App.refresh();
          }},
        ],{align:'right'});
      });
      root.querySelector('#addProd').addEventListener('click',()=>UI.modal({
        title:'Add Product',
        body:`<div class="form-row">
            <div class="field"><label>Product name</label><input type="text" data-f="name" placeholder="e.g. Summer Hat"></div>
            <div class="field"><label>Category</label><select data-f="cat"><option>Uniform</option><option>Stationery</option><option>Accessories</option><option>Books</option></select></div></div>
          <div class="form-row">
            <div class="field"><label>Price (R)</label><input type="number" data-f="price" placeholder="0.00"></div>
            <div class="field"><label>Initial stock</label><input type="number" data-f="stock" placeholder="0"></div></div>
          <div class="field"><label>Available in</label><select data-f="avail"><option>All campus shops</option><option>Selected campuses</option></select></div>`,
        foot:`<button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" data-s>Add Product</button>`,
        mount(r,close){
          r.querySelector('[data-x]').addEventListener('click',close);
          r.querySelector('[data-s]').addEventListener('click',()=>{
            const v=UI.formVals(r);
            if(!v.name){UI.toast('Name the product first','alert');return;}
            const hues=['#F97316','#16A34A','#7C3AED','#2563EB','#0D9488','#DB2777'];
            const stock=Math.round(+v.stock)||0;
            DB.products.unshift({name:v.name,cat:v.cat,price:Math.round(+v.price)||100,stock,sold:0,
              status:stock===0?'Out of Stock':stock<20?'Low Stock':'Active',hue:hues[v.name.length%hues.length]});
            DB.log('Added product',v.name,'ok');
            close();UI.toast(v.name+' is live in the parent app shop');App.refresh();
          });
        }
      }));
    }
  };

  Pages.orders={
    render(){
      const rows=App.scoped(DB.ordersList);
      const tbl=UI.table({
        pageSize:9, rows,
        onRow:o=>UI.drawer({
          title:'Order '+o.id,
          body:`
            <div style="display:flex;gap:8px;margin-bottom:18px">${UI.status(o.status)}</div>
            ${UI.dl([['Customer',esc(o.parent)],['School',esc(o.school)],['Items',esc(o.items)],['Total',`<b>${R(o.total)}</b>`],['Placed',esc(o.date)],['Collection','At reception, main branch']])}
            <div class="divider"></div>
            <h4 style="margin-bottom:10px">Order timeline</h4>
            <div class="feed">
              <div class="feed-item"><span class="f-ic t-green">${MCIcon('check')}</span><div class="f-txt"><div class="f-main">Paid in app</div><div class="f-sub">${esc(o.date)}</div></div></div>
              <div class="feed-item"><span class="f-ic t-blue">${MCIcon('products')}</span><div class="f-txt"><div class="f-main">Being prepared</div><div class="f-sub">School shop team</div></div></div>
              <div class="feed-item"><span class="f-ic t-amber">${MCIcon('push')}</span><div class="f-txt"><div class="f-main">Parent notified when ready</div><div class="f-sub">Automatic push notification</div></div></div>
            </div>`,
          foot:`<button class="btn btn-ghost" id="ordSlip">${MCIcon('printer')} Packing Slip</button>
                ${o.status==='Processing'?`<button class="btn btn-green" id="ordReady">${MCIcon('check')} Mark Ready</button>`
                 :o.status==='Ready for Collection'?`<button class="btn btn-green" id="ordDone">${MCIcon('check')} Mark Collected</button>`:''}`,
          mount(root,close){
            root.querySelector('#ordSlip').addEventListener('click',()=>UI.downloadCSV('packing-slip-'+o.id+'.csv',
              ['Order','Customer','Campus','Items','Total (R)','Placed'],
              [[o.id,o.parent,o.school,o.items,o.total,o.date]]));
            const rd=root.querySelector('#ordReady');
            if(rd) rd.addEventListener('click',()=>{
              o.status='Ready for Collection';
              DB.log('Order ready',o.id+' — '+o.parent,'ok');
              close();UI.toast(o.parent+' notified — order ready for collection');App.refresh();
            });
            const dn=root.querySelector('#ordDone');
            if(dn) dn.addEventListener('click',()=>{
              o.status='Collected';
              close();UI.toast(o.id+' marked collected');App.refresh();
            });
          }
        }),
        columns:[
          {key:'id',label:'Order'},
          {key:'parent',label:'Customer',render:r=>UI.personCell(r.parent,r.school)},
          {key:'items',label:'Items'},
          {key:'total',label:'Total',num:true,render:r=>`<b>${R(r.total)}</b>`},
          {key:'date',label:'Placed'},
          {key:'status',label:'Status',render:r=>UI.status(r.status)},
        ],
      });
      Pages.orders._tid=UI.lastTableId();
      return `
        ${UI.pageHead('Orders','Shop orders paid in-app, collected at school.',
          `<button class="btn btn-ghost">${MCIcon('download')} Export</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'orders',tint:'t-green',label:'Orders This Month',value:F(412),deltaHtml:UI.delta(14,'up','vs April')})}
          ${UI.statCard({icon:'waiting',tint:'t-amber',label:'Awaiting Collection',value:String(DB.ordersList.filter(o=>o.status==='Ready for Collection').length+15),deltaHtml:`<span class="delta flat">parents notified</span>`})}
          ${UI.statCard({icon:'wallet',tint:'t-purple',label:'Avg Order Value',value:'R229',deltaHtml:UI.delta(3,'up','vs April')})}
          ${UI.statCard({icon:'refresh',tint:'t-blue',label:'Refund Rate',value:'0.8%',deltaHtml:`<span class="delta flat">4 refunds</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>Recent orders</h3></div><span class="spacer"></span>
          <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="oQ" placeholder="Search orders…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){ root.querySelector('#oQ').addEventListener('input',e=>UI.tableFilter(Pages.orders._tid,e.target.value)); }
  };

  Pages.inventory={
    render(){
      const rows=DB.products.map(p=>({...p,
        reorder:p.stock===0?'Reorder now':(p.stock<20?'Reorder soon':'Healthy'),
        value:p.stock*p.price}));
      const tbl=UI.table({
        pageSize:9, rows,
        columns:[
          {key:'name',label:'Product',render:r=>`<div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${r.cat}</div>`},
          {key:'stock',label:'In stock',num:true,render:r=>`<b style="color:${r.stock===0?'var(--red-600)':r.stock<20?'var(--amber-600)':'var(--ink-900)'};font-variant-numeric:tabular-nums">${r.stock}</b>`},
          {key:'sold',label:'Sold (term)',num:true},
          {key:'value',label:'Stock value',num:true,render:r=>R(r.value)},
          {key:'stock',label:'Level',sortable:false,render:r=>{
            const pct=Math.min(100,Math.round(r.stock/4));
            const tone=r.stock===0?'red':r.stock<20?'amber':'';
            return `<div style="display:flex;align-items:center;gap:10px;min-width:130px"><span class="meter ${tone}"><i style="width:${Math.max(3,pct)}%"></i></span></div>`;}},
          {key:'reorder',label:'Reorder',render:r=>UI.badge(r.reorder,r.reorder==='Healthy'?'green':r.reorder==='Reorder soon'?'amber':'red')},
          {label:'',sortable:false,render:r=>`<button class="btn btn-soft btn-sm" data-restock="${esc(r.name)}">Restock</button>`},
        ],
      });
      return `
        ${UI.pageHead('Inventory','Live stock levels across every school shop.',
          `<button class="btn btn-ghost">${MCIcon('download')} Stock Report</button>
           <button class="btn btn-primary">${MCIcon('plus')} Receive Stock</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'inventory',tint:'t-blue',label:'SKUs Tracked',value:String(DB.products.length+16),deltaHtml:`<span class="delta flat">5 campus shops</span>`})}
          ${UI.statCard({icon:'wallet',tint:'t-green',label:'Stock Value',value:DB.fmtRk(DB.products.reduce((a,p)=>a+p.stock*p.price,0)),deltaHtml:`<span class="delta flat">at retail price</span>`})}
          ${UI.statCard({icon:'alert',tint:'t-amber',label:'Low Stock',value:String(DB.products.filter(p=>p.stock>0&&p.stock<20).length),deltaHtml:`<span class="delta flat">reorder suggested</span>`})}
          ${UI.statCard({icon:'x',tint:'t-red',label:'Out of Stock',value:String(DB.products.filter(p=>p.stock===0).length),deltaHtml:`<span class="delta flat">orders paused</span>`})}
        </div>
        <div class="card"><div class="card-head"><div><h3>Stock levels</h3></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){
      root.addEventListener('click',e=>{
        const b=e.target.closest('[data-restock]');
        if(!b) return;
        const p=DB.products.find(x=>x.name===b.dataset.restock);
        if(p){
          p.stock+=50;
          p.status=p.stock<20?'Low Stock':(p.status==='Hidden'?'Hidden':'Active');
          DB.log('Restocked product',p.name+' (+50 units)','ok');
          UI.toast('50 units of '+p.name+' received into stock');App.refresh();
        }
      });
    }
  };
})();
