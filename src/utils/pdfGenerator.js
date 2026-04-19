import { hoy, mesActual, getSemanaActual, RM_EJS } from "./helpers.js";

const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload = () => resolve(window.jspdf.jsPDF);
  s.onerror = () => reject(new Error('Error cargando jsPDF'));
  document.head.appendChild(s);
});

export const generarPDF = async (al, historiales) => {
  let JsPDF;
  try { JsPDF = await loadJsPDF(); }
  catch(e) { alert('No se pudo generar el PDF. Verificá tu conexión.'); return; }
  const doc = new JsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, pad=16;
  let y=0;
  const addPage=()=>{ doc.addPage(); y=pad; };
  const checkY=(n=20)=>{ if(y+n>275) addPage(); };
  // Header
  doc.setFillColor(0,0,0); doc.rect(0,0,W,32,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont('helvetica','bold');
  doc.text('DESARROLLO INTEGRAL',pad,13);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(160,160,160);
  doc.text('CENTRO DE ENTRENAMIENTO',pad,19);
  doc.setTextColor(200,200,200);
  doc.text(new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'}),W-pad,13,{align:'right'});
  doc.text('HISTORIAL DEL ALUMNO',W-pad,19,{align:'right'});
  y=42;
  // Nombre
  doc.setTextColor(0,0,0); doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text(al.nombre.toUpperCase(),pad,y); y+=7;
  doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(130,130,130);
  doc.text(`${al.codigo}  ·  @${al.username||al.codigo}`,pad,y);
  if(al.horarios&&al.horarios.length>0) doc.text(al.horarios.map(h=>`${h.dia} ${h.hora}`).join('  ·  '),W-pad,y,{align:'right'});
  y+=10;
  // Stats
  const boxW=(W-pad*2-8)/3;
  [['PESO',al.peso],['ALTURA',al.altura],['EDAD',al.edad]].forEach(([label,val],i)=>{
    const x=pad+i*(boxW+4);
    doc.setFillColor(245,245,245); doc.roundedRect(x,y,boxW,16,2,2,'F');
    doc.setTextColor(0,0,0); doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text(val||'—',x+boxW/2,y+8,{align:'center'});
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(150,150,150);
    doc.text(label,x+boxW/2,y+13.5,{align:'center'});
  }); y+=22;
  // Semana
  const semActual=getSemanaActual(al.plan.periodizacion);
  const semData=al.plan.periodizacion.find(p=>p.semana===semActual)||al.plan.periodizacion[0];
  if(semData){
    doc.setFillColor(15,15,15); doc.roundedRect(pad,y,W-pad*2,13,2,2,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
    doc.text(`SEMANA ${semActual} EN CURSO`,pad+5,y+5.5);
    doc.text(`${semData.series}×${semData.reps}${semData.intensidad?' al '+semData.intensidad:''}`,W-pad-5,y+5.5,{align:'right'});
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(120,120,120);
    doc.text('Series × Reps',W-pad-5,y+10,{align:'right'}); y+=19;
  }
  // 1RM
  const rmValidos=RM_EJS.filter(ej=>al.rm&&al.rm[ej]&&al.rm[ej].peso>0);
  if(rmValidos.length>0){
    checkY(rmValidos.length*14+22);
    doc.setFillColor(0,0,0); doc.rect(pad,y,W-pad*2,8,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('PESOS MÁXIMOS (1RM)',pad+4,y+5.5); y+=10;
    rmValidos.forEach((ej,i)=>{
      const dato=al.rm[ej]; checkY(14);
      doc.setFillColor(i%2===0?248:255,i%2===0?248:255,i%2===0?248:255);
      doc.rect(pad,y,W-pad*2,13,'F');
      doc.setTextColor(0,0,0); doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.text(ej,pad+3,y+5); doc.text(`${dato.peso} kg`,pad+58,y+5);
      if(dato.fecha){ doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(150,150,150); doc.text(dato.fecha,pad+58,y+10); }
      [70,75,80,85,90,95].forEach((pct,pi)=>{
        const bx=pad+88+pi*18;
        doc.setFillColor(225,225,225); doc.roundedRect(bx,y+1.5,16,10,1,1,'F');
        doc.setTextColor(0,0,0); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
        doc.text(`${Math.round(dato.peso*pct/100)}`,bx+8,y+6.5,{align:'center'});
        doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.setTextColor(120,120,120);
        doc.text(`${pct}%`,bx+8,y+10.5,{align:'center'});
      }); y+=14;
    }); y+=6;
  }
  // Historial
  const ejercicios=al.plan.dias.flatMap(d=>d.ejercicios);
  const ejConHist=ejercicios.filter(ej=>(historiales[ej.id]||[]).length>0);
  if(ejConHist.length>0){
    checkY(20);
    doc.setFillColor(0,0,0); doc.rect(pad,y,W-pad*2,8,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('HISTORIAL DE CARGAS POR EJERCICIO',pad+4,y+5.5); y+=12;
    ejConHist.forEach(ej=>{
      const hist=historiales[ej.id]||[];
      const maxPeso=Math.max(...hist.map(h=>h.peso));
      checkY(hist.length*6+18);
      doc.setFillColor(228,228,228); doc.rect(pad,y,W-pad*2,9,'F');
      doc.setTextColor(0,0,0); doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.text(ej.nombre,pad+3,y+6);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(76,175,80);
      doc.text(`Máx: ${maxPeso} kg`,W-pad-3,y+6,{align:'right'}); y+=10;
      [...hist].slice(-10).forEach((h,i)=>{
        doc.setFillColor(i%2===0?252:255,i%2===0?252:255,i%2===0?252:255);
        doc.rect(pad,y,W-pad*2,6,'F');
        const barW=Math.max(4,(h.peso/maxPeso)*80);
        doc.setFillColor(200,235,200); doc.rect(pad+28,y+1.5,barW,3,'F');
        doc.setTextColor(130,130,130); doc.setFontSize(7.5); doc.setFont('helvetica','normal');
        doc.text(h.fecha,pad+3,y+4.2);
        doc.setTextColor(0,0,0); doc.setFont('helvetica','bold');
        doc.text(`${h.peso} kg`,W-pad-3,y+4.2,{align:'right'}); y+=6;
      }); y+=6;
    });
  }
  // Asistencia
  checkY(40);
  const mesStr=mesActual().slice(0,7);
  const asistTotal=(al.asistencia||[]).length;
  const asistMes=(al.asistencia||[]).filter(d=>d.startsWith(mesStr)).length;
  const diasEnMes=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();
  const diasHasta=Array.from({length:diasEnMes},(_,i)=>new Date(new Date().getFullYear(),new Date().getMonth(),i+1)).filter(d=>d<=new Date()).length;
  const pctAsist=diasHasta>0?Math.round(asistMes/diasHasta*100):0;
  doc.setFillColor(0,0,0); doc.rect(pad,y,W-pad*2,8,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('ASISTENCIA',pad+4,y+5.5); y+=12;
  [['ESTE MES',String(asistMes)],['ASISTENCIA',pctAsist+'%'],['TOTAL',String(asistTotal)]].forEach(([label,val],i)=>{
    const x=pad+i*(boxW+4);
    doc.setFillColor(245,245,245); doc.roundedRect(x,y,boxW,16,2,2,'F');
    doc.setTextColor(0,0,0); doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(val,x+boxW/2,y+8,{align:'center'});
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(150,150,150);
    doc.text(label,x+boxW/2,y+13.5,{align:'center'});
  }); y+=22;
  const diasAsistMes=(al.asistencia||[]).filter(d=>d.startsWith(mesStr)).sort();
  if(diasAsistMes.length>0){
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80);
    doc.text('Días asistidos: '+diasAsistMes.map(d=>d.split('-')[2]).join(', '),pad,y); y+=8;
  }
  // Diario
  if(al.diario&&al.diario.length>0){
    const diarioMes=al.diario.filter(d=>d.fecha.startsWith(mesStr));
    if(diarioMes.length>0){
      checkY(30);
      doc.setFillColor(0,0,0); doc.rect(pad,y,W-pad*2,8,'F');
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.text('DIARIO DEL MES',pad+4,y+5.5); y+=12;
      [...diarioMes].sort((a,b)=>b.fecha.localeCompare(a.fecha)).forEach(e=>{
        checkY(14);
        doc.setFillColor(248,248,248); doc.roundedRect(pad,y,W-pad*2,12,2,2,'F');
        doc.setTextColor(150,150,150); doc.setFontSize(7); doc.setFont('helvetica','normal');
        doc.text(e.fecha,pad+3,y+5);
        doc.setTextColor(0,0,0); doc.setFontSize(8);
        doc.text(doc.splitTextToSize(e.texto,W-pad*2-6)[0],pad+3,y+9.5); y+=14;
      });
    }
  }
  // Footer
  const pageCount=doc.internal.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i); doc.setFillColor(0,0,0); doc.rect(0,287,W,10,'F');
    doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.text('Desarrollo Integral · Centro de Entrenamiento',pad,293);
    doc.text(`${i} / ${pageCount}`,W-pad,293,{align:'right'});
  }
  doc.save(`DI_${al.nombre.replace(/ /g,'_')}_${hoy()}.pdf`);
};
