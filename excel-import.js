/* TaskMate Excel importer • only parses locally selected spreadsheets, without network uploads. */
(() => {
 'use strict';
 const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g,' ').trim();
 const normName = v => norm(v).toLocaleUpperCase('id-ID');
 const normHead = v => norm(v).toLowerCase().replace(/[^a-z0-9]+/g,'');
 const headerNames = {
  name:['nama','namakaryawan','namalengkap','karyawan','namapetugas','namapic','pic','staff'],
  date:['tanggal','tgl','date','tanggalshift','tanggaljadwal'],
  shift:['kodeshift','shift','jadwal','kodejadwal','jamkerja'],
  rack:['nomorrak','norak','rak','koderak','rakpic','nomorrakpic']
 };
 function findColumn(h,kind){return h.findIndex(v=>headerNames[kind].includes(normHead(v)))}
 function parseDate(value){
  let y,m,d;
  if(typeof value==='number' && Number.isFinite(value)){
   const parsed=globalThis.XLSX?.SSF?.parse_date_code(value);
   if(!parsed)throw new Error('Tanggal Excel tidak dapat dibaca');
   ({y,m,d}=parsed);
  }else if(value instanceof Date){y=value.getFullYear();m=value.getMonth()+1;d=value.getDate()}
  else {
   const s=norm(value);let p;
   if((p=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/))){y=+p[1];m=+p[2];d=+p[3]}
   else if((p=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/))){d=+p[1];m=+p[2];y=+p[3]}
   else throw new Error(`Tanggal tidak dikenali: ${s.slice(0,25)}. Gunakan YYYY-MM-DD.`);
  }
  const v=new Date(Date.UTC(y,m-1,d));
  if(y<2020||y>2040||!m||m>12||!d||d>31||v.getUTCFullYear()!==y||v.getUTCMonth()+1!==m||v.getUTCDate()!==d)
   throw new Error(`Tanggal tidak valid: ${String(value).slice(0,30)}`);
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 }
 function shiftCode(value){
  const code=norm(value).toUpperCase().replace(/\s+/g,' ');
  const aliases={'SHIFT 1':'P7','SHIFT1':'P7','1':'P7','P7':'P7','SHIFT 2':'S14','SHIFT2':'S14','2':'S14','S14':'S14','SHIFT 3':'M22','SHIFT3':'M22','3':'M22','M22':'M22',
  'O':'O','OFF':'O','LIBUR':'O','AO':'AO','MT':'MT','C':'C','CUTI':'C'};
  if(!Object.prototype.hasOwnProperty.call(aliases,code))throw new Error(`Kode shift "${code.slice(0,24)}" tidak dikenal. Gunakan P7/S14/M22/O/AO/MT/C.`);
  return aliases[code];
 }
 function newKey(name,all){
  let slug=normName(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,28);
  if(!slug)slug='karyawan';
  let key=`staff-${slug}`,counter=2;
  while(all.has(key)){key=`staff-${slug.slice(0,25)}-${counter++}`}
  all.add(key);return key;
 }
 function parseWorkbook(book,existing=[]){
  if(!book||!Array.isArray(book.SheetNames)||!book.SheetNames.length)throw new Error('Workbook Excel tidak memiliki sheet.');
  const byName=new Map(),keys=new Set();
  for(const item of existing){
   const name=normName(item.name);if(!name)continue;
   if(byName.has(name))throw new Error(`Nama ganda di data tim: ${name}. Periksa sebelum impor.`);
   const p={key:item.key,name:norm(item.name),short:norm(item.short||item.name).slice(0,40),
    racks:Array.isArray(item.racks)?item.racks.slice():[],schedule:{...(item.schedule||{})},
    changedDays:new Set(),racksChanged:false,newEmployee:false};
   byName.set(name,p);keys.add(p.key);
  }
  const involved=new Map(),rackSets=new Map();
  let scheduleRows=0,rackRows=0,ignored=0,recognized=0;
  function getPerson(raw){
   const name=norm(raw);if(name.length<2||name.length>100)throw new Error(`Nama karyawan tidak valid: ${name.slice(0,45)}`);
   const n=normName(name);let p=byName.get(n);
   if(!p){p={key:newKey(name,keys),name,short:name.split(' ')[0].slice(0,40),racks:[],schedule:{},changedDays:new Set(),racksChanged:false,newEmployee:true};byName.set(n,p)}
   involved.set(n,p);return p;
  }
  // Baca juga roster matriks kantor: baris header = NAMA, 1, 2, 3, ... 30/31;
  // bulan dan tahun berasal dari judul, misalnya SCHEDULE NOVEMBER 2026.
  function parseWideSchedule(rows,sName){
   const months={JANUARI:1,JANUARY:1,JAN:1,FEBRUARI:2,FEBRUARY:2,FEB:2,MARET:3,MARCH:3,MAR:3,
    APRIL:4,APR:4,MEI:5,MAY:5,JUNI:6,JUNE:6,JUN:6,JULI:7,JULY:7,JUL:7,
    AGUSTUS:8,AUGUST:8,AGU:8,AUG:8,SEPTEMBER:9,SEP:9,OKTOBER:10,OCTOBER:10,OKT:10,OCT:10,
    NOVEMBER:11,NOV:11,DESEMBER:12,DECEMBER:12,DES:12,DEC:12};
   const title=rows.slice(0,10).flat().map(v=>norm(v).toUpperCase()).find(x=>/\b20\d{2}\b/.test(x)&&Object.keys(months).some(m=>new RegExp('\\b'+m+'\\b').test(x)));
   const year=title?.match(/\b(20\d{2})\b/)?.[1];
   const month=title?Object.keys(months).find(m=>new RegExp('\\b'+m+'\\b').test(title)):null;
   if(!year||!month)return false;
   let hdr=null;
   for(let ri=0;ri<Math.min(15,rows.length);ri++){
    const row=rows[ri]||[],col=findColumn(row,'name');if(col<0)continue;
    const dateCols=[];let expected=1;
    for(let j=col+1;j<row.length;j++){
     const n=Number(row[j]);if(!Number.isInteger(n)||n!==expected)break;
     dateCols.push({col:j,day:n});expected++;
     if(expected>31)break;
    }
    if(dateCols.length>=25){hdr={row:ri,name:col,dateCols};break;}
   }
   if(!hdr)return false;
   let read=0;
   for(let i=hdr.row+1;i<rows.length;i++){
    const row=rows[i]||[],name=norm(row[hdr.name]);if(!name)continue;
    const entries=[];
    for(const dc of hdr.dateCols){
     const code=norm(row[dc.col]);if(!code)continue;
     const y=Number(year),m=months[month],day=dc.day;
     const d=new Date(Date.UTC(y,m-1,day));if(d.getUTCMonth()+1!==m)continue;
     const iso=`${year}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
     try{entries.push([iso,shiftCode(code)]);}catch(e){
      // Abaikan baris yang jelas bukan karyawan operasional berdasarkan kode shift.
      entries.length=0;break;
     }
    }
    if(entries.length<10)continue;
    const p=getPerson(name);
    for(const [day,code] of entries){p.schedule[day]=code;p.changedDays.add(day);scheduleRows++}
    read++;
   }
   return read>0;
  }
  for(const sName of book.SheetNames){
   const sheet=book.Sheets?.[sName];if(!sheet)continue;
   const sheetRows=globalThis.XLSX?.utils?.sheet_to_json(sheet,{header:1,defval:'',raw:true,blankrows:false});
   if(!Array.isArray(sheetRows)||!sheetRows.length)continue;
   let header=null;
   for(let i=0;i<Math.min(12,sheetRows.length);i++){
    const row=sheetRows[i]||[], name=findColumn(row,'name'),dt=findColumn(row,'date'),sc=findColumn(row,'shift'),rack=findColumn(row,'rack');
    if(name>=0&&((dt>=0&&sc>=0)||rack>=0)){header={row:i,name,date:dt,shift:sc,rack};break;}
   }
   if(!header){if(parseWideSchedule(sheetRows,sName)){recognized++;continue;}ignored++;continue;}
   recognized++;
   for(let i=header.row+1;i<sheetRows.length;i++){
    const row=sheetRows[i]||[],name=norm(row[header.name]);if(!name)continue;
    const hasDate=header.date>=0&&norm(row[header.date])!=='';
    const hasShift=header.shift>=0&&norm(row[header.shift])!=='';
    const hasRack=header.rack>=0&&norm(row[header.rack])!=='';
    if(!hasDate&&!hasShift&&!hasRack)continue;
    const location=`Sheet "${sName}" baris ${i+1}`;
    try{
     if(hasDate!==hasShift && header.date>=0 && header.shift>=0)throw new Error('Tanggal dan Kode Shift harus sama-sama diisi');
     const p=getPerson(name);
     if(hasDate&&hasShift){
      const day=parseDate(row[header.date]),code=shiftCode(row[header.shift]);
      if(p.changedDays.has(day)&&p.schedule[day]!==code)throw new Error(`Jadwal ${p.name} pada ${day} memiliki dua kode berbeda`);
      p.schedule[day]=code;p.changedDays.add(day);scheduleRows++;
     }
     if(hasRack){
      const rack=norm(row[header.rack]).toUpperCase().slice(0,100);
      if(rack.length<1)throw new Error('Nomor rak tidak valid');
      if(!rackSets.has(p.key))rackSets.set(p.key,new Set());
      rackSets.get(p.key).add(rack);rackRows++;
     }
    }catch(e){throw new Error(`${location}: ${e.message}`)}
    if(scheduleRows+rackRows>10000)throw new Error('Maksimal 10.000 baris data per impor.');
   }
  }
  if(!recognized||(!scheduleRows&&!rackRows))throw new Error('Kolom Excel tidak dikenali. Gunakan template dengan sheet Jadwal (Nama, Tanggal, Kode Shift) dan/atau Rak (Nama, Nomor Rak).');
  for(const p of involved.values())if(rackSets.has(p.key)){p.racks=[...rackSets.get(p.key)];p.racksChanged=true}
  const employees=[...involved.values()];
  return {employees,summary:{employees:employees.length,newEmployees:employees.filter(p=>p.newEmployee).length,
    scheduleRows,rackRows,changedRackStaff:rackSets.size,ignoredSheets:ignored}};
 }
 window.TASKMATE_EXCEL={parseWorkbook,parseDate,shiftCode};
})();
