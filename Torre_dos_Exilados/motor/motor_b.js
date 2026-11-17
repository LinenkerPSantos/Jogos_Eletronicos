// ===================== MOTOR (parte B): efeitos, armadilhas, combate =====================

// ---------- escolhas (pessoa decide; NPC usa a 1ª opção ou o menor valor) ----------
async function escolher(p, titulo, texto, opcoes){
  if(opcoes.length===1) return opcoes[0].val;
  return eh(p) ? UI.pick(titulo, texto, opcoes) : opcoes[0].val;
}
// escolhe n cartas de uma lista. NPC descarta as de menor valor
async function escolherCartas(p, titulo, lista, n, texto){
  n=Math.min(n,lista.length); if(n<=0) return [];
  if(n===lista.length) return lista.slice();
  if(eh(p)) return UI.pickCartas(titulo, lista, n, n, texto);
  return lista.slice().sort((a,b)=>valorCarta(p,a)-valorCarta(p,b)).slice(0,n);
}
async function descartarMao(p,n,titulo){
  n=Math.min(n,p.mao.length); if(n<=0) return;
  const esc=await escolherCartas(p, titulo||`Descarte ${n} carta${n>1?'s':''} da mão`, p.mao.slice(), n);
  esc.forEach(c=>descartar(p,c));
  log(`${p.nome} descarta ${esc.length} carta${esc.length>1?'s':''} da mão.`, p);
}
function perderPE(p,n){ if(n<=0||p.pe<=0)return; const antes=p.pe; p.pe=Math.max(0,p.pe-n); log(`${p.nome} perde ${antes-p.pe} PE.`, p); }
function ganharPE(p,n){ if(n<=0)return; p.pe+=n; log(`${p.nome} ganha ${n} PE.`, p); }
function virarMagias(p,n){
  const pe=p.magias.filter(m=>!m.virada); const k = n==='t' ? pe.length : Math.min(n,pe.length);
  for(let i=0;i<k;i++) pe[i].virada=true;
  if(k) log(`${p.nome} vira ${k} magia${k>1?'s':''}.`, p);
  return k;
}
function desvirarMagias(p,n){
  const v=p.magias.filter(m=>m.virada); const k = n==='t' ? v.length : Math.min(n,v.length);
  for(let i=0;i<k;i++) v[i].virada=false;
  if(k) log(`${p.nome} desvira ${k} magia${k>1?'s':''}.`, p);
  return k;
}
function soEquip(p){ return equipados(p); }
async function perderEquip(p,n,titulo,filtro){
  for(let i=0;i<n;i++){
    const L=soEquip(p).filter(filtro||(()=>true)); if(!L.length) return;
    let c;
    if(L.length===1) c=L[0];
    else if(eh(p)) c=(await UI.pickCartas(titulo||'Escolha 1 item equipado para perder',L,1,1))[0];
    else c=L.slice().sort((a,b)=>(a.poder||0)-(b.poder||0))[0];
    descartar(p,c); log(`${p.nome} perde ${c.nome}.`, p);
  }
}
async function sobe(p){ if(p.andar<10){ p.andar++; log(`${p.nome} sobe para o andar ${p.andar}.`, p); } }

// ---------- castigo de monstros ----------
// "assinatura" do estado do jogador: serve para detectar um castigo que não teve efeito (nada a perder)
const assinatura = p => [p.pe,p.mao.length,equipados(p).length,p.magias.length,p.magias.filter(m=>m.virada).length,p.andar,p.mochila.length,p.petrificado,!!p.raca,!!p.classe,G.jogadores.map(q=>q.mao.length).join()].join('|');
async function aplicarCastigo(p, monstros, C){
  for(const m of monstros){
    const txt = castigoTxt(m.castigo);
    log(`💀 Castigo de ${m.nome}: ${txt}.`, p);
    const ant=G.capt; G.capt=[];                       // captura o que realmente aconteceu
    for(const op of m.castigo){
      const antes=assinatura(p);
      await aplicarOp(p,op,m,C);
      if(assinatura(p)===antes && op.k!=='kobold') { const s=`(${castigoTxt([op])}: nada a perder, sem efeito)`; log(s,p); G.capt.push(s); }
    }
    const res=G.capt.join(' '); G.capt=ant;
    await cena(p,'combate','💀','Castigo!',`${m.nome}: ${txt}. Resultado: ${res||'sem efeito.'}`,[m]);
  }
}
async function aplicarOp(p,op,m,C){
  switch(op.k){
    case 'pe': perderPE(p,op.n); break;
    case 'descM': await descartarMao(p,op.n); break;
    case 'pes': if(p.equip.pes){ const c=p.equip.pes; descartar(p,c); log(`${p.nome} perde ${c.nome}.`,p);} break;
    case 'cab': if(p.equip.cabeca){ const c=p.equip.cabeca; descartar(p,c); log(`${p.nome} perde ${c.nome}.`,p);} break;
    case 'tronco': if(p.equip.tronco){ const c=p.equip.tronco; descartar(p,c); log(`${p.nome} perde ${c.nome}.`,p);} break;
    case 'vira': virarMagias(p,op.n); break;
    case 'viraT': virarMagias(p,'t'); break;
    case 'sobe': await sobe(p); break;
    case 'equip': await perderEquip(p,op.n,'Escolha o equipamento a perder'); break;
    case 'mochila': if(p.mochila.length){ p.mochila.slice().forEach(c=>descartar(p,c)); log(`${p.nome} perde a carta da Mochila.`,p);} break;
    case 'turno': p.petrificado=true; log(`🗿 ${p.nome} foi petrificado e perde o próximo turno!`,p); break;
    case 'todosEq': soEquip(p).forEach(c=>descartar(p,c)); log(`${p.nome} perde todos os itens equipados!`,p); break;
    case 'idRC': if(p.raca) descartar(p,p.raca); if(p.classe) descartar(p,p.classe); log(`${p.nome} esquece quem era (perde Raça e Classe).`,p); break;
    case 'magEq': if(p.magias.length){ const c = eh(p)&&p.magias.length>1 ? (await UI.pickCartas('Descarte 1 magia equipada',p.magias.slice(),1,1))[0] : p.magias[p.magias.length-1]; descartar(p,c); log(`${p.nome} perde ${c.nome}.`,p);} break;
    case 'saq': { const q=esquerda(p); if(p.mao.length){ const c=p.mao.splice(rnd(p.mao.length),1)[0]; q.mao.push(c); log(`${q.nome} pega uma carta aleatória da mão de ${p.nome}.`,q);} break; }
    case 'kobold': { const c=topoE(); if(c){ log(`Kobold revela: ${c.nome}.`,p); if(c.tipo==='armadilha'){ await armadilha(p,c,{}); jogarFora(c);} else if(c.guardiao) G.E.push(c); else jogarFora(c);} break; }
    case 'bruto': { const L=soEquip(p); if(L.length){ const c=L.sort((a,b)=>(b.poder||0)-(a.poder||0))[0]; descartar(p,c); log(`${direita(p).nome} escolhe: ${p.nome} perde ${c.nome}.`,p);} break; }
    case 'mimico': if(p.mochila.length){ p.mochila.slice().forEach(c=>descartar(p,c)); } await perderEquip(p,1); break;
    case 'escTronco': await perderEquip(p,1,'Perca o escudo ou o item de tronco',c=>c.tipo==='escudo'||c.tipo==='tronco'); break;
    case 'enxame': if(!virarMagias(p,1)) perderPE(p,2); break;
    case 'golem': perderPE(p,4); break;
    case 'maoAte1': { const k=p.mao.length-1; if(k>0){ const esc=await escolherCartas(p,'Descarte até ficar com 1 carta na mão',p.mao.slice(),k); esc.forEach(c=>descartar(p,c)); log(`${p.nome} descarta a mão até ficar com 1 carta.`,p);} break; }
  }
}

// ---------- armadilhas ----------
function anulaTrap(p){
  const L=[];
  const anel=p.equip.acc&&p.equip.acc.esp.anel?p.equip.acc:null; if(anel) L.push({label:'Anel de Retorno (descartar)',carta:anel,custo:2,run:()=>descartar(p,anel)});
  const fd=p.mao.find(c=>c.ef==='desarme'); if(fd) L.push({label:'Ferramentas de Desarme',carta:fd,custo:1,run:()=>descartar(p,fd)});
  const pu=p.magias.find(m=>m.nome==='Purificar'&&!m.virada); if(pu) L.push({label:'Purificar',carta:pu,custo:1,run:()=>{pu.virada=true; evento(p,{t:'magia',nome:'Purificar'});}});
  const ga=p.magias.find(m=>m.nome==='Gato Espectral'&&!m.virada); if(ga) L.push({label:'Gato Espectral (virar)',carta:ga,custo:0,run:()=>{ga.virada=true;}});
  return L.sort((a,b)=>a.custo-b.custo);
}
// descreve, para o estado atual do jogador, o que a armadilha causaria
function impactoTrap(p,c){
  const pe=n=>`perde ${Math.min(n,p.pe)} PE (você tem ${p.pe})`;
  const e=p.equip, pv=p.magias.filter(m=>!m.virada).length;
  switch(c.nome){
    case 'Piso Falso': case 'Piso Instável': return pe(3)+'.';
    case 'Fosso Oculto': return pe(4)+'.';
    case 'Lâminas Ocultas': { if(e.maos.some(i=>i.esp&&i.esp.imuneLaminas)) return 'nada: a Égide Rúnica protege você.'; const a=e.maos.filter(i=>i.tipo==='arma').sort((x,y)=>y.poder-x.poder)[0]; return `você escolhe: ${pe(2)} OU descartar ${a?a.nome:'(você não tem arma equipada)'}.`; }
    case 'Dardos Envenenados': return `você escolhe: ${pe(2)} OU descartar ${e.cabeca?e.cabeca.nome:'(você não tem item de cabeça)'}.`;
    case 'Névoa Entorpecente': return pv?`vira 1 das suas ${pv} magia(s) em pé.`:`você não tem magia em pé: ${pe(2)}.`;
    case 'Runa do Silêncio': case 'Selo do Mutismo': case 'Véu da Surdez': return pv?`vira ${pv} magia(s) em pé (ficam sem uso até um Descanso).`:'nada: você não tem magias em pé.';
    case 'Ladrão nas Sombras': return `descarta a Mochila (${p.mochila.length} carta(s)) e 1 carta da mão.`;
    case 'Gás do Esquecimento': return (p.raca||p.classe)?`você escolhe perder ${[p.raca&&'Raça '+p.raca.nome,p.classe&&'Classe '+p.classe.nome].filter(Boolean).join(' ou ')}.`:'nada: você não tem Raça nem Classe.';
    case 'Desabamento': return `${pe(5)} e sobe 1 andar (andar atual ${p.andar}).`;
    case 'Corrente de Ar': return 'cada jogador passa 1 carta da mão ao jogador da esquerda.';
    case 'Ácido Corrosivo': return e.tronco?`você perde ${e.tronco.nome} (tronco).`:'nada: você não tem item de tronco equipado.';
    case 'Portal Reverso': return `${pe(3)} e sobe 1 andar.`;
    case 'Marca do Caçador': return 'o próximo monstro que você enfrentar ganha +2 Poder.';
    case 'Fios de Captura': return 'no seu próximo turno você não pode equipar nem trocar itens.';
    case 'Maldição Arcana': return p.magias.length?'você descarta 1 magia equipada.':'nada: você não tem magia equipada.';
  }
  return c.txt;
}
async function armadilha(p,c,op){
  log(`🪤 ${c.nome}: ${c.txt}`, p);
  await cena(p,'perigo','🪤','Armadilha!',`${p.nome} caiu em ${c.nome}: ${c.txt}`,[c]);
  const L=anulaTrap(p);
  if(L.length){
    let usar=null;
    if(eh(p)){
      const custoTxt={'Anel de Retorno (descartar)':'Custo: o Anel é descartado (só 1 vez por partida).','Ferramentas de Desarme':'Custo: a carta é descartada.','Purificar':'Custo: a magia fica virada ↻ (só desvira no Descanso).','Gato Espectral (virar)':'Custo: o Familiar fica virado ↻ e perde o bônus de Poder até desvirar.'};
      const r=await UI.pick('Armadilha!',`${c.nome}: ${c.txt}

▶ O que acontece com VOCÊ se sofrer: ${impactoTrap(p,c)}

Você pode anular a armadilha gastando um recurso, ou aceitar o efeito.`,[...L.map((a,i)=>({label:'Anular com '+a.label,desc:custoTxt[a.label],val:i,carta:a.carta})),{label:'Sofrer a armadilha',desc:impactoTrap(p,c),val:-1}],{cartas:[c]});
      usar = r>=0 ? L[r] : null;
    } else if(L[0].custo<2 || rnd(100)<50) usar=L[0];
    if(usar){ usar.run(); log(`${p.nome} anula ${c.nome}!`,p); evento(p,{t:'trapAnula'}); return; }
  }
  switch(c.nome){
    case 'Piso Falso': case 'Piso Instável': perderPE(p,3); break;
    case 'Fosso Oculto': perderPE(p,4); break;
    case 'Lâminas Ocultas': {
      if(p.equip.maos.some(i=>i.esp&&i.esp.imuneLaminas)){ log('A Égide Rúnica protege contra as lâminas.',p); break; }
      const armas=p.equip.maos.filter(i=>i.tipo==='arma').sort((a,b)=>b.poder-a.poder);
      const r=await escolher(p,'Lâminas Ocultas','Perca 2 PE ou descarte sua arma de maior bônus.',[{label:'Perder 2 PE',val:'pe'},...(armas.length?[{label:'Descartar '+armas[0].nome,val:'arma'}]:[])]);
      if(r==='pe') perderPE(p,2); else { descartar(p,armas[0]); log(`${p.nome} perde ${armas[0].nome}.`,p); } break; }
    case 'Dardos Envenenados': {
      const r=await escolher(p,'Dardos Envenenados','Perca 2 PE ou descarte o item de cabeça.',[{label:'Perder 2 PE',val:'pe'},...(p.equip.cabeca?[{label:'Descartar '+p.equip.cabeca.nome,val:'cab'}]:[])]);
      if(r==='pe') perderPE(p,2); else { log(`${p.nome} perde ${p.equip.cabeca.nome}.`,p); descartar(p,p.equip.cabeca); } break; }
    case 'Névoa Entorpecente': if(!virarMagias(p,1)) perderPE(p,2); break;
    case 'Runa do Silêncio': case 'Selo do Mutismo': case 'Véu da Surdez': virarMagias(p,'t'); break;
    case 'Ladrão nas Sombras': p.mochila.slice().forEach(x=>descartar(p,x)); await descartarMao(p,1); break;
    case 'Gás do Esquecimento': {
      const o=[]; if(p.raca) o.push({label:'Perder Raça ('+p.raca.nome+')',val:'r'}); if(p.classe) o.push({label:'Perder Classe ('+p.classe.nome+')',val:'c'});
      if(o.length){ const r=await escolher(p,'Gás do Esquecimento','Descarte sua Raça ou sua Classe.',o.reverse()); const x=r==='r'?p.raca:p.classe; descartar(p,x); log(`${p.nome} esquece ${x.nome}.`,p);} break; }
    case 'Desabamento': perderPE(p,5); await sobe(p); break;
    case 'Corrente de Ar': {
      const esc=[]; for(const j of G.jogadores){ if(!j.mao.length){esc.push(null);continue;} esc.push((await escolherCartas(j,'Corrente de Ar: passe 1 carta ao jogador da esquerda',j.mao.slice(),1))[0]); }
      G.jogadores.forEach((j,i)=>{ const c2=esc[i]; if(c2){ tirar(j,c2); esquerda(j).mao.push(c2);} });
      log('Todos passam 1 carta da mão ao jogador da esquerda.'); break; }
    case 'Ácido Corrosivo': if(p.equip.tronco){ log(`${p.nome} perde ${p.equip.tronco.nome}.`,p); descartar(p,p.equip.tronco);} break;
    case 'Portal Reverso': perderPE(p,3); await sobe(p); break;
    case 'Marca do Caçador': p.marca=2; log(`O próximo monstro de ${p.nome} receberá +2 Poder.`,p); break;
    case 'Fios de Captura': p.fios=true; log(`${p.nome} não poderá equipar nem trocar itens no próximo turno.`,p); break;
    case 'Maldição Arcana': if(p.magias.length){ const c2 = eh(p)&&p.magias.length>1 ? (await UI.pickCartas('Maldição Arcana: descarte 1 magia equipada',p.magias.slice(),1,1))[0] : p.magias[p.magias.length-1]; descartar(p,c2); log(`${p.nome} perde ${c2.nome}.`,p);} break;
  }
  evento(p,{t:'trap'});
}

// ---------- contramágica ----------
async function tentaCancelar(alvo, descricao){
  const cm=alvo.magias.find(m=>m.nome==='Contramágica'&&!m.virada); if(!cm) return false;
  let usar;
  if(eh(alvo)) usar = await UI.pick('Contramágica?',`${descricao}\nCancelar com Contramágica?`,[{label:'Usar Contramágica',val:true},{label:'Deixar',val:false}]);
  else usar = rnd(100)<70;
  if(usar){ cm.virada=true; log(`✨ ${alvo.nome} usa Contramágica e cancela!`,alvo); evento(alvo,{t:'magia',nome:'Contramágica'}); }
  return usar;
}

// ================= COMBATE =================
function novoCombate(p,cards,op={}){
  const C={p, mons:cards.map(c=>({c,mod:0,pe:0,t:0,fontes:[]})), bonus:0, helper:null, magiasUsadas:[], consum:false, interf:false, trapInterf:false,
    fugaBonus:0, reducao:0, ignoraAndar:false, seVence:{pe:0,t:0}, sobrec:0, autoVit:false, guardiao:cards.some(c=>c.guardiao), op, poderBase0:0};
  if(p.marca){ C.mons[0].mod+=p.marca; C.mons[0].fontes.push({txt:'Armadilha Marca do Caçador (efeito pendente)',v:p.marca}); p.marca=0; }
  if(p.presagio){ C.mons[0].mod-=2; C.mons[0].fontes.push({txt:'Evento Presságio/Visão do Fim',v:-2}); p.presagio=false; }
  return C;
}
const nomesMon = C => C.mons.map(m=>m.c.nome).join(' + ');
async function combate(p,cards,op={}){
  const C=novoCombate(p,cards,op);
  C.poderBase0=poderBase(p,C).total;
  log(`⚔️ ${p.nome} enfrenta ${nomesMon(C)} (Poder ${totalMon(C)}).`, p);
  UI.render();
  await cena(p,'combate','⚔️','Combate!',`${p.nome} enfrenta ${nomesMon(C)} (Poder ${totalMon(C)}) no andar ${p.andar}.`,C.mons.map(m=>m.c));
  await fasePrepCombate(C);
  await faseAjudante(C);                         // o ajudante também age no combate (magias e cartas da mão)
  for(let r=0;r<4 && !C.fugir;r++){
    const houve=await janelaInterf(C);
    if(!houve) break;
    UI.render();
    await fasePrepCombate(C);
    await faseAjudante(C);
  }
  return resolverCombate(C);
}

// ---- ações disponíveis ao combatente ----
function efeitoMagia(m,C,ator){
  const p=ator||C.p, h=monHab(C), tipos=monTipos(C), n=m.nome; let b=0, red=0; const ex={};
  const ud=tipos.has('Morto-vivo')||tipos.has('Demônio')||tipos.has('Fantasma');
  switch(n){
    case 'Bola de Fogo': b=6; break; case 'Lança de Fogo': b=3; break; case 'Fúria Infernal': b=2; ex.t=1; break;
    case 'Muralha de Chamas': red=4; break; case 'Explosão': ex.auto=true; break;
    case 'Mísseis Arcanos': b=4; break; case 'Seta Arcana': b=2; break;
    case 'Luz Sagrada': b=ud?8:4; break; case 'Chama Sagrada': b=ud?5:2; break; case 'Bênção': b=5; break;
    case 'Pele de Casca': b=3; break; case 'Folhagem Protetora': b=2; break;
    case 'Vinhas': red=3; ex.fuga=2; break; case 'Chamado da Fera': b=6; ex.desc=1; break; case 'Passo Silvestre': ex.ign=true; break;
    default: return null;
  }
  if(m.cor==='Vermelha' && h.imuneVermelha) return null;
  if(m.cor==='Azul' && h.noAzul) return null;
  if(b>0){
    if(m.cor==='Branca') b+=h.brancaMais||0;
    if(m.cor==='Azul') b+=h.azulMais||0;
    if(m.cor==='Vermelha') b+=h.vermelhaMais||0;
  }
  if(m.cor==='Vermelha' && p.raca && p.raca.nome==='Tiefling') b+=1;
  if(m.cor==='Verde' && p.classe && p.classe.nome==='Druida') b+=1;
  let val=b+red;
  if(ex.ign) val = C.ignoraAndar?0:ANDARES[p.andar].b;
  if(ex.auto) val = totalMon(C)<=6 ? 99 : 0;
  if(val<=0 && !ex.t) return null;
  return {b,red,ex,val};
}
// explica por que magias NÃO aparecem como opção no combate
function motivosMagias(p,C){
  const R=[];
  p.mao.filter(c=>c.tipo==='magia').forEach(c=>R.push(`${c.nome}: está na MÃO, não equipada. Magias só funcionam equipadas (equipe na Preparação, antes de explorar).`+(tenhoProf(p,c)?'':` Você também não tem proficiência (${c.cor}).`)));
  p.magias.forEach(c=>{
    if(c.virada && !c.fam) R.push(`${c.nome}: está VIRADA ↻ (já usada). Só desvira num Ponto de Descanso ou por habilidade.`);
    else if(c.fam && c.virada) { /* familiar virado ainda pode ser sacrificado */ }
    else if(!c.fam && !efeitoMagia(c,C,p)) R.push(`${c.nome}: sem efeito útil neste combate (não é magia de combate ou o monstro a bloqueia).`);
  });
  return R;
}
function acoesCombate(p,C){
  const A=[]; const h=monHab(C);
  // magias
  p.magias.forEach(m=>{
    if(m.fam){
      const sac=(label,val,fn)=>A.push({id:'sac'+m.uid,label,desc:'Sacrificar',val,custo:6,run:async()=>{ await fn(); descartar(p,m); C.magiasUsadas.push(m.nome); evento(p,{t:'magia',nome:m.nome}); }});
      const vir=(label,val,fn)=>{ if(!m.virada) A.push({id:'vir'+m.uid,label,desc:'Virar',val,custo:2,run:async()=>{ await fn(); m.virada=true; C.magiasUsadas.push(m.nome); evento(p,{t:'magia',nome:m.nome}); }}); };
      switch(m.nome){
        case 'Corvo Agourento': vir(`${m.nome}: monstro −3`,3,async()=>{C.reducao+=3;}); sac(`Sacrificar ${m.nome}: monstro −8`,8,async()=>{C.reducao+=8;}); break;
        case 'Serpente Sombria': vir(`${m.nome}: +4 Poder`,4-m.pod,async()=>{C.bonus+=4;}); sac(`Sacrificar ${m.nome}: +10 Poder`,10,async()=>{C.bonus+=10;}); break;
        case 'Sanguessuga Vil': vir(`${m.nome}: se vencer +2 PE`,0.1,async()=>{C.seVence.pe+=2;}); sac(`Sacrificar ${m.nome}: se vencer +5 PE`,0.1,async()=>{C.seVence.pe+=5;}); break;
        case 'Sombra Devoradora': vir(`${m.nome}: se vencer +1 Tesouro`,0.1,async()=>{C.seVence.t+=1;}); break;
      }
      return;
    }
    if(m.virada) return;
    const ef=efeitoMagia(m,C,p); if(!ef) return;
    A.push({id:'mag'+m.uid,label:`${m.nome} (${m.cor})`,desc:m.txt,val:ef.val,custo:m.unica?5:3,run:async()=>{
      C.bonus+=ef.b; C.reducao+=ef.red; if(ef.ex.t) C.seVence.t+=ef.ex.t; if(ef.ex.fuga) C.fugaBonus+=ef.ex.fuga; if(ef.ex.ign) C.ignoraAndar=true; if(ef.ex.auto) C.autoVit=true;
      if(m.unica) descartar(p,m); else m.virada=true;
      C.magiasUsadas.push(m.nome); evento(p,{t:'magia',nome:m.nome});
      log(`✨ ${p.nome} usa ${m.nome}.`,p);
      if(ef.ex.desc) await descartarMao(p,1);
    }});
  });
  // consumíveis
  p.mao.forEach(c=>{
    if(c.tipo==='consumivel'&&(c.ef==='forca3'||c.ef==='forca5')){
      const v=c.ef==='forca3'?3:5;
      A.push({id:'con'+c.uid,label:c.nome,desc:c.txt,val:v,custo:1+v/10,run:async()=>{ C.bonus+=v; C.consum=true; descartar(p,c); log(`🧪 ${p.nome} usa ${c.nome}.`,p); }});
    }
    if(c.tipo==='mod' && c.mp<0){
      A.push({id:'mod'+c.uid,label:`Jogar ${c.nome} no monstro`,desc:`Monstro ${c.mp} Poder`,val:-c.mp,custo:1,run:async()=>{ await aplicarMod(C,c,p); }});
    }
  });
  // Sobrecarga (Mago)
  if(p.classe&&p.classe.nome==='Mago'&&C.sobrec<2&&p.mao.length>0)
    A.push({id:'sobrec',label:'Sobrecarga (descartar 1 carta: +2 Poder)',desc:'Mago',val:2,custo:4,run:async()=>{ await descartarMao(p,1,'Sobrecarga: descarte 1 carta'); C.bonus+=2; C.sobrec++; C.magiasUsadas.push('Sobrecarga'); }});
  return A;
}
async function aplicarMod(C,c,quem){
  tirar(quem,c);
  if(c.nome==='Possuído'){
    const rev=[]; let novo=null;
    while(G.E.length||G.dE.length){ const x=topoE(); if(!x)break; if(x.tipo==='monstro'&&!x.guardiao){ novo=x; break; } rev.push(x); if(rev.length>60)break; }
    G.E.push(...rev);
    jogarFora(c);
    if(novo){ C.mons.push({c:novo,mod:0,pe:0,t:0,fontes:[]}); log(`👻 Possuído! ${novo.nome} se junta ao combate.`); }
    else log('Possuído: nenhum monstro foi encontrado.');
    return;
  }
  const m=C.mons[0];
  m.mod+=c.mp; m.pe+=c.mpe; m.t+=c.mt; m.fontes.push({txt:`${c.nome} jogada por ${quem.nome}`,v:c.mp});
  jogarFora(c);
  log(`${quem.nome} joga ${c.nome} em ${m.c.nome} (${c.mp>0?'+':''}${c.mp} Poder).`, quem);
}
function candidatosAjuda(C){ if(C.helper||C.guardiao||C.p.andar===1) return []; return outros(C.p).filter(q=>q.andar===C.p.andar); }
async function pedirAjuda(C,q){
  const p=C.p; let ok;
  if(eh(q)){
    const antes=totalJog(C); C.helper=q; const dep=totalJog(C); C.helper=null;
    ok=await UI.pick('Pedido de ajuda',`${p.nome} pede sua ajuda contra ${nomesMon(C)}.\nPoder dele: ${antes} → com você: ${dep}. Monstro: ${totalMon(C)}.\nVocê recebe 1 Tesouro se ajudar (os PE ficam com quem lutar).`,[{label:'Ajudar',val:true},{label:'Recusar',val:false}]);
  } else {
    const antes=totalJog(C), mt=totalMon(C); C.helper=q; const dep=totalJog(C); C.helper=null;
    status(q,'🤔',`está decidindo se ajuda ${p.nome}...`,'inter'); $('#status').classList.add('pensa'); await esperar(700);
    ok =dep>mt ? (antes<=mt ? rnd(100)<85 : rnd(100)<40) : false;
  }
  if(ok){ C.helper=q; log(`🤝 ${q.nome} ajuda ${p.nome} (+${ajudaPoder(C)} Poder).`,q); await cena(q,'inter','🤝','Ajuda!',`${q.nome} ajuda ${p.nome} (+${ajudaPoder(C)} Poder).`); } else log(`${q.nome} recusa ajudar ${p.nome}.`,q);
  return ok;
}

// Ajudar também é participar do combate: o ajudante pode usar suas magias equipadas (não precisam ter (I)),
// poções de força e modificadores negativos da mão. Tudo soma no Poder do combate que ele está ajudando.
async function faseAjudante(C){
  const q=C.helper, p=C.p; if(!q || C.fugir) return;
  const util=()=>acoesCombate(q,C).filter(a=>a.val>=1);      // só o que muda o Poder (sem bônus de PE/Tesouro, que iriam para outro jogador)
  if(eh(q)){
    for(let g=0;g<20;g++){
      const A=util();
      if(!A.length){
        if(g===0) await avisar(q,`Você está ajudando ${p.nome}`,`Você não tem magias equipadas utilizáveis, poções de Poder nem modificadores na mão para usar neste combate.
Poder total: ${totalJog(C)} contra ${totalMon(C)}.`);
        break;
      }
      status(q,'🤝',`está ajudando ${p.nome}: usando magias e cartas...`,'inter');
      const r=await UI.pick(`Você está ajudando ${p.nome}`,`Contra ${nomesMon(C)}. Poder total: ${totalJog(C)} contra ${totalMon(C)}.
Use magias equipadas e cartas da mão para ajudar, ou termine a sua ajuda.`,
        [...A.map((a,i)=>({label:a.label,desc:a.desc+' (+'+a.val+')',val:i})),{label:'✔ Pronto (continuar o combate)',val:-1}],{C});
      if(r<0) break;
      await A[r].run(); UI.render();
    }
  } else {
    const orc=podeVencerEmpate(p);
    for(let it=0;it<8;it++){
      const mt=totalMon(C), jt=totalJog(C);
      if(jt>mt || (orc&&jt===mt)) break;
      const A=util(); const falta=orc?mt-jt:mt-jt+1;
      if(!A.length || A.reduce((x,a)=>x+a.val,0)<falta) break;   // não gasta recurso se não dá para virar o combate
      A.sort((a,b)=>a.custo-b.custo);
      await A[0].run(); UI.render(); await esperar(250);
    }
  }
}
async function fasePrepCombate(C){
  const p=C.p;
  if(!eh(p)){ await npcCombate(C); return; }
  for(let guard=0;guard<30;guard++){
    const A=acoesCombate(p,C);
    const opts=A.map((a,i)=>({label:a.label,desc:a.desc,val:'a'+i}));
    const cand=candidatosAjuda(C);
    if(cand.length) opts.push({label:'Pedir ajuda a '+cand.map(q=>q.nome).join(' / '),val:'ajuda',desc:'Mesmo andar. O ajudante soma o Poder dele e recebe 1 Tesouro.'});
    const semFuga = p.fugiuTurno && !fugasAuto(p,C).length;
    opts.push({label:'🏃 Fugir (não lutar)',val:'fugir',off:semFuga,desc:semFuga?'Você já tentou fugir neste turno e não tem fuga automática.':'Pula a luta e tenta escapar (fuga automática ou rolagem de d6). Se falhar, você sofre o castigo.'});
    opts.push({label:'⚔️ Lutar!',val:'lutar'});
    const r=await UI.pick(C.guardiao?'Combate contra o Guardião':'Combate!','',opts,{C});
    if(r==='fugir'){ C.fugir=true; return; }
    if(r==='lutar'){
      const perde=!(totalJog(C)>totalMon(C)||(podeVencerEmpate(p)&&totalJog(C)===totalMon(C)));
      if(perde && A.length){
        const ok=await UI.pick('Tem certeza?',`Seu Poder (${totalJog(C)}) não vence o monstro (${totalMon(C)}), e você ainda tem opções de combate disponíveis (${A.map(a=>a.label).join('; ')}).
Depois de lutar não dá mais para usá-las. Lutar mesmo assim?`,[{label:'Voltar e usar uma opção',val:false},{label:'Lutar mesmo assim',val:true}]);
        if(!ok) continue;
      }
      return;
    }
    if(r==='ajuda'){ const q = cand.length===1?cand[0]:await UI.pick('Pedir ajuda a quem?','',cand.map(x=>({label:x.nome,val:x}))); await pedirAjuda(C,q); continue; }
    await A[+r.slice(1)].run();
    UI.render();
  }
}
async function npcCombate(C){
  const p=C.p, orc=podeVencerEmpate(p);
  for(let it=0;it<10;it++){
    const mt=totalMon(C), jt=totalJog(C);
    if(jt>mt || (orc&&jt===mt)) break;
    const falta = orc ? mt-jt : mt-jt+1;
    const cand=candidatosAjuda(C);
    if(cand.length){
      let feito=false;
      for(const q of cand){ if(await pedirAjuda(C,q)){ feito=true; break; } }
      if(feito) continue;
      cand.length=0;
    }
    const A=acoesCombate(p,C).filter(a=>a.val>0);
    const soma=A.reduce((s,a)=>s+a.val,0);
    if(soma<falta || !A.length) break;
    A.sort((a,b)=>a.custo-b.custo);
    await A[0].run(); UI.render(); await esperar(250);
  }
}

// ---- janela de interferência ----
function opcoesInterf(q,C){
  const O=[];
  q.mao.forEach(c=>{
    if(c.tipo==='mod') O.push({c,label:`${c.nome}`,desc:c.nome==='Possuído'?'Acrescenta outro monstro':`${c.mp>0?'+':''}${c.mp} Poder no monstro`});
    if(c.tipo==='armadilha'&&c.I) O.push({c,label:`${c.nome} (armadilha)`,desc:c.txt});
  });
  // Invocação de Monstro: carta de Invocação + 1 Monstro da mão => o monstro entra NESTE combate e os Poderes se somam
  const inv=q.mao.find(c=>c.tipo==='invocacao');
  if(inv && podeInvocar(q,C)) q.mao.filter(c=>c.tipo==='monstro'&&!c.guardiao).forEach(m=>O.push({c:inv,m,show:m,
    label:`Invocação: ${m.nome}`,
    desc:`Junta ${m.nome} (Poder ${m.poder}${C.ignoraAndar?'':' + andar '+ANDARES[C.p.andar].b}) ao combate: o Poder dos monstros soma. A fuga e os castigos são resolvidos um monstro por vez.`}));
  return O;
}
// Por que a Invocação não pôde ser usada agora (para avisar o jogador humano em vez de simplesmente não aparecer nada)
function motivoSemInvocar(q,C){
  if(!q.mao.some(c=>c.tipo==='invocacao') || !q.mao.some(c=>c.tipo==='monstro'&&!c.guardiao)) return null;
  if(podeInvocar(q,C)) return null;
  if(C.guardiao) return 'não vale contra o chefe Guardião';
  if(C.op.origem==='invocacao'||C.mons.length>=3) return 'limite de monstros no combate';
  if(G.invocRodada===G.rodada) return 'já houve uma Invocação nesta rodada';
  if(G.ultimoAlvoInvoc===C.p.id) return 'não pode mirar o mesmo jogador duas vezes seguidas';
  if(C.p.andar>q.andar) return `${C.p.nome} está no andar ${C.p.andar}, acima do seu (andar ${q.andar}): só vale em jogador no mesmo andar ou abaixo de você`;
  return null;
}
function podeInvocar(q,C){
  return G.invocRodada!==G.rodada && G.ultimoAlvoInvoc!==C.p.id && C.p.andar<=q.andar   // 1 por rodada; não repete o alvo; só mira mesmo andar ou mais abaixo
    && !C.guardiao && !C.fugir && C.op.origem!=='invocacao' && C.mons.length<3;
}
async function invocarNoCombate(C,q,esc){
  const p=C.p, inv=esc.c, m=esc.m;
  log(`🐾 ${q.nome} joga ${inv.nome} e invoca ${m.nome} contra ${p.nome}!`,q);
  await cena(q,'inter','🐾','Invocação!',`${q.nome} joga ${inv.nome} e invoca ${m.nome} no combate de ${p.nome}. O Poder dos monstros se soma!`,[m]);
  G.invocRodada=G.rodada; G.ultimoAlvoInvoc=p.id;
  descartar(q,inv); tirar(q,m);
  if(await tentaCancelar(p,`${q.nome} invocou ${m.nome} contra você.`)){ jogarFora(m); return; }
  C.interf=true;
  C.mons.push({c:m,mod:0,pe:0,t:0,fontes:[{txt:`Invocado por ${q.nome}`,v:0}]});
  log(`${m.nome} se junta ao combate. Poder dos monstros: ${totalMon(C)}.`,p);
  if(eh(p)) await UI.pick('⚠ Invocação contra você!',`${q.nome} invocou ${m.nome} no seu combate.\nAgora você enfrenta ${nomesMon(C)}: Poder dos monstros ${totalMon(C)} contra o seu ${totalJog(C)}.\nSe precisar fugir, a fuga e o castigo de cada monstro são resolvidos separadamente, um de cada vez.`,[{label:'Entendi',val:1}],{cartas:[m]});
}
async function janelaInterf(C){
  const p=C.p; let houve=false;
  for(const q of outros(p)){
    if(q===C.helper) continue;
    for(let n=0;n<3;n++){
      const O=opcoesInterf(q,C);
      if(n===0 && eh(q)){ const mt=motivoSemInvocar(q,C); if(mt) log(`ℹ️ ${q.nome}: Invocação indisponível neste combate — ${mt}.`,q); }
      if(!O.length) break;
      let esc=null;
      if(eh(q)){
        const r=await UI.pick('Interferência',`${p.nome} enfrenta ${nomesMon(C)}.\nPoder ${totalJog(C)} contra ${totalMon(C)}. Deseja jogar uma carta?`,[...O.map((o,i)=>({label:o.label+' → '+p.nome,desc:o.desc,val:i,carta:o.show||o.c})),{label:'Passar',val:-1}],{C});
        if(r>=0) esc=O[r];
      } else { status(q,'🤔',`está decidindo se interfere no combate de ${p.nome}...`,'inter'); $('#status').classList.add('pensa'); esc=npcEscolheInterf(q,C,O); await esperar(700); }
      if(!esc) break;
      houve=true;
      if(esc.m){ await invocarNoCombate(C,q,esc); UI.render(); await esperar(300); continue; }
      const c=esc.c;
      log(`🃏 ${q.nome} joga ${c.nome} contra ${p.nome}!`,q);
      await cena(q,'inter','🃏','Interferência!',`${q.nome} joga ${c.nome} contra ${p.nome}.`,[c]);
      if(await tentaCancelar(p,`${q.nome} jogou ${c.nome} contra você.`)){ tirar(q,c); jogarFora(c); continue; }
      C.interf=true;
      if(c.tipo==='armadilha'){ tirar(q,c); C.trapInterf=true; await armadilha(p,c,{viaInterf:true}); jogarFora(c); }
      else await aplicarMod(C,c,q);
      if(eh(p)){
        const efeito = c.tipo==='armadilha' ? `Efeito: ${c.txt}` : (c.nome==='Possuído' ? `Outro monstro entrou no combate (${C.mons[C.mons.length-1].c.nome}).` : `O monstro ${C.mons[0].c.nome} ganhou ${c.mp>0?'+':''}${c.mp} de Poder (e ${c.mpe>0?'+':''}${c.mpe} PE na recompensa). Poder do monstro agora: ${totalMon(C)}.`);
        await UI.pick('⚠ Interferência contra você!',`${q.nome} jogou ${c.nome} no seu combate.
${efeito}
Outros jogadores podem jogar Modificadores de Monstro e Armadilhas (I) durante o seu combate; é por isso que o Poder do monstro pode mudar.`,[{label:'Entendi',val:1}],{cartas:[c]});
      }
      UI.render(); await esperar(300);
    }
  }
  return houve;
}
function npcEscolheInterf(q,C,O){
  const margem=totalJog(C)-totalMon(C), p=C.p, lider=p.andar<q.andar||p.andar===1;
  for(const o of O){
    const c=o.c;
    if(o.m){   // Invocação: vale a pena se transforma (ou aproxima de) uma derrota do alvo
      const novo=totalMon(C)+o.m.poder+(C.ignoraAndar?0:ANDARES[p.andar].b);
      if(margem>0 && totalJog(C)<=novo && rnd(100)<80) return o;
      if(margem>0 && lider && rnd(100)<30) return o;
      continue;
    }
    if(c.tipo==='mod'){
      if(c.mp<0) continue;
      if(c.nome==='Possuído'){ if(margem>0&&rnd(100)<50) return o; continue; }
      if(margem>0 && margem<=c.mp && rnd(100)<85) return o;
      if(margem>0 && lider && rnd(100)<35) return o;
    } else if(c.tipo==='armadilha'){
      if(lider && rnd(100)<50) return o;
    }
  }
  return null;
}

// ---- resultado ----
async function resolverCombate(C){
  const p=C.p; const mt=totalMon(C), jt=totalJog(C);
  const vit = !C.fugir && ((C.autoVit && mt<=6) || jt>mt || (podeVencerEmpate(p)&&jt===mt));
  if(C.fugir){
    log(`🏃 ${p.nome} desiste de lutar contra ${nomesMon(C)} e tenta fugir.`,p);
  } else {
    log(`${vit?'🏆':'💥'} ${p.nome}: Poder ${jt} contra ${mt} — ${vit?'VITÓRIA':'DERROTA'}!`,p);
    await cena(p, vit?'vit':'combate', vit?'🏆':'💥', vit?'VITÓRIA!':'DERROTA!',
      `${p.nome} ${vit?'venceu':'perdeu para'} ${nomesMon(C)} (Poder ${jt} contra ${mt})${C.helper?` com ajuda de ${C.helper.nome}`:''}.`);
  }
  await esperar(500);
  let r;
  if(vit) r=await vitoria(C,mt); else r = C.fugir ? await fugirDireto(C) : await derrota(C);
  C.mons.forEach(m=>{ if(m.c.guardiao){ if(!vit||r.fugiu) G.E.push(m.c); } else jogarFora(m.c); });
  evento(p,{t:'fimCombate',magias:C.magiasUsadas.length});
  evento(p,{t:'chk'});
  return {vit, fugiu:r.fugiu};
}
async function vitoria(C,mt){
  const p=C.p;
  let pe=C.seVence.pe, t=C.seVence.t;
  C.mons.forEach(m=>{ pe+=Math.max(0,m.c.pe+m.pe); t+= m.t<0 ? Math.max(1,m.c.t+m.t) : m.c.t+m.t; });
  let share=0; if(C.helper && t>0){ share=1; t--; }
  ganharPE(p,pe); comprarT(p,t);
  if(C.helper){ if(share) comprarT(C.helper,share); }
  const guard=C.mons.some(m=>m.c.guardiao);
  if(guard){ p.chave=true; log(`🗝️ ${p.nome} derrotou o Guardião da Torre e recebe a CHAVE DA TORRE!`,p); await cena(p,'fim','🗝️','Chave da Torre!',`${p.nome} derrotou o Guardião e agora tem a Chave. Se chegar ao andar 1, sai da Torre!`); }
  evento(p,{t:'vit',mons:C.mons.map(m=>({tipos:m.c.tipos,tipo:m.c.guardiao?'guardiao':'monstro'})),poderMon:mt,poderBase:C.poderBase0,
    sozinho:!C.helper,ajudado:!!C.helper,magias:C.magiasUsadas.length,consum:C.consum,interf:C.interf,trapInterf:C.trapInterf,turno:G.turnoN});
  if(C.helper){ log(`${C.helper.nome} ajudou na vitória.`,C.helper); evento(C.helper,{t:'ajuda',quem:p.id}); }
  if(mt>=8 && p.andar>1 && !p.descVenceu){
    p.descVenceu=true;
    await desce(p,'vitória',mt);
    if(C.helper && C.helper.andar>1) await desce(C.helper,'ajuda',p.nome);
  }
  return {fugiu:false};
}

// ---- fuga ----
function bonusFuga(p,C){
  let b=C.fugaBonus||0;
  equipados(p).forEach(i=>{ if(i.esp&&i.esp.fuga&&tenhoProf(p,i)) b+=i.esp.fuga; });
  return b;
}
function fugasAuto(p,C){
  const L=[], h=monHab(C);
  if(h.fugaAuto) L.push({label:'Fugir (o monstro é lento)',run:async()=>{}});
  const bomba=p.mao.find(c=>c.ef==='fuga'); if(bomba) L.push({label:'Bomba de Fumaça',run:async()=>{ descartar(p,bomba); }});
  const inv=p.magias.find(m=>m.nome==='Invisibilidade'&&!m.virada); if(inv&&!h.noAzul) L.push({label:'Invisibilidade',run:async()=>{ inv.virada=true; evento(p,{t:'magia',nome:inv.nome}); }});
  if(p.raca&&p.raca.nome==='Humano'&&!p.humanoAndar[p.andar]&&p.mao.length) L.push({label:'Humano: descartar 1 carta e fugir',run:async()=>{ p.humanoAndar[p.andar]=true; await descartarMao(p,1); }});
  if(p.fugaMarc) L.push({label:'Marcador do Jardim Apodrecido',run:async()=>{ p.fugaMarc=false; }});
  return L;
}
function anulacoes(p){
  const L=[];
  const esc=p.magias.find(m=>m.nome==='Escudo da Fé'&&!m.virada); if(esc) L.push({label:'Escudo da Fé',custo:1,run:()=>{ esc.virada=true; evento(p,{t:'magia',nome:esc.nome}); }});
  const gato=p.magias.find(m=>m.nome==='Gato Espectral'); if(gato) L.push({label:'Sacrificar Gato Espectral',custo:3,run:()=>descartar(p,gato)});
  if(p.classe&&p.classe.nome==='Bruxo'){ const f=p.magias.find(m=>m.fam&&m.nome!=='Gato Espectral'); if(f) L.push({label:'Pacto de Sangue: sacrificar '+f.nome,custo:3,run:()=>descartar(p,f)}); }
  if(p.classe&&p.classe.nome==='Guardião'){ const e=p.equip.maos.find(i=>i.tipo==='escudo'); if(e) L.push({label:'Muralha: descartar '+e.nome,custo:2,run:()=>descartar(p,e)}); }
  if(p.anulaMarc) L.push({label:'Marcador da Galeria dos Condenados',custo:0,run:()=>{ p.anulaMarc=false; }});
  return L.sort((a,b)=>a.custo-b.custo);
}
async function tentarFuga(p,C,mon){
  const hal=p.raca&&p.raca.nome==='Halfling';
  if(!hal && p.mao.length) await descartarMao(p,1,'Fuga: descarte 1 carta da mão');
  const b=bonusFuga(p,C), dado=d6(), min=monHab(mon?{mons:[{c:mon}]}:C).foge6?6:5;
  const ok=dado+b>=min;
  const alvo=mon?` de ${mon.nome}`:'';
  log(`🎲 ${p.nome} rola ${dado}${b?` (+${b})`:''} para fugir${alvo} (precisa ${min}): ${ok?'ESCAPOU!':'falhou.'}`,p);
  await cena(p,ok?'vit':'perigo','🎲',ok?`Fuga bem-sucedida${alvo}!`:`Fuga falhou${alvo}!`,`${p.nome} rolou ${dado}${b?` (+${b})`:''}, precisava de ${min}.`);
  await esperar(500);
  return ok;
}
// Fuga escolhida ANTES de lutar: vai direto ao teste de fuga (sem passar pela tela de "perdeu o combate").
async function fugirDireto(C){ return resolverFuga(C,true); }
async function derrota(C){ return resolverFuga(C,false); }
// Fuga e castigo são resolvidos UM MONSTRO POR VEZ (com 2+ monstros, ex.: Invocação):
// tenta fugir do 1º; se falhar, aplica o castigo dele; depois tenta fugir do 2º; se falhar, aplica o castigo do 2º.
// Uma fuga automática (Bomba de Fumaça etc.) escapa de todos de uma vez.
async function resolverFuga(C,direto){
  const p=C.p, mons=C.mons.map(m=>m.c), jaFugiuAntes=p.fugiuTurno;
  let escapou=0;
  for(let i=0;i<mons.length;i++){
    const m=mons[i], multi=mons.length>1, ctx=multi?` — monstro ${i+1} de ${mons.length}: ${m.nome}`:'';
    let tentou=false, feito=false;
    for(let g=0;g<10 && !feito;g++){
      const FA=fugasAuto(p,C), AN=anulacoes(p), podeFugir=!jaFugiuAntes && !tentou;
      let esc;
      if(eh(p)){
        if(direto && !tentou && podeFugir && !FA.length) esc='fuga';           // vai direto ao teste
        else {
          const op=[];
          FA.forEach((f,k)=>op.push({label:'Fuga automática'+(multi?' (escapa de todos)':'')+': '+f.label,val:'fa'+k}));
          if(podeFugir) op.push({label:'Tentar fugir'+(multi?' de '+m.nome:'')+' (descarta 1 carta e rola d6: 5 ou 6 foge)',val:'fuga',desc:'Bônus de fuga: +'+bonusFuga(p,C)});
          const mostraCastigo=!direto||tentou||(!FA.length&&!podeFugir);
          if(mostraCastigo){ AN.forEach((a,k)=>op.push({label:'Anular castigo'+(multi?' de '+m.nome:'')+': '+a.label,val:'an'+k})); op.push({label:'Sofrer o castigo'+(multi?' de '+m.nome:''),val:'sofrer'}); }
          esc=await UI.pick(tentou?'A fuga falhou!':(direto?'Fugir do combate':'Você perdeu o combate!'),`Contra ${nomesMon(C)}${ctx}.\n`+(multi?'Cada monstro é resolvido separadamente: primeiro a fuga, depois (se falhar) o castigo dele.\n':'')+'Escolha o que fazer.',op,{C});
        }
      } else esc = FA.length?'fa0' : podeFugir?'fuga' : AN.length?'an0' : 'sofrer';
      if(esc.startsWith('fa')){ await FA[+esc.slice(2)].run(); log(`🏃 ${p.nome} escapa${multi?' de todos':''}!`,p); evento(p,{t:'fuga'}); return {fugiu:true}; }
      if(esc==='fuga'){
        p.fugiuTurno=true; tentou=true;
        if(await tentarFuga(p,C,m)){ log(`🏃 ${p.nome} escapa de ${m.nome}!`,p); evento(p,{t:'fuga'}); escapou++; feito=true; }
        else if(!eh(p)){ const A2=anulacoes(p); if(A2.length){ A2[0].run(); log(`🛡️ ${p.nome} anula o castigo de ${m.nome}!`,p); } else await aplicarCastigo(p,[m],C); feito=true; }
        continue;
      }
      if(esc.startsWith('an')){ AN[+esc.slice(2)].run(); log(`🛡️ ${p.nome} anula o castigo de ${m.nome}!`,p); feito=true; continue; }
      await aplicarCastigo(p,[m],C); feito=true;
    }
    if(!feito) await aplicarCastigo(p,[m],C);
  }
  return {fugiu:escapou===mons.length};
}
