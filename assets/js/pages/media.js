/* Mobsie Connect — Media: Gallery albums + Media Library */
window.Pages=window.Pages||{};
(function(){
  const esc=UI.esc, F=DB.fmtN;

  // Decorative album art — layered SVG, no external images
  function albumArt(a,seed){
    return `<svg class="g-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="ga${seed}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a.hue2}"/><stop offset="1" stop-color="${a.hue1}"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#ga${seed})"/>
      <circle cx="${60+seed*37%280}" cy="${40+seed*53%180}" r="60" fill="#fff" opacity=".14"/>
      <circle cx="${300-seed*29%200}" cy="${210-seed*41%120}" r="90" fill="#fff" opacity=".10"/>
      <circle cx="${180+seed*17%160}" cy="${150+seed*23%100}" r="34" fill="#fff" opacity=".18"/>
      <path d="M0 240 Q100 ${200+seed*13%50} 200 235 T400 225 V300 H0 Z" fill="#fff" opacity=".16"/>
    </svg>`;
  }

  Pages.gallery={
    render(){
      const rows=App.school()?DB.albums.filter(a=>a.school===App.school().name):DB.albums;
      return `
        ${UI.pageHead('Gallery','Class and event photo albums — parents only ever see their own child\'s classes.',
          `<button class="btn btn-ghost">${MCIcon('settings')} Approval Rules</button>
           <button class="btn btn-primary" id="upAlbum">${MCIcon('upload')} Upload Album</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'gallery',tint:'t-orange',label:'Photos This Month',value:F(4382),deltaHtml:UI.delta(18,'up','vs April')})}
          ${UI.statCard({icon:'media',tint:'t-purple',label:'Albums',value:F(216),deltaHtml:`<span class="delta flat">across 349 branches</span>`})}
          ${UI.statCard({icon:'eye',tint:'t-blue',label:'Parent Views',value:F(96410),deltaHtml:UI.delta(22,'up','this month')})}
          ${UI.statCard({icon:'check',tint:'t-green',label:'Awaiting Approval',value:'38',deltaHtml:`<span class="delta flat">auto-blur enabled</span>`})}
        </div>
        <div class="gallery-grid">${rows.map((a,i)=>`
          <div class="g-item" data-album="${i}">
            ${albumArt(a,i+3)}
            <div class="g-cap"><div class="g-nm">${esc(a.name)}</div>
            <div class="g-sub">${esc(a.branch)} · ${a.count} photos · ${a.date}</div></div>
          </div>`).join('')}
        </div>`;
    },
    mount(root){
      root.querySelectorAll('[data-album]').forEach(el=>el.addEventListener('click',()=>{
        const a=DB.albums[+el.dataset.album];
        UI.drawer({
          title:a.name,
          body:`
            <div style="border-radius:16px;overflow:hidden;position:relative;aspect-ratio:16/9;margin-bottom:18px">${albumArt(a,+el.dataset.album+3)}</div>
            ${UI.dl([['School',esc(a.school)],['Branch',esc(a.branch)],['Photos',String(a.count)],['Uploaded',esc(a.date)],['Visibility','Parents of tagged classes'],['Approved by','Branch principal']])}
            <div class="divider"></div>
            <div class="grid cards-3" style="gap:8px">${Array.from({length:6},(_,i)=>`
              <div style="border-radius:12px;overflow:hidden;aspect-ratio:1;position:relative">${albumArt(a,i*7+2)}</div>`).join('')}</div>`,
          foot:`<button class="btn btn-ghost">${MCIcon('download')} Download</button>
                <button class="btn btn-primary">${MCIcon('campaigns')} Share to Parents</button>`,
        });
      }));
      root.querySelector('#upAlbum').addEventListener('click',()=>UI.toast('Drop photos to upload — approval flow starts automatically'));
    }
  };

  Pages.media={
    render(){
      const ICONS={Video:'video',Image:'gallery',Audio:'mic',Document:'file'};
      const TINTS={Video:'t-purple',Image:'t-orange',Audio:'t-teal',Document:'t-blue'};
      const tbl=UI.table({
        pageSize:8, rows:DB.mediaFiles,
        columns:[
          {key:'name',label:'File',render:r=>`<div class="person-cell"><span class="f-ic ${TINTS[r.type]}" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center">${MCIcon(ICONS[r.type])}</span><div class="pc-txt"><div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${r.type} · ${r.size}</div></div></div>`},
          {key:'school',label:'School'},
          {key:'by',label:'Uploaded by',render:r=>UI.personCell(r.by)},
          {key:'date',label:'Date'},
          {label:'',sortable:false,render:()=>`<span style="display:inline-flex;gap:4px"><button class="icon-btn">${MCIcon('download')}</button><button class="icon-btn">${MCIcon('copy')}</button><button class="icon-btn">${MCIcon('trash')}</button></span>`},
        ],
      });
      return `
        ${UI.pageHead('Media Library','Every file behind the platform — branded assets, videos, documents.',
          `<button class="btn btn-primary">${MCIcon('upload')} Upload Files</button>`)}
        <div class="grid cards-4" style="margin-bottom:20px">
          ${UI.statCard({icon:'database',tint:'t-purple',label:'Storage Used',value:'1.4 TB',deltaHtml:`<span class="delta flat">of 5 TB platform pool</span>`})}
          ${UI.statCard({icon:'media',tint:'t-orange',label:'Total Files',value:F(48226),deltaHtml:UI.delta(6,'up','this month')})}
          ${UI.statCard({icon:'video',tint:'t-blue',label:'Videos',value:F(2114),deltaHtml:`<span class="delta flat">312 GB</span>`})}
          ${UI.statCard({icon:'file',tint:'t-teal',label:'Documents',value:F(9834),deltaHtml:`<span class="delta flat">shared with schools</span>`})}
        </div>
        <div class="card" style="margin-bottom:20px"><div class="card-body">
          ${UI.meterRow('Photos & albums',52,'orange',' %')}
          ${UI.meterRow('Video',23,'purple',' %')}
          ${UI.meterRow('Documents',16,'blue',' %')}
          ${UI.meterRow('Audio & other',9,'teal',' %')}
        </div></div>
        <div class="card"><div class="card-head"><div><h3>Recent uploads</h3></div><span class="spacer"></span>
          <div class="toolbar" style="margin:0"><div class="input-wrap" style="min-width:220px">${MCIcon('search')}<input id="mQ" placeholder="Search files…"></div></div></div>
          <div class="card-body" style="padding:0;padding-top:8px">${tbl}</div></div>`;
    },
    mount(root){ root.querySelector('#mQ').addEventListener('input',e=>UI.tableFilter(UI.lastTableId(),e.target.value)); }
  };
})();
