/* Seed data for the Mobsie Connect API — the real school group:
   ONE school · 5 live campuses (Soshanguve ×2, Mamelodi, Cosmo City, Sky-City)
   plus the expansion pipeline (Atteridgeville, Soweto, Thembisa).
   Deterministic, mirrors assets/js/data.js in the Control Centre front-end. */
const bcrypt = require('bcryptjs');
const ENV = require('./env');

// ← Change the school group's name here (keep it in sync with assets/js/data.js)
const SCHOOL_NAME = 'Mobsie Academy';

// Seeded RNG so the API and the front-end demo agree on shape and scale
let _s = 20260518;
function rnd(){ _s|=0; _s=_s+0x6D2B79F5|0; let t=Math.imul(_s^_s>>>15,1|_s);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
const ri=(a,b)=>Math.floor(rnd()*(b-a+1))+a;
const pick=a=>a[Math.floor(rnd()*a.length)];

const FIRST=['Thandi','Lebo','Sipho','Bongani','Naledi','Kagiso','Palesa','Tshepo','Zanele','Ayanda','Nomvula','Katlego','Karabo','Mpho','Refilwe','Themba','Lerato','Boitumelo','Neo','Amahle','Sibusiso','Nandi','Tumelo','Dineo','Khanyi','Lwazi','Precious','Gugu','Vusi','Zodwa','Prince','Busisiwe','Andile','Ntombi','Sello','Mandla','Portia','Musa','Nthabiseng','Solly'];
const LAST=['Motaung','Dlamini','Nkosi','Mokoena','Khumalo','Mahlangu','Ndlovu','Sithole','Mabaso','Zwane','Tshabalala','Molefe','Maluleke','Baloyi','Chauke','Ngobeni','Tau','Mnisi','Radebe','Sibiya','Mthembu','Maseko','Nxumalo','Shabangu','Kekana','Modise','Phiri','Mashaba','Sekhukhune','Lekota'];
const GRADES=['Playgroup','Nursery','Grade RR','Grade R','Grade 1','Grade 2'];

const name=()=>pick(FIRST)+' '+pick(LAST);
const email=n=>n.toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,'.')+'@'+pick(['gmail.com','outlook.com','yahoo.com','icloud.com']);
const phone=()=>'0'+pick(['61','62','71','72','73','82','83','84'])+' '+ri(100,999)+' '+String(ri(0,9999)).padStart(4,'0');

function build(){
  const parentHash = bcrypt.hashSync(ENV.PARENT_PASSWORD, 10);
  const adminHash  = bcrypt.hashSync(ENV.ADMIN_PASSWORD, 10);
  const staffHash  = bcrypt.hashSync('staff123', 10);

  const school = {
    id:'sch-1', name:SCHOOL_NAME, city:'Pretoria & Johannesburg',
    owner:'Thandi Admin', ownerEmail:ENV.ADMIN_EMAIL, phone:'012 555 0182',
    plan:'Enterprise', planFee:4999, status:'Active', perf:94,
    joined:'Jan 2021', color:'#F97316', initials:'MA', storageGB:64, seats:80,
  };

  const branches=[
    {id:'br-0',schoolId:'sch-1',school:SCHOOL_NAME,name:'Soshanguve Branch 1',city:'Soshanguve',region:'Pretoria',principal:'Naledi Khumalo',students:232,teachers:15,revenue:429000,attendance:93,phone:phone(),status:'Active',since:'Jan 2021'},
    {id:'br-1',schoolId:'sch-1',school:SCHOOL_NAME,name:'Soshanguve Branch 2',city:'Soshanguve',region:'Pretoria',principal:'Sipho Dlamini',students:168,teachers:11,revenue:311000,attendance:91,phone:phone(),status:'Active',since:'Aug 2022'},
    {id:'br-2',schoolId:'sch-1',school:SCHOOL_NAME,name:'Mamelodi Branch',city:'Mamelodi',region:'Pretoria',principal:'Lerato Mokoena',students:189,teachers:12,revenue:350000,attendance:92,phone:phone(),status:'Active',since:'Jan 2023'},
    {id:'br-3',schoolId:'sch-1',school:SCHOOL_NAME,name:'Cosmo City Branch',city:'Cosmo City, Randburg',region:'Johannesburg',principal:'Ayanda Sithole',students:246,teachers:16,revenue:455000,attendance:94,phone:phone(),status:'Active',since:'Jan 2024'},
    {id:'br-4',schoolId:'sch-1',school:SCHOOL_NAME,name:'Sky-City Branch',city:'Sky-City, Alberton',region:'Johannesburg',principal:'Kagiso Zwane',students:175,teachers:12,revenue:324000,attendance:90,phone:phone(),status:'Active',since:'Jul 2025'},
    {id:'br-5',schoolId:'sch-1',school:SCHOOL_NAME,name:'Atteridgeville Branch',city:'Atteridgeville',region:'Pretoria',principal:'To be appointed',students:0,teachers:0,revenue:0,attendance:0,phone:'—',status:'Coming Soon',since:'Opening 2027'},
    {id:'br-6',schoolId:'sch-1',school:SCHOOL_NAME,name:'Soweto Branch',city:'Soweto',region:'Johannesburg',principal:'To be appointed',students:0,teachers:0,revenue:0,attendance:0,phone:'—',status:'Coming Soon',since:'Opening 2027'},
    {id:'br-7',schoolId:'sch-1',school:SCHOOL_NAME,name:'Thembisa Branch',city:'Thembisa',region:'Johannesburg',principal:'To be appointed',students:0,teachers:0,revenue:0,attendance:0,phone:'—',status:'Coming Soon',since:'Opening 2027'},
  ];
  const live=branches.filter(b=>b.status!=='Coming Soon');
  const brOf=()=>pick(live);

  const principals=live.map(b=>b.principal);
  const teachers=[],parents=[],learners=[];
  for(let i=0;i<24;i++){
    const b=brOf(); const n=i<5?principals[i]:name();
    teachers.push({id:'t-'+i,name:n,email:email(n),phone:phone(),school:SCHOOL_NAME,schoolId:'sch-1',branch:b.name,
      grade:pick(GRADES),cls:pick(GRADES)+' '+pick(['A','B']),students:ri(14,24),
      years:ri(1,14),rating:(ri(38,50)/10).toFixed(1),status:rnd()<.93?'Active':'On Leave'});
  }
  for(let i=0;i<36;i++){
    const b=brOf(); const n=name();
    parents.push({id:'p-'+i,name:n,email:email(n),phone:phone(),school:SCHOOL_NAME,schoolId:'sch-1',branch:b.name,
      children:ri(1,3),balance:rnd()<.74?0:ri(450,6200),status:rnd()<.9?'Active':'Overdue',
      joined:`${pick(['Jan','Feb','Mar','Apr','May'])} ${ri(2022,2026)}`,
      passwordHash:parentHash, pushTokens:[]});
  }
  for(let i=0;i<48;i++){
    const b=brOf(); const p=pick(parents);
    const n=pick(FIRST)+' '+p.name.split(' ')[1];
    learners.push({id:'l-'+i,name:n,school:SCHOOL_NAME,schoolId:'sch-1',branch:b.name,grade:pick(GRADES),
      cls:pick(['A','B']),parent:p.name,parentId:p.id,age:ri(2,7),attendance:ri(82,99),
      fees:rnd()<.8?'Paid':'Outstanding',status:rnd()<.95?'Enrolled':'On Hold'});
  }

  const APP_STATUS=['Pending Review','Documents Required','Interview Scheduled','Approved','Rejected'];
  const applications=[];
  for(let i=0;i<20;i++){
    const b=brOf(); const pn=name();
    applications.push({id:'APP-'+String(1042+i),child:pick(FIRST)+' '+pn.split(' ')[1],parent:pn,
      email:email(pn),phone:phone(),school:SCHOOL_NAME,schoolId:'sch-1',branch:b.name,grade:pick(GRADES),
      status:i<6?'Pending Review':pick(APP_STATUS),date:`May ${ri(2,18)}, 2026`,docs:ri(2,6)});
  }
  const interviews=Array.from({length:8},(_,i)=>{
    const a=pick(applications);
    return {id:'INT-'+(201+i),child:a.child,parent:a.parent,school:SCHOOL_NAME,branch:a.branch,grade:a.grade,
      date:`May ${ri(19,29)}, 2026`,time:`${ri(8,14)}:${pick(['00','30'])}`,
      interviewer:pick(principals),mode:pick(['In-person','Virtual']),status:pick(['Scheduled','Scheduled','Confirmed','Completed'])};
  });
  const waitingList=Array.from({length:12},(_,i)=>{
    const b=brOf(); const pn=name();
    return {id:'WL-'+(88+i),child:pick(FIRST)+' '+pn.split(' ')[1],parent:pn,school:SCHOOL_NAME,branch:b.name,
      grade:pick(GRADES),position:i+1,since:`${pick(['Feb','Mar','Apr'])} ${ri(3,28)}, 2026`,
      priority:pick(['Standard','Standard','Sibling','Staff Child'])};
  });

  const payMethods=['Card','EFT','Debit Order','Cash','SnapScan'];
  const payments=Array.from({length:30},(_,i)=>{
    const p=pick(parents);
    return {id:'PAY-'+String(9032-i),parentId:p.id,parent:p.name,school:SCHOOL_NAME,branch:p.branch,
      amount:ri(9,48)*50,method:pick(payMethods),date:`May ${ri(1,18)}, 2026`,
      status:rnd()<.88?'Successful':(rnd()<.5?'Pending':'Failed'),ref:'INV-'+String(880-i).padStart(6,'0')};
  });
  const invoices=Array.from({length:28},(_,i)=>{
    const p=pick(parents);
    const st=rnd()<.66?'Paid':(rnd()<.55?'Due':'Overdue');
    return {id:'INV-'+String(880-i).padStart(6,'0'),parentId:p.id,parent:p.name,school:SCHOOL_NAME,branch:p.branch,
      desc:pick(['Monthly Fees — May','Registration Fee','Aftercare — May','Stationery Pack','Uniform Order','School Trip — Zoo']),
      amount:ri(9,52)*50,issued:`May ${ri(1,12)}, 2026`,due:`May ${ri(15,31)}, 2026`,status:st};
  });
  const discounts=[
    {id:'d-0',code:'SIBLING10',desc:'Sibling discount — 2nd child',type:'10% off fees',uses:64,limit:'Unlimited',status:'Active',schools:'All campuses'},
    {id:'d-1',code:'EARLYBIRD27',desc:'2027 early registration',type:'R500 off',uses:31,limit:'200',status:'Active',schools:'All campuses'},
    {id:'d-2',code:'STAFF50',desc:'Staff children',type:'50% off fees',uses:12,limit:'Unlimited',status:'Active',schools:'All campuses'},
    {id:'d-3',code:'WINTER15',desc:'Winter enrolment promo',type:'15% off first month',uses:18,limit:'100',status:'Scheduled',schools:'Cosmo City · Sky-City'},
    {id:'d-4',code:'LOYALTY5',desc:'Founding families — Soshanguve',type:'5% off fees',uses:47,limit:'Unlimited',status:'Active',schools:'Soshanguve 1 & 2'},
    {id:'d-5',code:'OPENDAY26',desc:'Open day sign-up promo',type:'R250 off registration',uses:88,limit:'88',status:'Expired',schools:'All campuses'},
  ];

  const conversations=Array.from({length:10},(_,i)=>{
    const p=pick(parents);
    const openers=['Good morning! I wanted to ask about the school trip next week.','Hi, is the aftercare programme running this Friday?','Hello, my child will be absent tomorrow due to a doctor\'s appointment.','Hi there — I haven\'t received this month\'s invoice yet.','Good day, can I update my contact details on the app?'];
    const msgs=[
      {dir:'in',text:openers[i%openers.length],time:`0${ri(8,9)}:${ri(10,59)}`},
      {dir:'out',text:'Good morning! Thanks for reaching out — let me check that for you right away. 😊',time:`0${ri(8,9)}:${ri(10,59)}`},
      {dir:'in',text:'Thank you so much, I appreciate it!',time:`${ri(10,11)}:${ri(10,59)}`},
      {dir:'out',text:'All sorted! You should see the update in your Mobsie app now. Have a lovely day!',time:`${ri(10,11)}:${ri(10,59)}`},
    ];
    return {id:'c-'+i,parentId:p.id,who:p.name,school:SCHOOL_NAME,branch:p.branch,unread:i<3?ri(1,4):0,
      time:i<4?`${ri(2,55)}m`:`${ri(1,9)}h`,msgs,preview:msgs[0].text};
  });
  const newsletters=[
    {id:'nl-0',title:'May Updates',audience:'All campuses',sent:'May 17, 2026',recipients:788,openRate:71,status:'Sent'},
    {id:'nl-1',title:'Winter Uniform Reminder',audience:'All campuses',sent:'May 12, 2026',recipients:781,openRate:62,status:'Sent'},
    {id:'nl-2',title:'Sports Day — Soshanguve',audience:'Soshanguve Branch 1 & 2',sent:'May 9, 2026',recipients:312,openRate:84,status:'Sent'},
    {id:'nl-3',title:'Term 2 Calendar',audience:'All campuses',sent:'Apr 28, 2026',recipients:774,openRate:76,status:'Sent'},
    {id:'nl-4',title:'June Holiday Programme',audience:'All campuses',sent:'—',recipients:0,openRate:0,status:'Draft'},
  ];
  const pushLog=[
    {id:'pu-0',title:'Gate closes 17:30 today ⏰',audience:'Cosmo City Branch',time:'Today, 14:02',delivered:192,opened:154,status:'Delivered'},
    {id:'pu-1',title:'New gallery photos 📸',audience:'Soshanguve Branch 1',time:'Today, 11:20',delivered:181,opened:149,status:'Delivered'},
    {id:'pu-2',title:'Invoice ready — May fees',audience:'All campuses',time:'Yesterday, 08:00',delivered:779,opened:598,status:'Delivered'},
    {id:'pu-3',title:'Sports Day this Friday! 🏆',audience:'Soshanguve Branch 1 & 2',time:'May 16, 09:12',delivered:309,opened:281,status:'Delivered'},
    {id:'pu-4',title:'Load shedding: early pickup',audience:'Mamelodi Branch',time:'May 15, 12:45',delivered:146,opened:139,status:'Delivered'},
  ];
  const smsLog=[
    {id:'sm-0',to:'All parents — Cosmo City',msg:'Reminder: Parent meeting tomorrow 18:00 in the main hall.',time:'Today, 12:30',count:189,status:'Delivered'},
    {id:'sm-1',to:'Overdue accounts (all campuses)',msg:'Friendly reminder: your May invoice is due. Pay in the Mobsie app.',time:'Yesterday, 09:00',count:64,status:'Delivered'},
    {id:'sm-2',to:'Grade R parents — Soshanguve 1',msg:'Grade R outing to the planetarium on 26 May. Permission slips due Friday.',time:'May 15, 10:15',count:41,status:'Delivered'},
    {id:'sm-3',to:'All parents — Sky-City',msg:'School closed Monday 25 May (staff training). Aftercare available.',time:'May 14, 14:40',count:138,status:'Delivered'},
  ];
  const campaigns=[
    {id:'cp-0',name:'2027 Enrolment Drive',subject:'Secure your child\'s place for 2027 🎒',audience:'Waiting list + open-day leads',sent:642,openRate:52,clickRate:14,status:'Running'},
    {id:'cp-1',name:'May Fee Reminder',subject:'Your May statement is ready',audience:'All active parents',sent:779,openRate:72,clickRate:33,status:'Completed'},
    {id:'cp-2',name:'Winter Holiday Club',subject:'Fun-filled winter holiday programme ❄️',audience:'All campuses — opt-in',sent:611,openRate:56,clickRate:21,status:'Completed'},
    {id:'cp-3',name:'Refer-a-Friend',subject:'Give R500, get R500',audience:'Engaged parents (90d)',sent:418,openRate:47,clickRate:11,status:'Paused'},
  ];
  const feedback=Array.from({length:9},(_,i)=>{
    const p=pick(parents);
    const txt=['The new app update is fantastic — love the gallery!','Please add more vegetarian lunch options.','Teacher Naledi has been wonderful with my son.','Pickup queue at Cosmo City is too slow on Fridays.','Could we get invoices as PDF downloads?','The sports day was beautifully organised. Thank you!','More notice for casual days please.','Homework updates arrive quite late in the evening.','Reception staff at Sky-City are always so friendly.'][i];
    return {id:'FB-'+(301+i),parentId:p.id,who:p.name,school:p.branch,rating:ri(3,5),text:txt,
      date:`May ${ri(8,18)}, 2026`,status:i<2?'New':pick(['Reviewed','Responded','Reviewed']),topic:pick(['App','Food','Staff','Operations','Billing','Events'])};
  });

  const albums=[
    {id:'al-0',name:'Sports Day 2026',school:SCHOOL_NAME,branch:'Soshanguve Branch 1',count:84,date:'May 16, 2026',hue1:'#F97316',hue2:'#FDBA74'},
    {id:'al-1',name:'Grade R Farm Trip',school:SCHOOL_NAME,branch:'Mamelodi Branch',count:56,date:'May 14, 2026',hue1:'#16A34A',hue2:'#86EFAC'},
    {id:'al-2',name:'Art Week Exhibition',school:SCHOOL_NAME,branch:'Cosmo City Branch',count:41,date:'May 12, 2026',hue1:'#7C3AED',hue2:'#C4B5FD'},
    {id:'al-3',name:'Mother\'s Day Tea',school:SCHOOL_NAME,branch:'Sky-City Branch',count:63,date:'May 10, 2026',hue1:'#DB2777',hue2:'#F9A8D4'},
    {id:'al-4',name:'Science Fun Day',school:SCHOOL_NAME,branch:'Soshanguve Branch 2',count:38,date:'May 8, 2026',hue1:'#2563EB',hue2:'#93C5FD'},
    {id:'al-5',name:'Autumn Picnic',school:SCHOOL_NAME,branch:'Mamelodi Branch',count:47,date:'May 5, 2026',hue1:'#D97706',hue2:'#FCD34D'},
    {id:'al-6',name:'Book Character Day',school:SCHOOL_NAME,branch:'Soshanguve Branch 1',count:72,date:'Apr 30, 2026',hue1:'#0D9488',hue2:'#5EEAD4'},
    {id:'al-7',name:'Graduation Rehearsal',school:SCHOOL_NAME,branch:'Cosmo City Branch',count:29,date:'Apr 26, 2026',hue1:'#DC2626',hue2:'#FCA5A5'},
  ];
  const mediaFiles=[
    {id:'mf-0',name:'sports-day-highlights.mp4',type:'Video',size:'248 MB',school:'Soshanguve Branch 1',by:'Sipho Dlamini',date:'May 16, 2026'},
    {id:'mf-1',name:'newsletter-may-banner.png',type:'Image',size:'1.2 MB',school:'Head Office',by:'Thandi Admin',date:'May 15, 2026'},
    {id:'mf-2',name:'grade-r-song.mp3',type:'Audio',size:'6.4 MB',school:'Soshanguve Branch 1',by:'Naledi Khumalo',date:'May 14, 2026'},
    {id:'mf-3',name:'winter-menu-2026.pdf',type:'Document',size:'840 KB',school:'Head Office',by:'Thandi Admin',date:'May 13, 2026'},
    {id:'mf-4',name:'art-week-collage.jpg',type:'Image',size:'3.1 MB',school:'Cosmo City Branch',by:'Ayanda Sithole',date:'May 12, 2026'},
    {id:'mf-5',name:'fire-drill-notice.pdf',type:'Document',size:'220 KB',school:'Sky-City Branch',by:'Kagiso Zwane',date:'May 11, 2026'},
    {id:'mf-6',name:'open-day-promo.mp4',type:'Video',size:'96 MB',school:'Head Office',by:'Thandi Admin',date:'May 9, 2026'},
    {id:'mf-7',name:'mothers-day-tea.jpg',type:'Image',size:'2.7 MB',school:'Sky-City Branch',by:'Zanele Mabaso',date:'May 10, 2026'},
  ];

  const products=[
    {id:'pr-0',name:'Winter Tracksuit',cat:'Uniform',price:420,stock:86,sold:142,status:'Active',hue:'#F97316'},
    {id:'pr-1',name:'School Golf Shirt',cat:'Uniform',price:180,stock:122,sold:218,status:'Active',hue:'#16A34A'},
    {id:'pr-2',name:'Mobsie Backpack',cat:'Accessories',price:350,stock:34,sold:115,status:'Active',hue:'#7C3AED'},
    {id:'pr-3',name:'Stationery Pack — Gr R',cat:'Stationery',price:260,stock:12,sold:170,status:'Low Stock',hue:'#2563EB'},
    {id:'pr-4',name:'Sun Hat',cat:'Uniform',price:95,stock:140,sold:188,status:'Active',hue:'#D97706'},
    {id:'pr-5',name:'Art Smock',cat:'Uniform',price:120,stock:0,sold:98,status:'Out of Stock',hue:'#DB2777'},
    {id:'pr-6',name:'Water Bottle 500ml',cat:'Accessories',price:85,stock:210,sold:302,status:'Active',hue:'#0D9488'},
    {id:'pr-7',name:'Reader Set — Level 1',cat:'Books',price:310,stock:28,sold:74,status:'Active',hue:'#DC2626'},
  ];
  const ordersList=Array.from({length:20},(_,i)=>{
    const p=pick(parents), pr=pick(products), qty=ri(1,3);
    return {id:'ORD-'+String(4410-i),parentId:p.id,parent:p.name,school:p.branch,items:qty+' × '+pr.name,
      total:pr.price*qty,date:`May ${ri(8,18)}, 2026`,
      status:pick(['Processing','Ready for Collection','Collected','Collected','Processing'])};
  });

  const documentsList=[
    {id:'doc-0',name:'2026 Enrolment Policy.pdf',folder:'Policies',size:'1.4 MB',by:'Thandi Admin',date:'May 12, 2026',shared:'All campuses'},
    {id:'doc-1',name:'POPIA Compliance Pack.zip',folder:'Compliance',size:'12 MB',by:'Thandi Admin',date:'May 8, 2026',shared:'Principals'},
    {id:'doc-2',name:'Teacher Onboarding Guide.docx',folder:'HR',size:'860 KB',by:'Lerato Mokoena',date:'May 6, 2026',shared:'All campuses'},
    {id:'doc-3',name:'Fee Structure 2026.xlsx',folder:'Finance',size:'240 KB',by:'Prince Tau',date:'Apr 30, 2026',shared:'Finance team'},
    {id:'doc-4',name:'Emergency Procedures.pdf',folder:'Safety',size:'2.2 MB',by:'Thandi Admin',date:'Apr 24, 2026',shared:'All campuses'},
    {id:'doc-5',name:'Expansion Plan — Atteridgeville.pdf',folder:'Expansion',size:'4.8 MB',by:'Thandi Admin',date:'Apr 18, 2026',shared:'Head Office'},
    {id:'doc-6',name:'Curriculum Map — Term 2.pdf',folder:'Academics',size:'3.6 MB',by:'Naledi Khumalo',date:'Apr 15, 2026',shared:'All teachers'},
  ];
  const tickets=[
    {id:'TIC-1208',subject:'Cannot upload gallery photos',school:'Soshanguve Branch 1',by:'Sipho Dlamini',priority:'High',status:'Open',age:'2h',agent:'Unassigned'},
    {id:'TIC-1207',subject:'Invoice totals not matching statement',school:'Head Office',by:'Prince Tau',priority:'Urgent',status:'In Progress',age:'5h',agent:'Katlego M.'},
    {id:'TIC-1206',subject:'Set up Atteridgeville as a new campus',school:'Head Office',by:'Thandi Admin',priority:'Normal',status:'In Progress',age:'1d',agent:'Katlego M.'},
    {id:'TIC-1205',subject:'Parent app login loop on Android',school:'Sky-City Branch',by:'Kagiso Zwane',priority:'High',status:'Open',age:'1d',agent:'Unassigned'},
    {id:'TIC-1204',subject:'Bulk import learners from Excel',school:'Cosmo City Branch',by:'Ayanda Sithole',priority:'Normal',status:'Waiting on Customer',age:'2d',agent:'Refilwe N.'},
    {id:'TIC-1203',subject:'Change banking details for payouts',school:'Head Office',by:'Prince Tau',priority:'Normal',status:'Resolved',age:'3d',agent:'Katlego M.'},
    {id:'TIC-1202',subject:'SMS credits not topping up',school:'Mamelodi Branch',by:'Lerato Mokoena',priority:'High',status:'Resolved',age:'4d',agent:'Refilwe N.'},
  ];
  const adminUsers=[
    {id:'u-0',name:'Thandi Admin',email:ENV.ADMIN_EMAIL,role:'Super Admin',scope:'Entire school group',last:'Now',status:'Active',passwordHash:adminHash},
    {id:'u-1',name:'Naledi Khumalo',email:'naledi@mobsie.co.za',role:'Branch Principal',scope:'Soshanguve Branch 1',last:'25m ago',status:'Active',passwordHash:staffHash},
    {id:'u-2',name:'Sipho Dlamini',email:'sipho@mobsie.co.za',role:'Branch Principal',scope:'Soshanguve Branch 2',last:'1h ago',status:'Active',passwordHash:staffHash},
    {id:'u-3',name:'Lerato Mokoena',email:'lerato@mobsie.co.za',role:'Branch Principal',scope:'Mamelodi Branch',last:'2h ago',status:'Active',passwordHash:staffHash},
    {id:'u-4',name:'Ayanda Sithole',email:'ayanda@mobsie.co.za',role:'Branch Principal',scope:'Cosmo City Branch',last:'3h ago',status:'Active',passwordHash:staffHash},
    {id:'u-5',name:'Kagiso Zwane',email:'kagiso@mobsie.co.za',role:'Branch Principal',scope:'Sky-City Branch',last:'Yesterday',status:'Active',passwordHash:staffHash},
    {id:'u-6',name:'Prince Tau',email:'prince@mobsie.co.za',role:'Finance Manager',scope:'All campuses',last:'2h ago',status:'Active',passwordHash:staffHash},
    {id:'u-7',name:'Mpho Baloyi',email:'mpho@mobsie.co.za',role:'Admissions',scope:'All campuses',last:'2d ago',status:'Active',passwordHash:staffHash},
    {id:'u-8',name:'Refilwe Ndlovu',email:'refilwe@mobsie.co.za',role:'Support Agent',scope:'All campuses',last:'1h ago',status:'Active',passwordHash:staffHash},
  ];
  const rolePerms={
    perms:['View dashboard','Manage school profile','Manage campuses','Manage learners','Manage teachers','Admissions','Finance & billing','Communications','Media & gallery','Reports & analytics','User management','Platform settings'],
    roles:[
      {name:'Super Admin',color:'#F97316',users:2,grants:[1,1,1,1,1,1,1,1,1,1,1,1]},
      {name:'School Owner',color:'#7C3AED',users:1,grants:[1,1,1,1,1,1,1,1,1,1,1,0]},
      {name:'Branch Principal',color:'#2563EB',users:5,grants:[1,0,0,1,1,1,0,1,1,1,0,0]},
      {name:'Finance Manager',color:'#16A34A',users:2,grants:[1,0,0,0,0,0,1,0,0,1,0,0]},
      {name:'Admissions',color:'#0D9488',users:2,grants:[1,0,0,1,0,1,0,1,0,0,0,0]},
      {name:'Teacher',color:'#D97706',users:66,grants:[1,0,0,1,0,0,0,1,1,0,0,0]},
    ],
  };
  const auditLog=[
    {id:'au-0',who:'System',role:'Automation',act:'Database seeded',target:'Fresh install',time:new Date().toISOString(),type:'ok'},
  ];
  const events=[
    {id:'ev-0',mo:'MAY',dy:'20',name:'Principals\' Meeting',sub:'All 5 campuses · virtual',time:'10:00 AM',tint:'t-orange',people:7},
    {id:'ev-1',mo:'MAY',dy:'22',name:'Sports Day',sub:'Soshanguve Branch 1',time:'08:00 AM',tint:'t-green',people:56},
    {id:'ev-2',mo:'MAY',dy:'24',name:'Parent Workshop',sub:'Mamelodi Branch',time:'02:00 PM',tint:'t-purple',people:18},
    {id:'ev-3',mo:'MAY',dy:'28',name:'Mid Term Break',sub:'All campuses',time:'All day',tint:'t-blue',people:0},
  ];
  const homeworkList=[
    {id:'hw-0',title:'Counting to 20 with objects',cls:'Grade R A',school:'Soshanguve Branch 1',teacher:'Naledi Khumalo',due:'May 19',done:88,subject:'Numeracy',tint:'t-orange'},
    {id:'hw-1',title:'My Family — drawing & telling',cls:'Nursery B',school:'Soshanguve Branch 2',teacher:'Sipho Dlamini',due:'May 19',done:74,subject:'Life Skills',tint:'t-green'},
    {id:'hw-2',title:'Letter sounds: S, A, T',cls:'Grade R B',school:'Cosmo City Branch',teacher:'Palesa Nkosi',due:'May 20',done:65,subject:'Literacy',tint:'t-purple'},
    {id:'hw-3',title:'Shapes hunt at home',cls:'Grade 1 A',school:'Mamelodi Branch',teacher:'Karabo Mnisi',due:'May 20',done:52,subject:'Numeracy',tint:'t-blue'},
    {id:'hw-4',title:'Read-along: The Hungry Caterpillar',cls:'Grade 1 B',school:'Sky-City Branch',teacher:'Zanele Mabaso',due:'May 21',done:41,subject:'Literacy',tint:'t-teal'},
    {id:'hw-5',title:'Winter clothing collage',cls:'Grade 2 A',school:'Soshanguve Branch 1',teacher:'Lerato Mokoena',due:'May 22',done:12,subject:'Art',tint:'t-pink'},
  ];
  const docFolders=[
    {id:'fo-0',name:'Policies',count:24,tint:'t-orange'},{id:'fo-1',name:'Compliance',count:18,tint:'t-red'},
    {id:'fo-2',name:'Finance',count:41,tint:'t-green'},{id:'fo-3',name:'HR',count:33,tint:'t-purple'},
    {id:'fo-4',name:'Academics',count:57,tint:'t-blue'},{id:'fo-5',name:'Expansion',count:9,tint:'t-pink'},
  ];
  const reportRuns=[
    {id:'rr-0',name:'Term 2 Progress Reports',type:'Report cards',scope:'All campuses',date:'Due Jun 20',status:'In Progress',done:64,tint:'t-purple'},
    {id:'rr-1',name:'Attendance Summary — May',type:'Attendance',scope:'All campuses',date:'Generated May 18',status:'Completed',done:100,tint:'t-green'},
    {id:'rr-2',name:'Fee Collection Report — May',type:'Finance',scope:'All campuses',date:'Generated May 18',status:'Completed',done:100,tint:'t-blue'},
    {id:'rr-3',name:'Learner Development — Playgroup',type:'Milestones',scope:'All campuses',date:'Due May 30',status:'In Progress',done:38,tint:'t-orange'},
    {id:'rr-4',name:'Expansion Readiness — Atteridgeville',type:'Operations',scope:'Head Office',date:'Due Jun 30',status:'Scheduled',done:0,tint:'t-teal'},
  ];

  return {
    _meta:{version:1, seededAt:new Date().toISOString(), schoolName:SCHOOL_NAME},
    schools:[school], branches, teachers, parents, learners,
    applications, appCounts:[16,8,6,5,3], interviews, waitingList,
    payments, invoices, discounts,
    conversations, newsletters, pushLog, smsLog, campaigns, feedback,
    albums, mediaFiles, products, ordersList,
    documentsList, tickets, adminUsers, rolePerms, auditLog,
    events, counters:{pendingReview:16}, customCal:[], homeworkList, docFolders, reportRuns,
  };
}

module.exports = { build, SCHOOL_NAME };
