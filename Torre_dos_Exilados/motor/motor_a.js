// ===================== MOTOR (parte A): base, equipamento, poder =====================
let G = null;
const rnd = n => Math.floor(Math.random()*n);
const d6 = () => 1 + rnd(6);
function embaralhar(a){ for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const eh = p => p.humano && !G.auto;            // jogador controlado por pessoa?
const esperar = ms => UI.esperar(ms);
function log(msg, p){ if(G && G.capt) G.capt.push(msg); UI.log(msg, p ? p.id : null); }
// popup não-bloqueante para eventos importantes: tipo = vit|der|desc|fim|int (classe visual)
function popup(p, tipo, icone, titulo, texto){ if(UI.toast) UI.toast(p, tipo, icone, titulo, texto); }
// cena: tela de apresentação (~3s + Continuar) mostrada para TODOS os jogadores, inclusive o humano,
// para que no futuro modo online todos vejam o mesmo fluxo. Também atualiza a faixa de status do topo.
async function cena(p, tipo, icone, titulo, texto, cartas){
  await UI.cena({p, tipo, icone, titulo, texto, cartas});
}
// faixa de status persistente no topo ("Fulano pensando...", "Fulano escolheu Explorar"...)
function status(p, icone, texto, tipo){ UI.status(p, icone, texto, tipo||'outro'); }
function idx(p){ return G.jogadores.indexOf(p); }
function esquerda(p){ return G.jogadores[(idx(p)+1)%G.jogadores.length]; }
function direita(p){ return G.jogadores[(idx(p)+G.jogadores.length-1)%G.jogadores.length]; }
function outros(p){ const r=[]; for(let i=1;i<G.jogadores.length;i++) r.push(G.jogadores[(idx(p)+i)%G.jogadores.length]); return r; }

// ---------- baralhos ----------
// Loop do jogo: quando o Explorar Torre ou os Tesouros ficam com MENOS DE 10 cartas, o descarte correspondente
// é embaralhado de volta no baralho (cada descarte volta só para a sua própria pilha).
const MIN_PILHA = 10;
function reciclarDescartes(){
  const feito=[];
  if(G.E.length<MIN_PILHA && G.dE.length){ G.E=embaralhar(G.E.concat(G.dE.splice(0))); feito.push('Explorar Torre'); }
  if(G.T.length<MIN_PILHA && G.dT.length){ G.T=embaralhar(G.T.concat(G.dT.splice(0))); feito.push('Tesouros'); }
  if(feito.length) log(`🔄 Menos de ${MIN_PILHA} cartas: o descarte foi embaralhado de volta em ${feito.join(' e ')}.`);
}
function topoE(){ reciclarDescartes(); if(!G.E.length) G.E = embaralhar(G.dE.splice(0)); return G.E.shift(); }
function topoT(){ reciclarDescartes(); if(!G.T.length) G.T = embaralhar(G.dT.splice(0)); return G.T.shift(); }
function topoO(){ if(!G.O.length) G.O = embaralhar(G.dO.splice(0)); return G.O.shift(); }
function comprarT(p,n=1){
  const got=[]; for(let i=0;i<n;i++){ const c=topoT(); if(!c)break; p.mao.push(c); got.push(c); }
  if(got.length) log(`${p.nome} compra ${got.length} Tesouro${got.length>1?'s':''}.`, p);
  return got;
}
function comprarE(p,n){
  for(let i=0;i<n;i++){
    let c=topoE(), t=0;
    while(c && c.guardiao && t<6){ G.E.push(c); c=topoE(); t++; }
    if(c) p.mao.push(c);
  }
}
function jogarFora(c){ c.virada=false; (c.deck==='T'?G.dT : c.deck==='E'?G.dE : G.dO).push(c); }

// ---------- localizar / remover cartas ----------
function tirar(p,c){
  let i=p.mao.indexOf(c); if(i>=0){ p.mao.splice(i,1); return true; }
  i=p.mochila.indexOf(c); if(i>=0){ p.mochila.splice(i,1); return true; }
  const e=p.equip;
  for(const k of ['cabeca','tronco','pes','acc']) if(e[k]===c){ e[k]=null; return true; }
  i=e.maos.indexOf(c); if(i>=0){ e.maos.splice(i,1); revalidar(p); return true; }
  i=p.magias.indexOf(c); if(i>=0){ p.magias.splice(i,1); return true; }
  if(p.raca===c){ p.raca=null; revalidar(p); return true; }
  if(p.classe===c){ p.classe=null; revalidar(p); return true; }
  return false;
}
function descartar(p,c){ if(tirar(p,c)){ jogarFora(c); return true; } return false; }
function equipados(p){ const e=p.equip; return [e.cabeca,e.tronco,e.pes,e.acc,...e.maos].filter(Boolean); }
function mochilaCap(p){ return p.equip.acc && p.equip.acc.esp.mochila ? 3 : 1; }
function temNaMao(p,nome){ return p.mao.find(c=>c.nome===nome); }

// ---------- proficiência e limites ----------
function corProf(p){
  const r=[];
  if(p.classe){ const c=CLASSES[p.classe.nome].cor; if(c) r.push(c); }
  if(p.raca && p.raca.nome==='Tiefling') r.push('Vermelha');
  p.equip.maos.forEach(i=>{ if(i.tipo==='grimorio') r.push(i.cor); });
  return r;
}
function tenhoProf(p,c){
  if(['cabeca','pes','acc','consumivel','especial','grimorio'].includes(c.tipo)) return true;
  if(c.tipo==='magia') return corProf(p).includes(c.cor);
  if(!p.classe) return false;
  return CLASSES[p.classe.nome].prof.includes(c.sub);
}
function limiteMagias(p){
  let l=2; if(p.classe) l=Math.max(l,CLASSES[p.classe.nome].lim);
  if(p.raca && p.raca.nome==='Elfo') l++;
  const t=p.equip.tronco; if(t && t.esp.lim && tenhoProf(p,t)) l++;
  const a=p.equip.acc; if(a && a.esp.lim) l++;
  return l;
}
function limiteMao(p){ return p.raca && p.raca.nome==='Halfling' ? 7 : 5; }
// devolve à mão o que perdeu proficiência / excede limite
function revalidar(p){
  const e=p.equip;
  ['cabeca','tronco','pes','acc'].forEach(k=>{ if(e[k] && !tenhoProf(p,e[k])){ p.mao.push(e[k]); e[k]=null; } });
  e.maos = e.maos.filter(i=>{ if(!tenhoProf(p,i)){ p.mao.push(i); return false; } return true; });
  p.magias = p.magias.filter(m=>{ if(!tenhoProf(p,m)){ p.mao.push(m); return false; } return true; });
  while(p.magias.length>limiteMagias(p)) p.mao.push(p.magias.pop());
  while(p.mochila.length>mochilaCap(p)) p.mao.push(p.mochila.pop());
}
function maosUsadas(p){ return p.equip.maos.reduce((s,i)=>s+(i.maos||1),0); }
function ouroEquipado(p){ return equipados(p).concat(p.magias).reduce((s,c)=>s+(c.ouro||0),0); }
function ouroCarta(c){ return c.ouro||0; }

// ---------- equipar ----------
function equipar(p,c){
  if(p.fiosAtivo) return 'Fios de Captura: você não pode equipar nem trocar itens neste turno.';
  if(!tenhoProf(p,c)) return 'Sem proficiência para usar '+c.nome+'.';
  const e=p.equip;
  if(c.tipo==='magia'){
    if(p.magias.length>=limiteMagias(p)) return `Limite de magias (${limiteMagias(p)}) atingido.`;
    tirar(p,c); p.magias.push(c); return null;
  }
  if(['cabeca','pes','acc','tronco'].includes(c.tipo)){
    tirar(p,c); const k=c.tipo; if(e[k]) p.mao.push(e[k]); e[k]=c; revalidar(p); return null;
  }
  if(['arma','escudo','grimorio'].includes(c.tipo)){
    const need=c.maos||1; tirar(p,c);
    while(maosUsadas(p)+need>2 && e.maos.length) p.mao.push(e.maos.shift());
    e.maos.push(c); return null;
  }
  return 'Esta carta não é equipável.';
}
function desequipar(p,c){
  if(p.fiosAtivo) return 'Fios de Captura: você não pode trocar itens neste turno.';
  tirar(p,c); p.mao.push(c); return null;
}
function assumir(p,c){
  const k = c.tipo==='raca' ? 'raca' : 'classe';
  const antiga = p[k];
  tirar(p,c);
  if(antiga){ jogarFora(antiga); }
  p[k]=c; revalidar(p);
  log(`${p.nome} assume ${c.tipo==='raca'?'a raça':'a classe'} ${c.nome}.`, p);
  if(antiga) evento(p,{t:'trocaId'});
}

// ---------- cálculo de poder ----------
function monHab(C){
  const h={}; if(!C) return h;
  C.mons.forEach(m=>{ for(const k in m.c.hab){ const v=m.c.hab[k]; if(typeof v==='number') h[k]=Math.max(h[k]||0,v); } });
  return h;
}
function monTipos(C){ const s=new Set(); if(C) C.mons.forEach(m=>m.c.tipos.forEach(t=>s.add(t))); return s; }

// devolve {total, partes:[[rotulo,valor]]}
function poderBase(p,C){
  const P=[]; const add=(l,v)=>{ if(v) P.push([l,v]); };
  add('Base',1); add('PE',Math.floor(p.pe/10)); add('Trilha',Math.min(5,p.trilhaPoder));
  const h=monHab(C), tipos=monTipos(C), cls=p.classe&&p.classe.nome, rc=p.raca&&p.raca.nome;
  const sozinho = C && p===C.p && !C.helper;
  let nArmas=0, escudo=false;
  const slots=[p.equip.cabeca,p.equip.tronco,p.equip.pes,...p.equip.maos];
  slots.forEach(it=>{
    if(!it || !tenhoProf(p,it)) return;
    if(it.tipo==='arma'){
      if(h.noCurta && it.sub==='curta') return;
      if(h.noLonga && it.sub==='longa') return;
      if(h.noMagica && it.sub==='magica') return;
      nArmas++;
      if(it.sub==='longa' && h.longa) add(it.nome+' (vs monstro)',h.longa);
    }
    if(it.tipo==='escudo') escudo=true;
    let v=it.poder||0; const e=it.esp||{};
    if(e.classe && cls && e.classe[cls]) v+=e.classe[cls];
    if(e.raca && rc && e.raca[rc]) v+=e.raca[rc];
    if(e.vs) tipos.forEach(t=>{ if(e.vs[t]) v+=e.vs[t]; });
    add(it.nome,v);
  });
  p.magias.forEach(m=>{ if(m.fam && !m.virada) add(m.nome,m.pod); });
  if(cls==='Guerreiro' && nArmas) add('Investida',Math.min(2,nArmas));
  if(cls==='Guardião' && escudo) add('Escudo (Guardião)',1);
  if(cls==='Assassino' && sozinho) add('Sem ajuda (Assassino)',1);
  if(cls==='Caçador' && (tipos.has('Bestial')||tipos.has('Alado'))) add('Caçador',1);
  if(rc==='Anão'){ add('Anão',1); if(tipos.has('Alado')) add('Anão vs Alado',-1); if(h.anaoMais) add('Anão vs monstro',h.anaoMais); }
  if(rc==='Orc' && sozinho && C.magiasUsadas.length===0) add('Orc',1);
  if(rc==='Halfling' && tipos.has('Morto-vivo')) add('Halfling vs Morto-vivo',-2);
  if(rc==='Elfo' && h.elfoMenos) add('Elfo vs monstro',-h.elfoMenos);
  if((cls==='Guardião'||cls==='Guerreiro') && h.guardGuerr) add('vs Cavaleiro',h.guardGuerr);
  if(cls==='Clérigo' && h.clerigoMais) add('Clérigo vs Lich',h.clerigoMais);
  if(h.chaveMestra && temNaMao(p,'Chave Mestra')) add('Chave Mestra',h.chaveMestra);
  return {total:P.reduce((s,x)=>s+x[1],0), partes:P};
}
function poderMonUm(m,C){
  const p=C.p; let v=m.c.poder+m.mod;
  if(!C.ignoraAndar) v+=ANDARES[p.andar].b;
  if(m.c.hab.rival && p.classe && p.classe.nome===m.c.hab.rival) v+=2;
  if(p.classe && p.classe.nome==='Clérigo' && m.c.tipos.some(t=>['Morto-vivo','Demônio','Fantasma'].includes(t))) v-=3;
  return Math.max(0,v);
}
// detalhamento do Poder de um monstro: [[rótulo, valor]]
function partesMon(m,C){
  const p=C.p, P=[['Base da carta',m.c.poder]];
  if(!C.ignoraAndar && ANDARES[p.andar].b) P.push([`Bônus do andar ${p.andar}`,ANDARES[p.andar].b]);
  m.fontes.forEach(f=>P.push([f.txt,f.v]));
  const resto=m.mod-m.fontes.reduce((s,f)=>s+f.v,0); if(resto) P.push(['Outros efeitos',resto]);
  if(m.c.hab.rival && p.classe && p.classe.nome===m.c.hab.rival) P.push([`Rival (${p.classe.nome})`,2]);
  if(p.classe && p.classe.nome==='Clérigo' && m.c.tipos.some(t=>['Morto-vivo','Demônio','Fantasma'].includes(t))) P.push(['Fé do Clérigo',-3]);
  return P;
}
function totalMon(C){ let s=0; C.mons.forEach(m=>s+=poderMonUm(m,C)); return Math.max(0,s-C.reducao); }
function ajudaPoder(C){
  if(!C.helper) return 0;
  let v=poderBase(C.helper,C).total;
  if(C.helper.classe && C.helper.classe.nome==='Clérigo') v+=2;   // Bênção
  return v;
}
function totalJog(C){ return poderBase(C.p,C).total + C.bonus + ajudaPoder(C); }
function podeVencerEmpate(p){ return p.raca && p.raca.nome==='Orc'; }
