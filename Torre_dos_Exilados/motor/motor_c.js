// ===================== MOTOR (parte C): objetivos, andares, exploração, turnos, IA =====================

// ---------- objetivos ----------
function darObjetivo(p){
  if(p.objs.length>=3) return false;
  const c=topoO(); if(!c) return false;
  p.objs.push({c,st:{}}); log(`${p.nome} recebe um Objetivo${eh(p)?': '+c.nome:''}.`,p); return true;
}
function evento(p,e){
  if(!p.objs) return;
  for(const o of p.objs.slice()){
    const def=OBJETIVOS[o.c.idx];
    let ok=false; try{ ok=def.on(p,e,o.st); }catch(x){ ok=false; }
    if(ok) completarObjetivo(p,o,def);
  }
}
function completarObjetivo(p,o,def){
  p.objs.splice(p.objs.indexOf(o),1);
  log(`🎯 ${p.nome} cumpre o Objetivo "${def.n}"! +${def.pe} PE${def.desce?' e desce 1 andar':''}${def.t?' e 1 Tesouro':''}.`,p);
  popup(p,'fim','🎯','Objetivo cumprido!',`${p.nome}: "${def.n}" (+${def.pe} PE${def.desce?', desce 1 andar':''}${def.t?', +1 Tesouro':''}).`);
  p.pe+=def.pe; if(def.t) comprarT(p,1);
  if(def.desce && p.andar>1){ p.descerPend=(p.descerPend||0)+1; p.descObj=def.n; }
  G.dO.push(o.c);
  darObjetivo(p);
}
async function processaPend(){
  for(const p of G.jogadores){
    while(p.descerPend>0 && !G.fim){ p.descerPend--; if(p.andar>1) await desce(p,'objetivo',p.descObj); }
    p.descerPend=0;
  }
}

// ---------- descer / trilhas ----------
// explica POR QUE o jogador desceu (det = detalhe: nome da carta, do objetivo, do monstro...)
function motivoDescida(p,motivo,det){
  switch(motivo){
    case 'vitória': return `${p.nome} venceu o combate${det?` contra um monstro de Poder ${det}`:''} (Poder 8 ou mais) e por isso desce 1 andar.`;
    case 'ajuda': return `${p.nome} ajudou${det?' '+det:''} a vencer um monstro de Poder 8 ou mais e também desce 1 andar.`;
    case 'objetivo': return `${p.nome} cumpriu o objetivo${det?` "${det}"`:''}, que o faz descer 1 andar.`;
    case 'saída': return `${p.nome} revelou ${det||'uma carta de Saída'}, que o faz descer 1 andar.`;
    case 'chefe do andar': return `${p.nome} derrotou o chefe do andar${det?' ('+det+')':''} e desce 1 andar.`;
    case 'compra': return `${p.nome} vendeu itens (400 de ouro) para comprar uma descida.`;
    case 'corda': return `${p.nome} usou Corda e Gancho para descer 1 andar.`;
  }
  return `${p.nome} desce 1 andar.`;
}
async function desce(p,motivo,det){
  if(p.andar<=1) return false;
  const porque=motivoDescida(p,motivo,det);
  p.andar--;
  log(`⬇️ ${porque}`,p);
  log(`⬇️ ${p.nome} desce para o andar ${p.andar} — ${ANDARES[p.andar].nome}.`,p);
  await cena(p,'desc','⬇️','Descida!',`${porque} Agora está no andar ${p.andar} — ${ANDARES[p.andar].nome}.`);
  evento(p,{t:'desce'});
  UI.render();
  if(p.raca&&p.raca.nome==='Elfo'&&!p.elfoAndar[p.andar]){ p.elfoAndar[p.andar]=true; desvirarMagias(p,1); }
  await trilha(p);
  return true;
}
async function procurar(p,lista,pred,titulo){
  const L=lista.filter(pred);
  if(!L.length){ log('Nada encontrado.',p); return null; }
  let c;
  if(eh(p)) c=(await UI.pickCartas(titulo,L,1,1))[0];
  else c=L.slice().sort((a,b)=>valorCarta(p,b)-valorCarta(p,a))[0];
  lista.splice(lista.indexOf(c),1); p.mao.push(c);
  if(lista===G.T) embaralhar(G.T);
  log(`${p.nome} pega ${c.nome}${eh(p)?'':' (do baralho)'}.`,p); return c;
}
function valorOrdem(c){ return c.tipo==='saida'?9:c.tipo==='bau'?7:c.tipo==='descanso'?4:c.tipo==='evento'?3:c.tipo==='monstro'?-c.poder:c.tipo==='armadilha'?-3:0; }
async function reordenarTopo(p,n){
  const t=[]; for(let i=0;i<n;i++){ const x=topoE(); if(x) t.push(x); }
  if(!t.length) return;
  let ord;
  if(eh(p)){
    ord=[]; const resto=t.slice();
    while(resto.length>1){
      const c=(await UI.pickCartas(`Reordene: escolha a carta Nº ${ord.length+1} (a que sairá primeiro)`,resto.slice(),1,1))[0];
      ord.push(c); resto.splice(resto.indexOf(c),1);
    }
    ord.push(resto[0]);
  } else ord=t.slice().sort((a,b)=>valorOrdem(b)-valorOrdem(a));
  G.E.unshift(...ord); log(`${p.nome} reordena as cartas do topo do Explorar Torre.`,p);
}
async function trocarMao(p,n){
  if(!p.mao.length) return;
  let esc;
  if(eh(p)) esc=await UI.pickCartas(`Troque até ${n} cartas da mão por Tesouros novos`,p.mao.slice(),0,n);
  else esc=p.mao.filter(c=>valorCarta(p,c)<2.5).slice(0,n);
  esc.forEach(c=>descartar(p,c)); if(esc.length) comprarT(p,esc.length);
}
const comprar2d1=async p=>{ comprarT(p,2); await descartarMao(p,1,'Descarte 1 carta'); };
const ehEquip=c=>['arma','escudo','tronco','cabeca','pes','acc','grimorio'].includes(c.tipo);
const TRILHA={
  10:{r:['Compre 1 Tesouro',async p=>{comprarT(p,1);}],m:['Troque até 3 cartas da mão por Tesouros novos',p=>trocarMao(p,3)]},
  9:{r:['Compre 1 Tesouro',async p=>{comprarT(p,1);}],m:['Olhe as 3 do topo do Explorar Torre e reordene-as',p=>reordenarTopo(p,3)]},
  8:{r:['Compre 2 Tesouros e descarte 1',comprar2d1],m:['Anule o próximo castigo que sofrer (marcador)',async p=>{p.anulaMarc=true;}]},
  7:{r:['Receba 1 Objetivo (máx. 3)',async p=>{darObjetivo(p);}],m:['Procure 1 Magia no baralho de Tesouros',p=>procurar(p,G.T,c=>c.tipo==='magia','Escolha 1 Magia')]},
  6:{r:['Compre 1 Tesouro',async p=>{comprarT(p,1);}],m:['Desvire todas as suas magias',async p=>{desvirarMagias(p,'t');}]},
  5:{r:['Compre 2 Tesouros e descarte 1',comprar2d1],m:['Sua próxima fuga é automática (marcador)',async p=>{p.fugaMarc=true;}]},
  4:{r:['Procure 1 Arma ou Armadura no baralho de Tesouros',p=>procurar(p,G.T,c=>c.tipo==='arma'||(c.tipo==='tronco'&&c.sub==='armadura'),'Escolha 1 Arma ou Armadura')],
     m:['Recupere 1 item do descarte de Tesouros',p=>procurar(p,G.dT,ehEquip,'Escolha 1 item do descarte')]},
  3:{r:['Compre 1 Tesouro',async p=>{comprarT(p,1);}],m:['Procure 1 Raça ou Classe no baralho de Tesouros',p=>procurar(p,G.T,c=>c.tipo==='raca'||c.tipo==='classe','Escolha 1 Raça ou Classe')]},
  2:{r:['Compre 2 Tesouros e descarte 1',comprar2d1],m:['Olhe as 3 do topo do Explorar; se houver Saída, ponha-a no topo',async p=>{
      const t=[]; for(let i=0;i<3;i++){ const x=topoE(); if(x) t.push(x); }
      const s=t.find(c=>c.tipo==='saida'); if(s){ t.splice(t.indexOf(s),1); t.unshift(s); log(`${p.nome} vê uma Saída e a coloca no topo.`,p);} G.E.unshift(...t); }]}
};
async function trilha(p){
  const a=p.andar; if(a===1||p.visitados.has(a)) return;
  p.visitados.add(a);
  const T=TRILHA[a];
  let r;
  if(eh(p)) r=await UI.pick(`Trilha — ${ANDARES[a].nome}`,`Primeira vez no andar ${a}. Escolha 1 vantagem (resolve na hora).`,
    [{label:'Força: +1 Poder permanente (máx. +5 no total)',val:'f'},{label:'Recurso: '+T.r[0],val:'r'},{label:'Tema: '+T.m[0],val:'m'}]);
  else r = p.trilhaPoder<5 && rnd(100)<55 ? 'f' : (rnd(2)?'r':'m');
  if(r==='f'){ p.trilhaPoder++; log(`${p.nome} escolhe +1 Poder de Trilha (total ${Math.min(5,p.trilhaPoder)}).`,p); }
  else { log(`${p.nome} escolhe na trilha: ${T[r][0]}.`,p); await T[r][1](p); }
}

// ---------- fim de jogo ----------
function sairDaTorre(p){ G.fim=true; G.vencedor=p; log(`🚪 ${p.nome} SAI DA TORRE!`,p); popup(p,'fim','🚪','SAIU DA TORRE!',`${p.nome} escapou e venceu o jogo!`); }

// ---------- exploração ----------
async function avisar(p,titulo,texto,cartas){ if(eh(p)) await UI.pick(titulo,texto,[{label:'OK',val:1}],cartas?{cartas}:undefined); }
async function janelaIlusao(p,c){
  for(const q of outros(p)){
    // jogador humano: só usa se a carta estiver ARMADA (botão na carta); não há mais pergunta a cada Saída
    const ilu = eh(q) ? q.mao.find(x=>x.ef==='ilusao'&&x.armada) : q.mao.find(x=>x.ef==='ilusao'); if(!ilu) continue;
    let usa;
    if(eh(q)) usa=true;
    else usa = p.andar===1 || (p.andar<q.andar && rnd(100)<60) || (p.andar<=q.andar && rnd(100)<25);
    if(usa){ descartar(q,ilu); log(`🌫️ ${q.nome} joga Ilusão de Saída e anula a descida de ${p.nome}!`,q); await cena(q,'inter','🌫️','Ilusão de Saída!',`${q.nome} joga Ilusão de Saída: a carta ${c.nome} de ${p.nome} é anulada.`,[c]); await avisar(p,'Saída anulada!',`${q.nome} jogou uma Ilusão de Saída: a carta ${c.nome} foi anulada e você NÃO desceu.`,[c]); return true; }
  }
  return false;
}
async function resolverSaida(p,c){
  if(await janelaIlusao(p,c)){ jogarFora(c); return; }
  evento(p,{t:'saida'});
  const am=p.equip.acc&&p.equip.acc.esp.amuleto;
  if(am && G.E.length){ log(`${p.nome} (Amuleto da Torre) olha a próxima carta${eh(p)?': '+G.E[0].nome:''}.`,p); await avisar(p,'Amuleto da Torre','A próxima carta do baralho Explorar Torre é esta:',[G.E[0]]); }
  if(p.andar===1){ jogarFora(c); sairDaTorre(p); return; }
  await desce(p,'saída',c.nome);
  if(c.sub==='fenda'){ const d=d6(); log(`🎲 Fenda: ${p.nome} rola ${d}.`,p); if(d<=3) comprarT(p,1); }
  jogarFora(c);
  if(c.sub==='atalho' && !G.fim){ log('Atalho: revele mais 1 carta.',p); await explorar(p,true); }
}
async function resolverDescanso(p,c){
  // 3 opções: (c) 2 Tesouros e descarta 1 | (d) desvira magias | (e) explora de novo (só Explorar)
  const nVir=p.magias.filter(m=>m.virada).length;
  let r;
  if(eh(p)) r=await UI.pick(`Ponto de Descanso — ${c.nome}`,'Escolha 1 opção:',[
    {label:'Comprar 2 Tesouros e descartar 1',val:'c'},
    {label:'Desvirar todas as suas magias (outros jogadores no mesmo andar ou acima desviram 1)',val:'d'},
    {label:'Explorar novamente (só Explorar: sem Provocar nem Vasculhar)',val:'e'}]);
  else r = nVir>=2 ? 'd' : 'c';
  evento(p,{t:'descanso'}); jogarFora(c);
  if(r==='d'){
    log(`${p.nome} descansa: desvira as magias.`,p);
    desvirarMagias(p,'t');
    outros(p).forEach(q=>{ if(q.andar>=p.andar) desvirarMagias(q,1); });
  } else if(r==='e'){
    log(`${p.nome} descansa e explora novamente.`,p);
    await explorar(p,true);
  } else {
    log(`${p.nome} descansa: compra 2 Tesouros e descarta 1.`,p);
    await comprar2d1(p);
  }
}
async function explorar(p,extra){
  const c=topoE(); if(!c){ log('O baralho Explorar Torre acabou.'); return; }
  if(!extra) evento(p,{t:'explorar'});
  await UI.revelar(c,p);
  log(`🔍 ${p.nome} revela: ${c.nome}.`,p);
  if(c.tipo!=='armadilha' && c.tipo!=='evento'){   // esses já descrevem o efeito no próprio log
    const d=descCarta(c).replace(/\s*\n\s*/g,' ').trim();
    if(d) log(`↳ ${c.nome}: ${d}`,p);
  }
  // monstro e armadilha ganham cena própria (combate / armadilha) logo em seguida
  if(c.tipo!=='monstro' && c.tipo!=='armadilha'){
    const cor={saida:'desc',bau:'vit',descanso:'vit',mod:'inter',invocacao:'inter'}[c.tipo]||'outro';
    await cena(p,cor,'🔍',`${p.nome} revela: ${c.nome}`,descCarta(c).replace(/\s*\n\s*/g,' '),[c]);
  }
  switch(c.tipo){
    case 'monstro':
      if(c.guardiao){
        if(p.andar===1){ await combate(p,[c],{guardiao:true}); }
        else { log(`O Guardião da Torre só pode ser enfrentado no andar 1. Ele volta ao fundo do baralho e ${p.nome} perde a ação.`,p); G.E.push(c); await avisar(p,'Guardião da Torre','O Guardião só pode ser enfrentado no andar 1. Ele volta ao fundo do baralho e você perde a ação deste turno.',[c]); }
      } else await combate(p,[c]);
      break;
    case 'armadilha': await armadilha(p,c,{}); jogarFora(c); break;
    case 'bau': {
      let n=c.n; const ch=temNaMao(p,'Chave Mestra'); if(ch) n++;
      comprarT(p,n); evento(p,{t:'bau'}); jogarFora(c); break; }
    case 'saida': await resolverSaida(p,c); break;
    case 'descanso': await resolverDescanso(p,c); break;
    case 'evento': await resolverEvento(p,c); jogarFora(c); break;
    case 'mod': case 'invocacao': p.mao.push(c); log(`${c.nome} vai para a mão de ${p.nome}.`,p); await avisar(p,c.nome,`Esta carta vai para a sua mão (não é resolvida agora). Ela é de Interferência: ${c.tipo==='mod'?'jogue-a no combate de outro jogador, ou um Modificador negativo no seu.':'quando um jogador no mesmo andar ou abaixo de você revelar/enfrentar um monstro, jogue-a com um Monstro da mão para somar o Poder dos dois no combate dele.'}`,[c]); break;
  }
  UI.render();
}
async function resolverEvento(p,c){
  log(`📜 ${c.nome}: ${c.txt}`,p);
  switch(c.nome){
    case 'Mercador Errante': case 'Mercador Cego':
      p.dobraVenda=true;
      if(eh(p)) await UI.mercado(p); else await npcVender(p,true);
      break;
    case 'Ruínas Mapeadas': case 'Mapa de Sangue': darObjetivo(p); break;
    case 'Eco do Passado': { const c2=await procurar(p,G.dT,x=>x.tipo==='raca'||x.tipo==='classe','Escolha 1 Raça ou Classe do descarte'); if(c2) assumir(p,c2); break; }
    case 'O Andar Muda': G.E=embaralhar(G.E.concat(G.dE.splice(0))); comprarT(p,1); break;
    case 'Presságio': case 'Visão do Fim': p.presagio=true; log(`${p.nome}: o próximo monstro que revelar ou provocar (neste turno ou nos seguintes) terá −2 Poder.`,p); break;
    case 'Porta Entreaberta': await explorar(p,true); if(!G.fim) await explorar(p,true); break;
    case 'Julgamento da Torre': {
      const val=j=>Math.max(0,...equipados(j).map(i=>i.poder||0));
      const v=G.jogadores.map(val), mx=Math.max(...v), mn=Math.min(...v);
      if(mx!==mn) G.jogadores.forEach((j,i)=>{ if(val(j)===mn) comprarT(j,1); if(val(j)===mx) perderPE(j,2); });
      else log('Todos empatados: nada acontece.');
      break; }
    case 'Chefe do Andar': {
      const t3=[]; for(let i=0;i<3;i++){ const x=topoE(); if(x) t3.push(x); }
      const ms=t3.filter(x=>x.tipo==='monstro'&&!x.guardiao);
      if(!ms.length){ G.E.unshift(...t3); log('Nenhum monstro entre as 3 cartas.'); break; }
      const boss=ms.sort((a,b)=>b.poder-a.poder)[0]; t3.splice(t3.indexOf(boss),1); G.E.unshift(...t3);
      log(`O chefe do andar é ${boss.nome}!`,p);
      const r=await combate(p,[boss]); if(r.vit && p.andar>1) await desce(p,'chefe do andar',boss.nome);
      break; }
    case 'Sussurros do Exílio': {
      const o=[{label:'Ganhar 2 PE',val:'pe'}]; if(p.magias.some(m=>m.virada)) o.push({label:'Desvirar 1 magia',val:'m'});
      const r=await escolher(p,'Sussurros do Exílio','Ganhe 2 PE ou desvire 1 magia.',o);
      if(r==='pe') ganharPE(p,2); else desvirarMagias(p,1); break; }
    case 'Lembrança Súbita': { const g=comprarT(p,1)[0]; if(g&&(g.tipo==='raca'||g.tipo==='classe')){ assumir(p,g); ganharPE(p,1); } break; }
  }
}
async function vasculhar(p){
  log(`${p.nome} vasculha a torre (compra 2 cartas).`,p);
  const capuz=p.equip.cabeca&&p.equip.cabeca.esp.capuz;
  if(capuz&&eh(p)&&G.E.length){
    const topo=G.E[0];
    const r=await UI.pick('Capuz do Explorador',`A primeira carta do baralho Explorar Torre é esta. Mantê-la ou mandá-la ao fundo?`,[{label:'Manter',val:true},{label:'Mandar ao fundo',val:false}],{cartas:[topo]});
    if(!r){ G.E.push(G.E.shift()); }
  }
  const antes=p.mao.length; comprarE(p,2); const novas=p.mao.slice(antes);
  await cena(p,'outro','🎒',`${p.nome} vasculhou a Torre`,`Comprou ${novas.length} carta(s) (ocultas) e agora tem ${p.mao.length} na mão.`);
  if(eh(p) && novas.length){
    const inuteis=novas.filter(c=>['saida','bau','descanso','evento'].includes(c.tipo)||(c.tipo==='armadilha'&&!c.I));
    await UI.pick('Você vasculhou',`Cartas compradas: ${novas.map(c=>c.nome).join(', ')}.`+(inuteis.length?`

Atenção: ${inuteis.map(c=>c.nome).join(', ')} só valem quando REVELADAS pelo Explorar. Vindas do Vasculhar, servem só de combustível (descarte para fuga, Provocar e habilidades).`:''),[{label:'OK',val:1}],{cartas:novas});
  }
}
async function provocar(p){
  const ms=p.mao.filter(c=>c.tipo==='monstro'&&!c.guardiao);
  if(!ms.length||p.mao.length<2){ log('Sem monstro (e carta extra) para provocar.',p); return false; }
  let m;
  if(eh(p)) m=await UI.pick('Provocar','Escolha o monstro da mão para enfrentar (custa 1 descarte extra).',ms.map(x=>({label:`${x.nome} (Poder ${x.poder} + andar ${ANDARES[p.andar].b})`,val:x,carta:x})));
  else m=npcMonstroProvocar(p,ms);
  tirar(p,m);
  await descartarMao(p,1,'Provocar: descarte 1 carta extra');
  log(`😈 ${p.nome} provoca ${m.nome}!`,p);
  await combate(p,[m],{origem:'provocar'});
  return true;
}
async function executarAcao(p,a){
  if(a==='vasculhar') return vasculhar(p);
  if(a==='provocar') return provocar(p);
  return explorar(p,false);
}

// ---------- vender / comprar descida ----------
// REGRA: a troca depende só do VALOR em ouro das cartas vendidas (qualquer quantidade de cartas, até 1 só):
//   1 Tesouro = 200 de ouro (sem troco)  |  descer 1 andar comprando = 400 de ouro
// A carta Mercador (Errante/Cego) dobra o ouro das vendas até o fim do turno.
const DESC_OURO=400, TES_OURO=200;
function descOk(ouro,n){ return n>=1 && ouro>=DESC_OURO; }
function tesourosVenda(ouro,nCartas){ return nCartas>=1 ? Math.floor(ouro/TES_OURO) : 0; }
async function vender(p,cards,modo){
  if(cards.some(c=>!p.mao.includes(c))) return 'Só é possível vender cartas que estão na mão. Tire itens equipados/da Mochila antes.';
  let ouro=cards.reduce((s,c)=>s+ouroCarta(c),0); if(p.dobraVenda) ouro*=2;
  if(modo==='desc'){
    if(p.andar<=1) return 'A descida comprada não funciona no andar 1.';
    if(p.comprouDescida) return 'Só é possível comprar 1 descida por turno.';
    if(!descOk(ouro,cards.length)) return `Para comprar uma descida venda cartas somando ${DESC_OURO} de ouro ou mais (selecionado: ${cards.length} carta(s), ${ouro} de ouro).`;
    cards.forEach(c=>descartar(p,c)); p.comprouDescida=true;
    log(`💰 ${p.nome} descarta ${ouro} de ouro em itens para comprar uma descida.`,p);
    evento(p,{t:'venda',ouro});
    await desce(p,'compra'); return null;
  }
  const n=tesourosVenda(ouro,cards.length);
  if(n<1) return `Para comprar 1 Tesouro é preciso vender cartas somando 200 de ouro ou mais (selecionado: ${cards.length} carta(s), ${ouro} de ouro).`;
  cards.forEach(c=>descartar(p,c));
  log(`💰 ${p.nome} vende itens (${ouro} de ouro) e compra ${n} Tesouro${n>1?'s':''}.`,p);
  comprarT(p,n); evento(p,{t:'venda',ouro}); p.compraOuroTurno+=n; evento(p,{t:'compraOuro',n:p.compraOuroTurno});
  return null;
}

// ---------- uso fora de combate e habilidades ----------
async function usarFora(p,c){
  if(c.tipo==='consumivel'||c.tipo==='especial'){
    switch(c.ef){
      case 'resta': descartar(p,c); desvirarMagias(p,'t'); return null;
      case 'corda': if(p.andar<=1) return 'Não funciona no andar 1.'; descartar(p,c); log(`${p.nome} usa Corda e Gancho.`,p); await desce(p,'corda'); return null;
      case 'elixir': { descartar(p,c); const t=[]; for(let i=0;i<5;i++){ const x=topoT(); if(x) t.push(x); }
        const L=t.filter(x=>x.tipo==='raca'||x.tipo==='classe'); let pick=null;
        if(L.length){ pick = eh(p) ? (await UI.pickCartas('Elixir das Lembranças: pegue 1 Raça ou Classe',L,1,1))[0] : L.sort((a,b)=>valorCarta(p,b)-valorCarta(p,a))[0]; t.splice(t.indexOf(pick),1); p.mao.push(pick); }
        G.T.push(...t); embaralhar(G.T); log(`${p.nome} usa o Elixir das Lembranças.`,p); return null; }
      case 'mapa': descartar(p,c); darObjetivo(p); return null;
    }
    return 'Esta carta só é usada em situações específicas (combate/interferência).';
  }
  if(c.tipo==='magia' && c.nome==='Clarividência' && !c.virada){ c.virada=true; await reordenarTopo(p,3); evento(p,{t:'magia',nome:c.nome}); return null; }
  return 'Sem efeito fora de combate.';
}
function habilidades(p){
  const H=[], cl=p.classe&&p.classe.nome;
  if(cl==='Mago'&&p.magias.some(m=>m.virada)&&p.mao.length>=2) H.push({label:'Estudo (Mago): descartar 2 cartas e desvirar 1 magia',run:async()=>{ await descartarMao(p,2); desvirarMagias(p,1); }});
  if(cl==='Druida'&&!p.cicloTurno&&p.magias.some(m=>m.virada)&&p.mao.length>=1) H.push({label:'Ciclo (Druida): descartar 1 carta e desvirar 1 magia',run:async()=>{ p.cicloTurno=true; await descartarMao(p,1); desvirarMagias(p,1); }});
  if(cl==='Assassino'&&p.habRodada!==G.rodada&&p.mao.length>=2) H.push({label:'Olhar o Tesouro (Assassino): descartar 2 e olhar o topo dos Tesouros',run:async()=>{
    p.habRodada=G.rodada; await descartarMao(p,2); const t=topoT(); if(!t) return;
    const ops=[{label:'Deixar no topo',val:true},{label:'Mandar ao fundo',val:false}];
    const r=eh(p)?await UI.pick('Olhar o Tesouro','O topo do baralho de Tesouros é esta carta. Deixar ou mandar ao fundo?',ops,{cartas:[t]}):true;
    if(r) G.T.unshift(t); else G.T.push(t); }});
  if(cl==='Caçador'&&p.habRodada!==G.rodada&&p.mao.length>=2) H.push({label:'Rastrear (Caçador): descartar 2, olhar 3 do Explorar e mandar 1 ao fundo',run:async()=>{
    p.habRodada=G.rodada; await descartarMao(p,2); const t=[]; for(let i=0;i<3;i++){ const x=topoE(); if(x) t.push(x); }
    if(!t.length) return;
    const x=eh(p)?(await UI.pickCartas('Rastrear: escolha 1 carta para mandar ao fundo',t.slice(),1,1))[0]:t.slice().sort((a,b)=>valorOrdem(a)-valorOrdem(b))[0];
    t.splice(t.indexOf(x),1); G.E.unshift(...t); G.E.push(x); }});
  return H;
}
function menuCarta(p,c){
  const M=[]; const e=p.equip;
  const equipada = equipados(p).includes(c) || p.magias.includes(c);
  const naMochila = p.mochila.includes(c);
  const naMao = p.mao.includes(c);
  if(equipada){ M.push({label:'Tirar (devolver à mão)',run:async()=>desequipar(p,c)}); }
  if(naMochila){ M.push({label:'Tirar da Mochila',run:async()=>{ tirar(p,c); p.mao.push(c); return null; }}); }
  if(naMao){
    if(['arma','escudo','tronco','cabeca','pes','acc','grimorio','magia'].includes(c.tipo)) M.push({label:'Equipar',run:async()=>equipar(p,c)});
    if(c.tipo==='raca'||c.tipo==='classe') M.push({label:'Assumir '+(c.tipo==='raca'?'Raça':'Classe'),run:async()=>{ assumir(p,c); return null; }});
    if(c.tipo==='consumivel'||c.tipo==='especial'){ if(['resta','corda','elixir','mapa'].includes(c.ef)) M.push({label:'Usar agora',run:async()=>usarFora(p,c)}); }
    if(p.mochila.length<mochilaCap(p)) M.push({label:'Guardar na Mochila',run:async()=>{ tirar(p,c); p.mochila.push(c); return null; }});
  }
  if(c.tipo==='magia'&&equipada&&c.nome==='Clarividência'&&!c.virada) M.push({label:'Usar Clarividência',run:async()=>usarFora(p,c)});
  return M;
}

// ================= TURNO =================
async function janelaInicio(p){
  // 1) item de Sono
  for(const q of outros(p)){
    // jogador humano: só usa se o item de Sono estiver ARMADO (botão na carta); não há mais pergunta a cada turno
    const it = eh(q) ? q.mao.find(c=>c.ef==='sono'&&c.armada) : q.mao.find(c=>c.ef==='sono'); if(!it) continue;
    let usa=false;
    if(p.imune) continue;
    if(eh(q)) usa=true;
    else usa = p.chave || (p.andar<=2 && p.andar<q.andar && rnd(100)<60) || (p.andar<q.andar-2 && rnd(100)<20);
    if(usa){
      descartar(q,it); log(`💤 ${q.nome} usa ${it.nome} em ${p.nome}!`,q);
      await cena(q,'inter','💤','Interferência!',`${q.nome} usa ${it.nome} em ${p.nome}: ${p.nome} perde o turno.`,[it]);
      if(await tentaCancelar(p,`${q.nome} usou ${it.nome} em você.`)) continue;
      log(`${p.nome} adormece e perde o turno!`,p); return true;
    }
  }
  return false;
}
async function turnoJogador(p){
  G.turnoN++;
  p.fiosAtivo=p.fios; p.fios=false; p.fugiuTurno=false; p.descVenceu=false; p.dobraVenda=false;
  p.comprouDescida=false; p.compraOuroTurno=0; p.cicloTurno=false;
  UI.turno(p,'Início do turno'); UI.render();
  log(`━━━ Rodada ${G.rodada} · Turno de ${p.nome} ━━━`);
  await esperar(400);
  await cena(p,'outro','🎭',`Turno de ${p.nome}`,`Rodada ${G.rodada} · Andar ${p.andar} (${ANDARES[p.andar].nome}) · ${p.pe} PE · ${p.mao.length} carta(s) na mão`);
  if(p.petrificado){ p.petrificado=false; log(`🗿 ${p.nome} está petrificado e perde o turno.`,p); await cena(p,'perigo','🗿',`${p.nome} perde o turno`,'Está petrificado e não pode agir.'); return; }
  if(p.perdeProximo){ p.perdeProximo=false; p.imune=true; log(`💤 ${p.nome} perde o turno.`,p); await cena(p,'perigo','💤',`${p.nome} perde o turno`,'Estava dormindo e não pode agir.'); return; }
  if(p.chave && p.andar===1 && G.jogadores.some(q=>q!==p&&q.mao.some(c=>c.ef==='sono'))) { log(`🗝️ ${p.nome} anuncia o uso da Chave da Torre!`,p); await cena(p,'fim','🗝️',`${p.nome} vai usar a Chave da Torre!`,'Última chance: pause e arme uma Poção do Sono / Canção de Ninar para impedi-lo.'); }
  if(await janelaInicio(p)){ p.imune=true; return; }
  if(G.fim) return;
  if(p.chave && p.andar===1){ log(`🗝️ ${p.nome} usa a Chave da Torre!`,p); sairDaTorre(p); return; }
  if(p.objs.length===0) darObjetivo(p);
  UI.turno(p,'Preparação'); UI.render();
  let acao;
  status(p,'🤔',eh(p)?'está escolhendo a ação...':'está pensando...','outro'); $('#status').classList.add('pensa');
  if(eh(p)){ acao=await UI.faseHumana(p); }
  else { await npcPreparar(p); acao=npcAcao(p); await esperar(300); }
  if(G.fim) return;
  evento(p,{t:'chk'}); await processaPend();
  UI.turno(p,'Ação: '+({explorar:'Explorar',vasculhar:'Vasculhar',provocar:'Provocar'}[acao])); UI.render();
  await cena(p,'outro',{explorar:'🔍',vasculhar:'🎒',provocar:'😈'}[acao],`${p.nome} escolheu ${{explorar:'Explorar',vasculhar:'Vasculhar',provocar:'Provocar'}[acao]}`,
    {explorar:'Vai revelar a próxima carta do baralho Explorar Torre.',vasculhar:'Vai comprar 2 cartas do baralho Explorar Torre.',provocar:'Vai enfrentar um monstro da própria mão.'}[acao]);
  await executarAcao(p,acao);
  if(G.fim) return;
  evento(p,{t:'chk'}); await processaPend();
  UI.turno(p,'Fim do turno'); UI.render();
  await fimDoTurno(p);
  p.imune=false;
}
async function fimDoTurno(p){
  const lim=limiteMao(p);
  if(p.mao.length>lim){
    const n=p.mao.length-lim;
    if(eh(p)) { const esc=await UI.pickCartas(`Limite de mão (${lim}): descarte ${n} carta${n>1?'s':''}`,p.mao.slice(),n,n); esc.forEach(c=>descartar(p,c)); }
    else { p.mao.slice().sort((a,b)=>valorCarta(p,a)-valorCarta(p,b)).slice(0,n).forEach(c=>descartar(p,c)); }
    log(`${p.nome} descarta ${n} carta${n>1?'s':''} pelo limite de mão.`,p);
  }
  if(p.mao.length===0){ log(`${p.nome} terminou sem cartas na mão.`,p); comprarT(p,1); }
  evento(p,{t:'chk'}); await processaPend();
}
async function jogarPartida(){
  while(!G.fim){
    const p=G.jogadores[G.vez];
    await turnoJogador(p);
    if(G.fim) break;
    reciclarDescartes();
    G.vez=(G.vez+1)%G.jogadores.length;
    if(G.vez===0) G.rodada++;
    if(G.rodada>400){ G.fim=true; G.vencedor=null; log('A torre venceu: ninguém saiu.'); }
  }
  UI.fim(G.vencedor);
}

// ================= IA DOS NPCs =================
function valorCarta(p,c){
  switch(c.tipo){
    case 'consumivel': return {sono:6,forca3:5,forca5:6,fuga:5,desarme:4,resta:3,corda:5,elixir:4}[c.ef]||3;
    case 'especial': return c.ef==='ilusao'||c.ef==='sono'?6:3;
    case 'raca': return p.raca?0.5:7;
    case 'classe': return p.classe?0.5:9;
    case 'magia': return tenhoProf(p,c)?5:1.5;
    case 'mod': return c.mp>0?4:3;
    case 'invocacao': return 3;
    case 'monstro': return 4;
    case 'armadilha': return c.I?2:0.5;
    case 'saida': case 'bau': case 'descanso': case 'evento': return 0.3;
    case 'objetivo': return 5;
    default: {
      if(!ehEquip(c)) return 1;
      if(!tenhoProf(p,c)) return 0.8;
      return 1+(c.poder||0)*0.8;
    }
  }
}
function npcMonstroProvocar(p,ms){
  const pp=poderBase(p,null).total+0;
  const ok=ms.filter(m=>m.poder+ANDARES[p.andar].b<=pp-2).sort((a,b)=>b.pe-a.pe);
  return ok[0]||null;
}
function npcAcao(p){
  const ms=p.mao.filter(c=>c.tipo==='monstro'&&!c.guardiao);
  if(p.mao.length>=3 && ms.length && npcMonstroProvocar(p,ms) && rnd(100)<45) return 'provocar';
  if(p.mao.length<=1 && rnd(100)<45) return 'vasculhar';
  return rnd(100)<12 ? 'vasculhar' : 'explorar';
}
function melhorMaos(p){
  const cand=p.equip.maos.concat(p.mao.filter(c=>['arma','escudo','grimorio'].includes(c.tipo)&&tenhoProf(p,c)));
  let melhor=null, mv=-1;
  const tenhoMag = cor => p.mao.concat(p.magias).some(m=>m.tipo==='magia'&&m.cor===cor);
  const n=cand.length;
  const combos=[[]]; for(let i=0;i<n;i++){ combos.push([cand[i]]); for(let j=i+1;j<n;j++) combos.push([cand[i],cand[j]]); }
  const salvo=p.equip.maos;
  combos.forEach(cb=>{
    if(cb.reduce((s,c)=>s+(c.maos||1),0)>2) return;
    p.equip.maos=cb;
    let v=poderBase(p,null).total;
    cb.forEach(c=>{ if(c.tipo==='grimorio'&&!corProf({classe:p.classe,raca:p.raca,equip:{maos:[]}}).includes(c.cor)&&tenhoMag(c.cor)) v+=2.5; });
    if(v>mv){ mv=v; melhor=cb; }
  });
  p.equip.maos=salvo;
  return melhor||salvo;
}
function npcEquipar(p){
  for(const k of ['cabeca','tronco','pes','acc']){
    const cand=p.mao.filter(c=>c.tipo===k&&tenhoProf(p,c));
    const sc=c=>(c.poder||0)+(c.esp&&c.esp.fuga?0.5:0)+(c.esp&&c.esp.lim?1:0)+(c.esp&&c.esp.mochila?0.3:0);
    cand.sort((a,b)=>sc(b)-sc(a));
    if(cand.length && (!p.equip[k] || sc(cand[0])>sc(p.equip[k]))) equipar(p,cand[0]);
  }
  const alvo=melhorMaos(p);
  const atuais=p.equip.maos.slice();
  if(alvo.length!==atuais.length || alvo.some(c=>!atuais.includes(c))){
    atuais.forEach(c=>{ p.equip.maos.splice(p.equip.maos.indexOf(c),1); p.mao.push(c); });
    alvo.forEach(c=>{ if(p.mao.includes(c)){ tirar(p,c); } p.equip.maos.push(c); });
  }
  // magias
  const sm=m=>m.fam?4+m.pod:({'Bola de Fogo':6,'Mísseis Arcanos':5,'Luz Sagrada':5,'Pele de Casca':5,'Chamado da Fera':4,'Lança de Fogo':4,'Escudo da Fé':4,'Invisibilidade':3,'Bênção':3,'Chama Sagrada':3,'Contramágica':3,'Purificar':3,'Fúria Infernal':3,'Seta Arcana':3,'Folhagem Protetora':3}[m.nome]||2);
  let mg=p.mao.filter(c=>c.tipo==='magia'&&tenhoProf(p,c)).sort((a,b)=>sm(b)-sm(a));
  for(const m of mg){ if(p.magias.length>=limiteMagias(p)) break; equipar(p,m); }
}
function npcIdentidade(p){
  const cs=p.mao.filter(c=>c.tipo==='classe');
  if(!p.classe && cs.length){
    const sc=c=>{ const pr=CLASSES[c.nome].prof; return p.mao.filter(i=>ehEquip(i)&&pr.includes(i.sub)).length*2+(CLASSES[c.nome].cor?p.mao.filter(i=>i.tipo==='magia'&&i.cor===CLASSES[c.nome].cor).length*2:0)+({Guerreiro:2,Guardião:1.5,Mago:1.2,Clérigo:1.2}[c.nome]||1); };
    cs.sort((a,b)=>sc(b)-sc(a)); assumir(p,cs[0]);
  }
  const rs=p.mao.filter(c=>c.tipo==='raca');
  if(!p.raca && rs.length){ const pref={'Anão':5,'Orc':5,'Humano':4,'Elfo':3,'Halfling':3,'Tiefling':3}; rs.sort((a,b)=>pref[b.nome]-pref[a.nome]); assumir(p,rs[0]); }
}
function lixo(p){
  return p.mao.filter(c=>c.deck==='T'&&c.ouro&&(ehEquip(c)||(c.tipo==='magia'&&!tenhoProf(p,c))||((c.tipo==='raca'&&p.raca)||(c.tipo==='classe'&&p.classe))));
}
async function npcVender(p,dobro){
  let L=lixo(p).sort((a,b)=>b.ouro-a.ouro); if(!L.length) return;
  const mult=dobro?2:1; let soma=0; const sel=[];
  for(const c of L){ sel.push(c); soma+=c.ouro*mult; }
  if(p.andar>1 && !p.comprouDescida){
    // menor conjunto que chega a 400 de ouro
    let acc=0; const s2=[]; for(const c of L.slice().sort((a,b)=>b.ouro-a.ouro)){ s2.push(c); acc+=c.ouro*mult; if(descOk(acc,s2.length)) break; }
    if(descOk(acc,s2.length)){ await vender(p,s2,'desc'); return; }
  }
  if(tesourosVenda(soma,L.length)>=1 && (dobro||p.mao.length>=4)){
    const n=tesourosVenda(soma,L.length); const s3=[]; let acc=0;
    for(const c of L){ s3.push(c); acc+=c.ouro*mult; if(tesourosVenda(acc,s3.length)>=n) break; }
    await vender(p,s3,'tes');
  }
}
async function npcPreparar(p){
  revalidar(p);
  npcIdentidade(p);
  npcEquipar(p);
  // desvira se sobrar descarte inútil (habilidades de classe)
  if(p.classe&&p.classe.nome==='Mago'&&p.magias.filter(m=>m.virada).length&&p.mao.length>=4){ await descartarMao(p,2); desvirarMagias(p,1); }
  if(p.classe&&p.classe.nome==='Druida'&&p.magias.some(m=>m.virada)&&p.mao.length>=4){ p.cicloTurno=true; await descartarMao(p,1); desvirarMagias(p,1); }
  await npcVender(p,false);
  npcEquipar(p);
  if(p.mao.length>0 && !p.objs.length) darObjetivo(p);
}

// ================= PREPARAÇÃO DA PARTIDA =================
function novoJogador(id,nome,humano,avatar,cor){
  return {id,nome,humano,avatar,cor,andar:10,pe:0,trilhaPoder:0,visitados:new Set(),mao:[],mochila:[],
    equip:{cabeca:null,tronco:null,pes:null,acc:null,maos:[]},magias:[],raca:null,classe:null,objs:[],
    humanoAndar:{},elfoAndar:{},anulaMarc:false,fugaMarc:false,chave:false,perdeProximo:false,imune:false,petrificado:false,
    fios:false,fiosAtivo:false,marca:0,presagio:false,descerPend:0,compraOuroTurno:0};
}
async function novaPartida(nomeHumano,auto){
  const J=[novoJogador(0,nomeHumano||'Você',true,'🧙','#d4a24c'), novoJogador(1,'Charles',false,'🛡️','#c0504d'), novoJogador(2,'Genine',false,'🏹','#5aa469')];
  G={jogadores:J,E:embaralhar(baralhoExplorar(J.length)),dE:[],T:embaralhar(baralhoTesouro()),dT:[],O:embaralhar(baralhoObjetivos()),dO:[],
     rodada:1,vez:0,turnoN:0,fim:false,vencedor:null,auto:!!auto,invocRodada:0,ultimoAlvoInvoc:null};
  UI.reset && UI.reset();
  log('A Torre se fecha ao redor dos exilados... A única saída é para baixo.');
  for(const p of J){
    for(let i=0;i<7;i++) p.mao.push(topoT());
    darObjetivo(p);
  }
  for(const p of J){
    let troca;
    if(eh(p)) troca=await UI.pick('Mulligan',`Estas são as suas 7 cartas iniciais (leia o que cada uma faz).\nQuer descartar tudo e comprar 7 Tesouros novos (uma vez)?`,[{label:'Manter a mão',val:false},{label:'Trocar a mão',val:true}],{cartas:p.mao.slice()});
    else troca = p.mao.filter(c=>valorCarta(p,c)>=3).length<=1;
    if(troca){ const n=p.mao.length; p.mao.splice(0).forEach(jogarFora); for(let i=0;i<n;i++) p.mao.push(topoT()); log(`${p.nome} troca a mão inicial.`,p); }
    comprarE(p,2);
  }
  for(const p of J){ p.visitados.add(10); }
  for(const p of J){
    const T=TRILHA[10];
    let r;
    if(eh(p)) r=await UI.pick('Trilha — Cela do Exílio','Escolha 1 vantagem do andar 10.',[{label:'Força: +1 Poder permanente',val:'f'},{label:'Recurso: '+T.r[0],val:'r'},{label:'Tema: '+T.m[0],val:'m'}]);
    else r=rnd(100)<50?'f':(rnd(2)?'r':'m');
    if(r==='f'){ p.trilhaPoder++; log(`${p.nome} escolhe +1 Poder de Trilha.`,p); } else { log(`${p.nome} escolhe na trilha: ${T[r][0]}.`,p); await T[r][1](p); }
  }
  UI.render();
}
