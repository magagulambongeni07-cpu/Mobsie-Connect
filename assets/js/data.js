/* Mobsie Connect — deterministic mock data (seeded, same on every load) */
(function(){
  // --- Seeded RNG -------------------------------------------------------
  let _s = 20260518;
  function rnd(){ _s|=0; _s=_s+0x6D2B79F5|0; let t=Math.imul(_s^_s>>>15,1|_s);
    t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
  const ri=(a,b)=>Math.floor(rnd()*(b-a+1))+a;
  const pick=a=>a[Math.floor(rnd()*a.length)];

  // --- Pools ------------------------------------------------------------
  const FIRST=['Thandi','Lebo','Sipho','Bongani','Naledi','Kagiso','Palesa','Tshepo','Zanele','Ayanda','Nomvula','Katlego','Karabo','Mpho','Refilwe','Themba','Lerato','Boitumelo','Neo','Amahle','Sibusiso','Nandi','Tumelo','Dineo','Khanyi','Lwazi','Precious','Gugu','Vusi','Zodwa','Prince','Busisiwe','Andile','Ntombi','Sello','Mandla','Portia','Musa','Nthabiseng','Solly'];
  const LAST=['Motaung','Dlamini','Nkosi','Mokoena','Khumalo','Mahlangu','Ndlovu','Sithole','Mabaso','Zwane','Tshabalala','Molefe','Maluleke','Baloyi','Chauke','Ngobeni','Tau','Mnisi','Radebe','Sibiya','Mthembu','Maseko','Nxumalo','Shabangu','Kekana','Modise','Phiri','Mashaba','Sekhukhune','Lekota'];
  const CITIES=['Pretoria','Soshanguve','Mamelodi','Midrand','Centurion','Johannesburg','Sandton','Soweto','Tembisa','Hammanskraal','Atteridgeville','Rustenburg','Polokwane','eMalahleni','Mbombela','Katlehong','Vosloorus','Randburg','Roodepoort','Benoni'];
  const SNAME=['Little Stars','Bright Kids','Hebron','Future Leaders','Sunshine Kids','Rainbow Bridge','Happy Hearts','Growing Minds','Tiny Tots','Bumble Bees','Clever Cubs','Golden Acorns','Busy Bees','Smart Start','Kiddies Corner','Blossom Tree','Ubuntu Kids','Masibambane','Thuto Ke Lesedi','Bokamoso','Lesedi','Ithemba','Sizanani','Khanya','Realeboga','Wonder World','Purple Door','Green Leaf','New Dawn','Star Seeds','Amogelang','Kopano','Bright Beginnings','Small Wonders','Dinaledi','Reatlegile'];
  const STYPE=['Academy','Preschool','Early Learning Centre','Day Care','Montessori','Educare Centre','Nursery School','Kids Academy'];
  const GRADES=['Playgroup','Nursery','Grade RR','Grade R','Grade 1','Grade 2'];
  const AV=['#F97316','#16A34A','#7C3AED','#2563EB','#0D9488','#DB2777','#D97706','#DC2626'];
  const PLANS=[['Enterprise',4999],['Growth',2499],['Starter',999]];

  const name=()=>pick(FIRST)+' '+pick(LAST);
  const initials=n=>n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const avColor=n=>AV[(n.length*7+n.charCodeAt(0))%AV.length];
  const email=n=>n.toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,'.')+'@'+pick(['gmail.com','outlook.com','yahoo.com','icloud.com']);
  const phone=()=>'0'+pick(['61','62','71','72','73','82','83','84'])+' '+ri(100,999)+' '+String(ri(0,9999)).padStart(4,'0');

  // --- Formatters (exported) -------------------------------------------
  const fmtN=n=>n.toLocaleString('en-ZA');
  const fmtR=n=>'R'+Math.round(n).toLocaleString('en-ZA');
  const fmtRk=n=>n>=1e6?'R'+(n/1e6).toFixed(1)+'M':n>=1e3?'R'+(n/1e3).toFixed(0)+'K':'R'+Math.round(n);

  // --- Schools (128) ----------------------------------------------------
  const seedSchools=[
    ['Little Stars Academy','Pretoria',98],['Bright Kids Academy','Midrand',96],
    ['Hebron Preschool','Soshanguve',94],['Future Leaders Academy','Centurion',93],
    ['Sunshine Kids','Johannesburg',92],
  ];
  const usedNames=new Set(seedSchools.map(s=>s[0]));
  const schools=[];
  for(let i=0;i<128;i++){
    let nm,city,perf;
    if(i<seedSchools.length){ [nm,city,perf]=seedSchools[i]; }
    else{
      let guard=0;
      do{ nm=pick(SNAME)+' '+pick(STYPE); guard++; }while(usedNames.has(nm)&&guard<40);
      if(usedNames.has(nm)) nm=nm+' '+pick(CITIES);
      city=pick(CITIES); perf=ri(58,91);
    }
    usedNames.add(nm);
    const owner=name();
    const nBr=i<5?ri(3,6):ri(1,5);
    const students=i<5?ri(360,560):ri(70,320);
    const teachers=Math.max(4,Math.round(students/ri(12,18)));
    const plan=i<5?PLANS[0]:pick(PLANS);
    const status=i<5?'Active':(rnd()<.82?'Active':(rnd()<.6?'Trial':'Suspended'));
    schools.push({
      id:'sch-'+(i+1), name:nm, city, owner, ownerEmail:email(owner), phone:phone(),
      plan:plan[0], planFee:plan[1], status, perf,
      branches:nBr, students, parents:Math.round(students*.78), teachers,
      mrr:plan[1]+students*ri(28,42),
      joined:`${pick(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])} ${ri(2021,2026)}`,
      color:AV[i%AV.length], initials:initials(nm),
      storageGB:ri(2,84), seats:teachers+ri(2,8),
    });
  }

  // --- Branches ---------------------------------------------------------
  const branches=[];
  schools.forEach(s=>{
    const cities=[...new Set([s.city,...Array.from({length:s.branches*2},()=>pick(CITIES))])].slice(0,s.branches);
    while(cities.length<s.branches) cities.push(pick(CITIES)+' '+(cities.length+1));
    cities.forEach((c,j)=>{
      branches.push({
        id:'br-'+branches.length, schoolId:s.id, school:s.name, name:c+' Branch', city:c,
        principal:name(), students:Math.round(s.students/s.branches)+ri(-12,12),
        teachers:Math.max(2,Math.round(s.teachers/s.branches)),
        revenue:Math.round(s.mrr/s.branches), attendance:ri(84,97), phone:phone(),
        status:j===0||rnd()<.9?'Active':'Onboarding',
      });
    });
  });

  // --- Aggregates -------------------------------------------------------
  const totals={
    schools:schools.length,
    branches:branches.length,
    students:schools.reduce((a,s)=>a+s.students,0),
    parents:schools.reduce((a,s)=>a+s.parents,0),
    teachers:schools.reduce((a,s)=>a+s.teachers,0),
    mrr:schools.reduce((a,s)=>a+s.mrr,0),
  };

  // --- People (visible samples, linked to first 12 schools) -------------
  const sample=schools.slice(0,12);
  const brOf=sid=>branches.filter(b=>b.schoolId===sid);
  const teachers=[],parents=[],learners=[];
  for(let i=0;i<42;i++){
    const s=pick(sample), b=pick(brOf(s.id));
    const n=name();
    teachers.push({id:'t-'+i,name:n,email:email(n),phone:phone(),school:s.name,schoolId:s.id,branch:b.name,
      grade:pick(GRADES),cls:pick(GRADES)+' '+pick(['A','B','C']),students:ri(14,26),
      years:ri(1,15),rating:(ri(38,50)/10).toFixed(1),status:rnd()<.92?'Active':'On Leave'});
  }
  for(let i=0;i<48;i++){
    const s=pick(sample), b=pick(brOf(s.id));
    const n=name();
    parents.push({id:'p-'+i,name:n,email:email(n),phone:phone(),school:s.name,schoolId:s.id,branch:b.name,
      children:ri(1,3),balance:rnd()<.7?0:ri(450,8200),status:rnd()<.9?'Active':'Overdue',
      joined:`${pick(['Jan','Feb','Mar','Apr','May'])} ${ri(2023,2026)}`});
  }
  for(let i=0;i<56;i++){
    const s=pick(sample), b=pick(brOf(s.id)); const p=pick(parents);
    const n=pick(FIRST)+' '+p.name.split(' ')[1];
    learners.push({id:'l-'+i,name:n,school:s.name,schoolId:s.id,branch:b.name,grade:pick(GRADES),
      cls:pick(['A','B','C']),parent:p.name,age:ri(2,7),attendance:ri(82,99),
      fees:rnd()<.78?'Paid':'Outstanding',status:rnd()<.95?'Enrolled':'On Hold'});
  }

  // --- Admissions -------------------------------------------------------
  const APP_STATUS=['Pending Review','Documents Required','Interview Scheduled','Approved','Rejected'];
  const appCounts=[68,32,24,20,12]; // totals shown on dashboard donut (156)
  const applications=[];
  for(let i=0;i<34;i++){
    const s=pick(sample), b=pick(brOf(s.id)); const pn=name();
    const child=pick(FIRST)+' '+pn.split(' ')[1];
    applications.push({id:'APP-'+String(1042+i),child,parent:pn,email:email(pn),phone:phone(),
      school:s.name,schoolId:s.id,branch:b.name,grade:pick(GRADES),
      status:i<8?'Pending Review':pick(APP_STATUS),
      date:`May ${ri(2,18)}, 2026`,docs:ri(2,6)});
  }
  const interviews=Array.from({length:12},(_,i)=>{
    const a=pick(applications);
    return {id:'INT-'+(201+i),child:a.child,parent:a.parent,school:a.school,branch:a.branch,grade:a.grade,
      date:`May ${ri(19,29)}, 2026`,time:`${ri(8,14)}:${pick(['00','30'])}`,
      interviewer:name(),mode:pick(['In-person','Virtual']),status:pick(['Scheduled','Scheduled','Confirmed','Completed'])};
  });
  const waitingList=Array.from({length:15},(_,i)=>{
    const s=pick(sample); const pn=name();
    return {id:'WL-'+(88+i),child:pick(FIRST)+' '+pn.split(' ')[1],parent:pn,school:s.name,branch:pick(brOf(s.id)).name,
      grade:pick(GRADES),position:i+1,since:`${pick(['Feb','Mar','Apr'])} ${ri(3,28)}, 2026`,priority:pick(['Standard','Standard','Sibling','Staff Child'])};
  });

  // --- Finance ----------------------------------------------------------
  const payMethods=['Card','EFT','Debit Order','Cash','SnapScan'];
  const payments=Array.from({length:36},(_,i)=>{
    const p=pick(parents);
    return {id:'PAY-'+String(9032-i),parent:p.name,school:p.school,branch:p.branch,
      amount:ri(9,58)*50,method:pick(payMethods),date:`May ${ri(1,18)}, 2026`,
      status:rnd()<.86?'Successful':(rnd()<.5?'Pending':'Failed'),ref:'INV-'+String(880-i).padStart(6,'0')};
  });
  const invoices=Array.from({length:32},(_,i)=>{
    const p=pick(parents);
    const st=rnd()<.62?'Paid':(rnd()<.55?'Due':'Overdue');
    return {id:'INV-'+String(880-i).padStart(6,'0'),parent:p.name,school:p.school,branch:p.branch,
      desc:pick(['Monthly Fees — May','Registration Fee','Aftercare — May','Stationery Pack','Uniform Order','School Trip — Zoo']),
      amount:ri(9,64)*50,issued:`May ${ri(1,12)}, 2026`,due:`May ${ri(15,31)}, 2026`,status:st};
  });
  const discounts=[
    {code:'SIBLING10',desc:'Sibling discount — 2nd child',type:'10% off fees',uses:214,limit:'Unlimited',status:'Active',schools:'All schools'},
    {code:'EARLYBIRD26',desc:'2026 early registration',type:'R500 off',uses:98,limit:'500',status:'Active',schools:'All schools'},
    {code:'STAFF50',desc:'Staff children',type:'50% off fees',uses:41,limit:'Unlimited',status:'Active',schools:'All schools'},
    {code:'WINTER15',desc:'Winter enrolment promo',type:'15% off first month',uses:67,limit:'200',status:'Scheduled',schools:'Selected (12)'},
    {code:'HEBRON5',desc:'Hebron loyalty families',type:'5% off fees',uses:156,limit:'Unlimited',status:'Active',schools:'Hebron Preschool'},
    {code:'OPENDAY24',desc:'Open day sign-up promo',type:'R250 off registration',uses:312,limit:'312',status:'Expired',schools:'All schools'},
  ];

  // --- Communications ---------------------------------------------------
  const conversations=Array.from({length:10},(_,i)=>{
    const p=pick(parents);
    const msgs=[];
    const openers=['Good morning! I wanted to ask about the school trip next week.','Hi, is the aftercare programme running this Friday?','Hello, my child will be absent tomorrow due to a doctor\'s appointment.','Hi there — I haven\'t received this month\'s invoice yet.','Good day, can I update my contact details on the app?'];
    msgs.push({dir:'in',text:pick(openers),time:`0${ri(8,9)}:${ri(10,59)}`});
    msgs.push({dir:'out',text:'Good morning! Thanks for reaching out — let me check that for you right away. 😊',time:`0${ri(8,9)}:${ri(10,59)}`});
    msgs.push({dir:'in',text:'Thank you so much, I appreciate it!',time:`${ri(10,11)}:${ri(10,59)}`});
    msgs.push({dir:'out',text:'All sorted! You should see the update in your Mobsie app now. Have a lovely day!',time:`${ri(10,11)}:${ri(10,59)}`});
    return {id:'c-'+i,who:p.name,school:p.school,branch:p.branch,unread:i<3?ri(1,4):0,
      time:i<4?`${ri(2,55)}m`:`${ri(1,9)}h`,msgs,preview:msgs[msgs.length-1].text};
  });
  const newsletters=[
    {title:'May Updates',audience:'Entire Platform',sent:'May 17, 2026',recipients:18742,openRate:64,status:'Sent'},
    {title:'Winter Uniform Reminder',audience:'All Schools',sent:'May 12, 2026',recipients:18102,openRate:58,status:'Sent'},
    {title:'Sports Day — Hebron',audience:'Hebron Preschool',sent:'May 9, 2026',recipients:412,openRate:81,status:'Sent'},
    {title:'Term 2 Calendar',audience:'Entire Platform',sent:'Apr 28, 2026',recipients:17960,openRate:71,status:'Sent'},
    {title:'June Holiday Programme',audience:'Gauteng schools',sent:'—',recipients:0,openRate:0,status:'Draft'},
  ];
  const pushLog=[
    {title:'Gate closes 17:30 today ⏰',audience:'Little Stars Academy',time:'Today, 14:02',delivered:1834,opened:1102,status:'Delivered'},
    {title:'New gallery photos 📸',audience:'Soshanguve Branch',time:'Today, 11:20',delivered:396,opened:301,status:'Delivered'},
    {title:'Invoice ready — May fees',audience:'Entire Platform',time:'Yesterday, 08:00',delivered:18510,opened:12440,status:'Delivered'},
    {title:'Sports Day this Friday! 🏆',audience:'Hebron Preschool',time:'May 16, 09:12',delivered:405,opened:355,status:'Delivered'},
    {title:'Load shedding: early pickup',audience:'Mamelodi Branch',time:'May 15, 12:45',delivered:288,opened:266,status:'Delivered'},
  ];
  const smsLog=[
    {to:'All parents — Bright Kids',msg:'Reminder: Parent meeting tomorrow 18:00 in the main hall.',time:'Today, 12:30',count:1289,status:'Delivered'},
    {to:'Overdue accounts (All)',msg:'Friendly reminder: your May invoice is due. Pay in the Mobsie app.',time:'Yesterday, 09:00',count:684,status:'Delivered'},
    {to:'Grade R parents — Hebron',msg:'Grade R outing to the planetarium on 26 May. Permission slips due Friday.',time:'May 15, 10:15',count:96,status:'Delivered'},
    {to:'All parents — Sunshine Kids',msg:'School closed Monday 25 May (staff training). Aftercare available.',time:'May 14, 14:40',count:822,status:'Delivered'},
  ];
  const campaigns=[
    {name:'2027 Enrolment Drive',subject:'Secure your child\'s place for 2027 🎒',audience:'Waiting list + site leads',sent:12408,openRate:47,clickRate:12,status:'Running'},
    {name:'May Fee Reminder',subject:'Your May statement is ready',audience:'All active parents',sent:18510,openRate:69,clickRate:31,status:'Completed'},
    {name:'Winter Holiday Club',subject:'Fun-filled winter holiday programme ❄️',audience:'All schools — opt-in',sent:15877,openRate:52,clickRate:18,status:'Completed'},
    {name:'Refer-a-Friend',subject:'Give R500, get R500',audience:'Engaged parents (90d)',sent:9204,openRate:44,clickRate:9,status:'Paused'},
  ];
  const feedback=Array.from({length:9},(_,i)=>{
    const p=pick(parents);
    const txt=['The new app update is fantastic — love the gallery!','Please add more vegetarian lunch options.','Teacher Naledi has been wonderful with my son.','Pickup queue at the Pretoria branch is too slow on Fridays.','Could we get invoices as PDF downloads?','The sports day was beautifully organised. Thank you!','More notice for casual days please.','Homework updates arrive quite late in the evening.','Reception staff at Midrand are always so friendly.'][i];
    return {id:'FB-'+(301+i),who:p.name,school:p.school,rating:ri(3,5),text:txt,
      date:`May ${ri(8,18)}, 2026`,status:i<2?'New':pick(['Reviewed','Responded','Reviewed']),topic:pick(['App','Food','Staff','Operations','Billing','Events'])};
  });

  // --- Media ------------------------------------------------------------
  const albums=[
    {name:'Sports Day 2026',school:'Hebron Preschool',branch:'Soshanguve Branch',count:84,date:'May 16, 2026',hue1:'#F97316',hue2:'#FDBA74'},
    {name:'Grade R Farm Trip',school:'Little Stars Academy',branch:'Pretoria Branch',count:56,date:'May 14, 2026',hue1:'#16A34A',hue2:'#86EFAC'},
    {name:'Art Week Exhibition',school:'Bright Kids Academy',branch:'Midrand Branch',count:41,date:'May 12, 2026',hue1:'#7C3AED',hue2:'#C4B5FD'},
    {name:'Mother\'s Day Tea',school:'Sunshine Kids',branch:'Johannesburg Branch',count:63,date:'May 10, 2026',hue1:'#DB2777',hue2:'#F9A8D4'},
    {name:'Science Fun Day',school:'Future Leaders Academy',branch:'Centurion Branch',count:38,date:'May 8, 2026',hue1:'#2563EB',hue2:'#93C5FD'},
    {name:'Autumn Picnic',school:'Hebron Preschool',branch:'Mamelodi Branch',count:47,date:'May 5, 2026',hue1:'#D97706',hue2:'#FCD34D'},
    {name:'Book Character Day',school:'Little Stars Academy',branch:'Pretoria Branch',count:72,date:'Apr 30, 2026',hue1:'#0D9488',hue2:'#5EEAD4'},
    {name:'Graduation Rehearsal',school:'Bright Kids Academy',branch:'Sandton Branch',count:29,date:'Apr 26, 2026',hue1:'#DC2626',hue2:'#FCA5A5'},
  ];
  const mediaFiles=[
    {name:'sports-day-highlights.mp4',type:'Video',size:'248 MB',school:'Hebron Preschool',by:'Sipho Dlamini',date:'May 16, 2026'},
    {name:'newsletter-may-banner.png',type:'Image',size:'1.2 MB',school:'Platform',by:'Thandi Admin',date:'May 15, 2026'},
    {name:'grade-r-song.mp3',type:'Audio',size:'6.4 MB',school:'Little Stars Academy',by:'Naledi Khumalo',date:'May 14, 2026'},
    {name:'winter-menu-2026.pdf',type:'Document',size:'840 KB',school:'Platform',by:'Thandi Admin',date:'May 13, 2026'},
    {name:'art-week-collage.jpg',type:'Image',size:'3.1 MB',school:'Bright Kids Academy',by:'Palesa Nkosi',date:'May 12, 2026'},
    {name:'fire-drill-notice.pdf',type:'Document',size:'220 KB',school:'Sunshine Kids',by:'Kagiso Zwane',date:'May 11, 2026'},
    {name:'open-day-promo.mp4',type:'Video',size:'96 MB',school:'Platform',by:'Thandi Admin',date:'May 9, 2026'},
    {name:'mothers-day-tea.jpg',type:'Image',size:'2.7 MB',school:'Sunshine Kids',by:'Zanele Mabaso',date:'May 10, 2026'},
  ];

  // --- Shop -------------------------------------------------------------
  const products=[
    {name:'Winter Tracksuit',cat:'Uniform',price:420,stock:186,sold:342,status:'Active',hue:'#F97316'},
    {name:'School Golf Shirt',cat:'Uniform',price:180,stock:322,sold:518,status:'Active',hue:'#16A34A'},
    {name:'Mobsie Backpack',cat:'Accessories',price:350,stock:74,sold:265,status:'Active',hue:'#7C3AED'},
    {name:'Stationery Pack — Gr R',cat:'Stationery',price:260,stock:12,sold:410,status:'Low Stock',hue:'#2563EB'},
    {name:'Sun Hat',cat:'Uniform',price:95,stock:240,sold:388,status:'Active',hue:'#D97706'},
    {name:'Art Smock',cat:'Uniform',price:120,stock:0,sold:198,status:'Out of Stock',hue:'#DB2777'},
    {name:'Water Bottle 500ml',cat:'Accessories',price:85,stock:410,sold:602,status:'Active',hue:'#0D9488'},
    {name:'Reader Set — Level 1',cat:'Books',price:310,stock:58,sold:144,status:'Active',hue:'#DC2626'},
  ];
  const ordersList=Array.from({length:22},(_,i)=>{
    const p=pick(parents), pr=pick(products), qty=ri(1,3);
    return {id:'ORD-'+String(4410-i),parent:p.name,school:p.school,items:qty+' × '+pr.name,
      total:pr.price*qty,date:`May ${ri(8,18)}, 2026`,
      status:pick(['Processing','Ready for Collection','Collected','Collected','Processing'])};
  });

  // --- Documents / support / users / audit ------------------------------
  const documentsList=[
    {name:'2026 Enrolment Policy.pdf',folder:'Policies',size:'1.4 MB',by:'Thandi Admin',date:'May 12, 2026',shared:'All schools'},
    {name:'POPIA Compliance Pack.zip',folder:'Compliance',size:'12 MB',by:'Thandi Admin',date:'May 8, 2026',shared:'School owners'},
    {name:'Teacher Onboarding Guide.docx',folder:'HR',size:'860 KB',by:'Lerato Mokoena',date:'May 6, 2026',shared:'All schools'},
    {name:'Fee Structure 2026.xlsx',folder:'Finance',size:'240 KB',by:'Prince Tau',date:'Apr 30, 2026',shared:'Finance managers'},
    {name:'Emergency Procedures.pdf',folder:'Safety',size:'2.2 MB',by:'Thandi Admin',date:'Apr 24, 2026',shared:'All branches'},
    {name:'Marketing Brand Kit.zip',folder:'Marketing',size:'48 MB',by:'Ayanda Sithole',date:'Apr 18, 2026',shared:'Platform team'},
    {name:'Curriculum Map — Term 2.pdf',folder:'Academics',size:'3.6 MB',by:'Naledi Khumalo',date:'Apr 15, 2026',shared:'All teachers'},
  ];
  const tickets=[
    {id:'TIC-1208',subject:'Cannot upload gallery photos',school:'Hebron Preschool',by:'Sipho Dlamini',priority:'High',status:'Open',age:'2h',agent:'Unassigned'},
    {id:'TIC-1207',subject:'Invoice totals not matching statement',school:'Bright Kids Academy',by:'Prince Tau',priority:'Urgent',status:'In Progress',age:'5h',agent:'Katlego M.'},
    {id:'TIC-1206',subject:'Add new branch — Rustenburg',school:'Future Leaders Academy',by:'Mpho Baloyi',priority:'Normal',status:'In Progress',age:'1d',agent:'Katlego M.'},
    {id:'TIC-1205',subject:'Parent app login loop on Android',school:'Sunshine Kids',by:'Zanele Mabaso',priority:'High',status:'Open',age:'1d',agent:'Unassigned'},
    {id:'TIC-1204',subject:'Bulk import learners from Excel',school:'Little Stars Academy',by:'Lebo Motaung',priority:'Normal',status:'Waiting on Customer',age:'2d',agent:'Refilwe N.'},
    {id:'TIC-1203',subject:'Change banking details for payouts',school:'Ubuntu Kids Educare Centre',by:'Themba Nxumalo',priority:'Normal',status:'Resolved',age:'3d',agent:'Katlego M.'},
    {id:'TIC-1202',subject:'SMS credits not topping up',school:'Rainbow Bridge Academy',by:'Dineo Phiri',priority:'High',status:'Resolved',age:'4d',agent:'Refilwe N.'},
  ];
  const adminUsers=[
    {name:'Thandi Admin',email:'thandi@mobsie.co.za',role:'Super Admin',scope:'Entire platform',last:'Now',status:'Active'},
    {name:'Katlego Modise',email:'katlego@mobsie.co.za',role:'Support Lead',scope:'Entire platform',last:'12m ago',status:'Active'},
    {name:'Refilwe Ndlovu',email:'refilwe@mobsie.co.za',role:'Support Agent',scope:'Entire platform',last:'1h ago',status:'Active'},
    {name:'Lebo Motaung',email:'lebo@littlestars.co.za',role:'School Owner',scope:'Little Stars Academy',last:'25m ago',status:'Active'},
    {name:'Prince Tau',email:'prince@brightkids.co.za',role:'Finance Manager',scope:'Bright Kids Academy',last:'2h ago',status:'Active'},
    {name:'Sipho Dlamini',email:'sipho@hebron.co.za',role:'Teacher',scope:'Hebron — Soshanguve',last:'3h ago',status:'Active'},
    {name:'Naledi Khumalo',email:'naledi@littlestars.co.za',role:'Branch Principal',scope:'Little Stars — Pretoria',last:'Yesterday',status:'Active'},
    {name:'Mpho Baloyi',email:'mpho@futureleaders.co.za',role:'Admissions',scope:'Future Leaders Academy',last:'2d ago',status:'Active'},
    {name:'Zodwa Sibiya',email:'zodwa@sunshinekids.co.za',role:'School Owner',scope:'Sunshine Kids',last:'4d ago',status:'Suspended'},
  ];
  const rolePerms={
    perms:['View dashboard','Manage schools','Manage branches','Manage learners','Manage teachers','Admissions','Finance & billing','Communications','Media & gallery','Reports & analytics','User management','Platform settings'],
    roles:[
      {name:'Super Admin',color:'#F97316',users:3,grants:[1,1,1,1,1,1,1,1,1,1,1,1]},
      {name:'School Owner',color:'#7C3AED',users:128,grants:[1,0,1,1,1,1,1,1,1,1,1,0]},
      {name:'Branch Principal',color:'#2563EB',users:349,grants:[1,0,0,1,1,1,0,1,1,1,0,0]},
      {name:'Finance Manager',color:'#16A34A',users:96,grants:[1,0,0,0,0,0,1,0,0,1,0,0]},
      {name:'Admissions',color:'#0D9488',users:74,grants:[1,0,0,1,0,1,0,1,0,0,0,0]},
      {name:'Teacher',color:'#D97706',users:2183,grants:[1,0,0,1,0,0,0,1,1,0,0,0]},
    ],
  };
  const auditLog=[
    {who:'Thandi Admin',role:'Super Admin',act:'Suspended school',target:'Wonder World Day Care',time:'Today, 13:42',type:'warn'},
    {who:'Prince Tau',role:'Finance Manager',act:'Exported payment report',target:'Bright Kids — May 2026',time:'Today, 12:18',type:'info'},
    {who:'Lebo Motaung',role:'School Owner',act:'Added new teacher',target:'Karabo Mnisi — Grade 1B',time:'Today, 11:04',type:'ok'},
    {who:'Katlego Modise',role:'Support Lead',act:'Impersonated school view',target:'Hebron Preschool',time:'Today, 10:37',type:'warn'},
    {who:'System',role:'Automation',act:'Generated monthly invoices',target:'18,742 parents',time:'Today, 08:00',type:'ok'},
    {who:'Naledi Khumalo',role:'Branch Principal',act:'Updated attendance register',target:'Grade R — Pretoria',time:'Today, 07:55',type:'info'},
    {who:'Thandi Admin',role:'Super Admin',act:'Changed role permissions',target:'Admissions role',time:'Yesterday, 16:20',type:'warn'},
    {who:'Mpho Baloyi',role:'Admissions',act:'Approved application',target:'APP-1046 — Amahle Chauke',time:'Yesterday, 15:02',type:'ok'},
    {who:'System',role:'Automation',act:'Nightly database backup',target:'Completed in 4m 12s',time:'Yesterday, 02:00',type:'ok'},
    {who:'Refilwe Ndlovu',role:'Support Agent',act:'Reset user password',target:'zodwa@sunshinekids.co.za',time:'Yesterday, 11:31',type:'info'},
  ];

  // --- Dashboard time series -------------------------------------------
  const revSeries={labels:['May 12','May 13','May 14','May 15','May 16','May 17','May 18'],
    revenue:[1980000,2140000,2090000,2380000,2260000,2520000,2450800],
    mrr:[1050000,1080000,1120000,1160000,1150000,1210000,1240000]};
  const growthSeries={labels:['Dec','Jan','Feb','Mar','Apr','May'],
    schools:[96,104,109,115,122,128], students:[17400,19100,20600,22100,23400,24568]};

  const activity=[
    {icon:'applications',tint:'t-orange',main:'New application received from <b>Lebo Motaung</b>',sub:'Hebron Branch · 2 min ago'},
    {icon:'payments',tint:'t-green',main:'Payment received from <b>Prince Tau</b>',sub:'Invoice #INV-000879 · R2,350.00 · 15 min ago'},
    {icon:'newsletters',tint:'t-purple',main:'Newsletter <b>"May Updates"</b> sent',sub:'Delivered to 18,742 parents · 1 hour ago'},
    {icon:'gallery',tint:'t-amber',main:'New gallery images uploaded',sub:'Soshanguve Branch · 23 new images · 2 hours ago'},
    {icon:'homework',tint:'t-blue',main:'Teacher <b>Sipho Dlamini</b> uploaded homework',sub:'Grade 1A · Mathematics · 3 hours ago'},
  ];
  const events=[
    {mo:'MAY',dy:'20',name:'Principal\'s Meeting',sub:'Virtual Meeting',time:'10:00 AM',tint:'t-orange',people:12},
    {mo:'MAY',dy:'22',name:'Sports Day',sub:'Hebron Branch',time:'08:00 AM',tint:'t-green',people:56},
    {mo:'MAY',dy:'24',name:'Parent Workshop',sub:'Mamelodi Branch',time:'02:00 PM',tint:'t-purple',people:18},
    {mo:'MAY',dy:'28',name:'Mid Term Break',sub:'All Branches',time:'All day',tint:'t-blue',people:0},
  ];

  window.DB={rnd,ri,pick,FIRST,LAST,CITIES,GRADES,
    name,initials,avColor,email,phone,fmtN,fmtR,fmtRk,
    schools,branches,totals,teachers,parents,learners,
    applications,appCounts,APP_STATUS,interviews,waitingList,
    payments,invoices,discounts,
    conversations,newsletters,pushLog,smsLog,campaigns,feedback,
    albums,mediaFiles,products,ordersList,
    documentsList,tickets,adminUsers,rolePerms,auditLog,
    revSeries,growthSeries,activity,events};
})();
