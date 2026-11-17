// ===================== INTERFACE (navegador) =====================
const $ = s => document.querySelector(s);
function el(tag, attrs, ...kids){
  const e=document.createElement(tag);
  if(attrs) for(const k in attrs){
    if(k==='class') e.className=attrs[k];
    else if(k==='html') e.innerHTML=attrs[k];
    else if(k.startsWith('on')) e.addEventListener(k.slice(2),attrs[k]);
    else if(attrs[k]!==false && attrs[k]!==null && attrs[k]!==undefined) e.setAttribute(k,attrs[k]);
  }
  kids.flat().forEach(c=>{ if(c===null||c===undefined||c===false) return; e.append(c.nodeType?c:document.createTextNode(c)); });
  return e;
}
const ICONE={monstro:'👹',mod:'💢',armadilha:'🪤',bau:'🧰',saida:'🪜',descanso:'🔥',evento:'📜',invocacao:'🐾',arma:'⚔️',escudo:'🛡️',tronco:'🥋',cabeca:'⛑️',pes:'🥾',acc:'💍',grimorio:'📕',magia:'✨',consumivel:'🧪',especial:'🔮',raca:'🧬',classe:'🎓',objetivo:'🎯'};
const COR_MAGIA={Vermelha:'#c0392b',Preta:'#6c5b7b',Azul:'#2e86c1',Branca:'#d5d8dc',Verde:'#27ae60'};
const HAB_TXT={longa:n=>`Armas de longa distância +${n} contra ele.`,noCurta:()=>'Armas curtas não somam bônus.',noLonga:()=>'Armas de longa distância não somam bônus.',noMagica:()=>'Armas mágicas não somam bônus.',
  imuneVermelha:()=>'Imune a magias Vermelhas.',brancaMais:n=>`Magias Brancas +${n} contra ele.`,azulMais:n=>`Magias Azuis +${n} contra ele.`,vermelhaMais:n=>`Magias Vermelhas +${n} contra ele.`,
  anaoMais:n=>`Anões +${n} contra ele.`,foge6:()=>'Só foge com 6.',fugaAuto:()=>'Lento: a fuga é automática.',noAzul:()=>'Magias Azuis não funcionam.',
  guardGuerr:n=>`Guardiões e Guerreiros +${n} contra ele.`,clerigoMais:n=>`Clérigos +${n} contra ele.`,elfoMenos:n=>`Elfos −${n} contra ele.`,chaveMestra:n=>`Com Chave Mestra, +${n} Poder para você.`};
function castigoTxt(ops){
  return ops.map(o=>{ switch(o.k){
    case 'pe':return `perca ${o.n} PE`; case 'descM':return `descarte ${o.n} da mão`; case 'pes':return 'perca o item de pés'; case 'cab':return 'perca o item de cabeça';
    case 'tronco':return 'perca o item de tronco'; case 'vira':return `vire ${o.n} magia(s)`; case 'viraT':return 'vire todas as magias'; case 'sobe':return 'suba 1 andar';
    case 'equip':return `perca ${o.n} equipamento`; case 'mochila':return 'perca a Mochila'; case 'turno':return 'perca o próximo turno'; case 'todosEq':return 'perca todos os itens equipados';
    case 'idRC':return 'perca Raça e Classe'; case 'magEq':return 'descarte 1 magia equipada'; case 'saq':return 'a esquerda pega 1 carta sua'; case 'kobold':return 'revele a próxima carta (armadilha se aplica)';
    case 'bruto':return 'a direita escolhe um item seu'; case 'mimico':return 'perca Mochila e 1 item'; case 'escTronco':return 'perca escudo ou tronco'; case 'enxame':return 'vire 1 magia (ou perca 2 PE)';
    case 'golem':return '(só se recusar fugir) perca 4 PE'; case 'maoAte1':return 'descarte a mão até ficar com 1';
  } return ''; }).join('; ');
}
function espTxt(e){
  if(!e) return ''; const r=[];
  if(e.classe) for(const k in e.classe) r.push(`${k} +${e.classe[k]}`);
  if(e.raca) for(const k in e.raca) r.push(`${k} +${e.raca[k]}`);
  if(e.vs) for(const k in e.vs) r.push(`+${e.vs[k]} contra ${k}`);
  if(e.fuga) r.push(`Fuga +${e.fuga}`); if(e.lim) r.push(`+${e.lim} limite de magias`); if(e.imuneLaminas) r.push('Imune a Lâminas Ocultas');
  if(e.capuz) r.push('Ao vasculhar, olhe a 1ª carta antes');
  return r.join(' · ');
}
function corMagia(c){ return COR_MAGIA[c.cor]||'#888'; }
function profTxt(c){
  const T={curta:'armas curtas',longa:'armas de longa distância',magica:'armas mágicas',escudo:'escudos',armadura:'armaduras',manto:'mantos',tunica:'túnicas'};
  let t=null;
  if(['arma','escudo','tronco'].includes(c.tipo)){
    const cl=Object.keys(CLASSES).filter(k=>CLASSES[k].prof.includes(c.sub));
    t=`🎓 Proficiência necessária: classe ${cl.join(', ')} (${T[c.sub]}). Desconhecido não consegue usar.`;
  } else if(c.tipo==='magia'){
    const cl=Object.keys(CLASSES).filter(k=>CLASSES[k].cor===c.cor);
    t=`🎓 Proficiência necessária (magia ${c.cor}): classe ${cl.join(', ')||'—'}${c.cor==='Vermelha'?' ou raça Tiefling':''}, ou equipar o ${GRIMORIOS.find(g=>g[1]===c.cor)[0]}.`;
  } else if(c.tipo==='grimorio') t=`🎓 Sem proficiência necessária: qualquer personagem usa. Concede proficiência em magias ${c.cor}s.`;
  else if(['cabeca','pes','acc','consumivel','especial'].includes(c.tipo)) t='🎓 Sem proficiência necessária: qualquer personagem, até Desconhecido.';
  else if(c.tipo==='raca'||c.tipo==='classe') t='🎓 Assuma jogando na Preparação (1 Raça e 1 Classe no máximo).';
  if(t && typeof G!=='undefined' && G && G.jogadores && ['arma','escudo','tronco','magia'].includes(c.tipo)){
    t+=tenhoProf(G.jogadores[0],c)?'\n✔ Você tem esta proficiência.':'\n✘ Você NÃO tem esta proficiência agora.';
  }
  return t;
}
function descCarta(c){
  const L=[];
  switch(c.tipo){
    case 'monstro': if(c.guardiao) L.push('Só no andar 1. Sem ajuda. Vencê-lo dá a Chave da Torre 🗝️.'); L.push(`Poder ${c.poder} (+ bônus do andar onde for enfrentado: andares 7-6 +1, 5-4 +2, 3-2 +3, 1 +4) · ${c.pe} PE · ${c.t} Tesouro(s)`+(c.tipos.length?` · [${c.tipos.join(', ')}]`:'')); for(const k in c.hab){ const h=HAB_TXT[k]; if(h) L.push(h(c.hab[k])); else if(k==='rival') L.push(`Rival: +2 Poder contra ${c.hab[k]}.`); } L.push('Castigo: '+castigoTxt(c.castigo)+'.'); break;
    case 'mod': L.push(c.nome==='Possuído'?'Acrescenta outro monstro ao combate.':`${c.mp>0?'+':''}${c.mp} Poder, ${c.mpe>0?'+':''}${c.mpe} PE${c.mt?`, ${c.mt>0?'+':''}${c.mt} Tesouro`:''} no monstro. (I) Interferência.`); break;
    case 'arma': L.push(`Arma ${c.sub==='curta'?'curta':c.sub==='longa'?'de longa distância':'mágica'} · +${c.poder} Poder · ${c.maos} mão(s) · ${c.ouro} ouro`); if(espTxt(c.esp)) L.push(espTxt(c.esp)); break;
    case 'escudo': L.push(`Escudo · +${c.poder} Poder · 1 mão · ${c.ouro} ouro`); if(espTxt(c.esp)) L.push(espTxt(c.esp)); break;
    case 'tronco': L.push(`${c.sub==='armadura'?'Armadura':c.sub==='manto'?'Manto':'Túnica'} (tronco) · +${c.poder} Poder · ${c.ouro} ouro`); if(espTxt(c.esp)) L.push(espTxt(c.esp)); break;
    case 'cabeca': case 'pes': L.push(`${c.tipo==='cabeca'?'Cabeça':'Pés'} · +${c.poder} Poder · ${c.ouro} ouro`); if(espTxt(c.esp)) L.push(espTxt(c.esp)); break;
    case 'acc': L.push(`Acessório · ${c.ouro} ouro`); L.push(c.txt); break;
    case 'grimorio': L.push(`Ocupa 1 mão. Dá proficiência em magias ${c.cor}s. ${c.ouro} ouro.`); break;
    case 'magia': L.push(`Magia ${c.cor}${c.fam?' (Familiar)':''}${c.unica?' · ÚNICA':''}`); L.push(c.txt); break;
    case 'consumivel': case 'especial': L.push(c.txt+` (${c.ouro} ouro)`); break;
    case 'descanso': L.push('Ponto de Descanso: só vale quando REVELADO ao Explorar. Escolha 1: (1) compre 2 Tesouros e descarte 1; (2) desvire todas as suas magias (outros jogadores no mesmo andar ou acima desviram 1); (3) explore novamente (só Explorar, sem Provocar nem Vasculhar). Na mão serve só de combustível.'); break;
    case 'invocacao': L.push('(I) Interferência: quando um jogador no mesmo andar ou abaixo de você revelar/enfrentar um monstro, jogue junto com um Monstro da mão: ele entra no combate e os Poderes somam. Fuga e castigo são resolvidos um monstro por vez. 1 por rodada; não pode mirar o mesmo jogador duas vezes seguidas.'); break;
    default: if(c.txt) L.push(c.txt); if(c.tipo==='armadilha') L.push(c.I?'(I) pode ser jogada no combate de outros.':'Sem (I): só combustível na mão.'); if(c.tipo==='bau') L.push(`Compre ${c.n} Tesouros.`); if(c.tipo==='saida') L.push('Desça 1 andar. No andar 1, sai da torre!');
  }
  const pf=profTxt(c); if(pf) L.push(pf);
  if(!L.length) L.push(c.txt||'Sem efeito descrito.');   // garantia: toda carta mostra algo no tooltip
  return L.join('\n');
}
function statCarta(c){
  switch(c.tipo){
    case 'monstro': return `⚔${c.poder}  ★${c.pe}  💎${c.t}`;
    case 'mod': return c.nome==='Possuído'?'+1 monstro':`${c.mp>0?'+':''}${c.mp} Poder`;
    case 'arma': case 'escudo': case 'tronco': case 'cabeca': case 'pes': return `+${c.poder} · ${c.ouro}🪙`;
    case 'magia': return c.fam?`Familiar +${c.pod}`:c.cor;
    case 'bau': return `💎 ${c.n}`;
    case 'consumivel': case 'especial': case 'acc': case 'grimorio': return `${c.ouro}🪙`;
    default: return '';
  }
}
function cardEl(c,o={}){
  const cls=['card','t-'+c.tipo]; if(c.virada) cls.push('virada'); if(o.sel) cls.push('sel'); if(o.pequena) cls.push('peq'); if(o.click) cls.push('clicavel'); if(o.dim) cls.push('dim');
  const art=el('div',{class:'art'}, el('span',{class:'ico'},ICONE[c.tipo]||'🃏'));
  if(c.img){ const im=new Image(); im.alt=''; im.loading='lazy'; im.onerror=()=>im.remove(); im.src=c.img; art.append(im); }
  const e=el('div',{class:cls.join(' '),title:c.nome+'\n'+descCarta(c)},
    art,
    el('div',{class:'nm'},c.nome),
    el('div',{class:'st'},statCarta(c)),
    c.tipo==='magia'?el('div',{class:'cor',style:`background:${corMagia(c)}`}):null,
    c.virada?el('div',{class:'vir'},'↻ virada'):null);
  if(o.click) e.addEventListener('click',o.click);
  return e;
}

// ---------- estado da UI ----------
const UI = {
  rapido:false, prepAtiva:false, ocupado:false, modalDepth:0,
  esperar(ms){ return new Promise(r=>setTimeout(r, ms*(UI.rapido?0.25:1))); },
  reset(){ $('#status').innerHTML=''; $('#log').innerHTML=''; $('#revelada').innerHTML=''; $('#fim').classList.add('oculto'); },
  log(msg,pid){
    const box=$('#log'); const turno=msg.startsWith('━━━');
    const d=el('div',{class:'ln'+(turno?' turno':'')+(msg.startsWith('↳')?' ef':'')});
    if(pid!==null && pid!==undefined && G){ const p=G.jogadores[pid]; if(p) d.style.borderLeftColor=p.cor; }
    d.textContent=msg;
    // mais recente no TOPO, mais antigo embaixo; a linha de descrição (↳) fica logo abaixo da carta revelada
    if(msg.startsWith('↳') && box.firstChild) box.firstChild.after(d); else box.prepend(d);
    while(box.children.length>400) box.lastChild.remove();
    box.scrollTop=0;
  },
  toast(p,tipo,icone,titulo,texto){
    const box=$('#toasts'); if(!box) return;
    const t=el('div',{class:'toast '+tipo,style:p?`--c:${p.cor}`:''},
      el('div',{class:'ic'},icone),
      el('div',null,el('div',{class:'tt'},(p?p.avatar+' ':'')+titulo), el('div',{class:'tx'},texto||'')));
    box.append(t);
    while(box.children.length>4) box.firstChild.remove();
    setTimeout(()=>{ t.classList.add('sai'); setTimeout(()=>t.remove(),400); }, 4200*(UI.rapido?0.5:1));
  },
  turno(p,fase){ UI.fase=fase; UI.renderBanner(); },
  async revelar(c,p){
    const r=$('#revelada'); r.innerHTML='';
    r.append(el('div',{class:'rev-tit'},`${p.avatar} ${p.nome} revela:`), cardEl(c), el('div',{class:'rev-txt'},descCarta(c)));
    r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    await UI.esperar(eh(p)?1100:1700);
  },
  // ---------- renderização ----------
  render(){ if(!G) return; UI.renderBanner(); UI.renderTorre(); UI.renderRivais(); UI.renderJogador(); },
  renderBanner(){
    if(!G) return;
    const p=G.jogadores[G.vez];
    $('#banner').innerHTML='';
    $('#banner').append(
      el('div',{class:'rod'},`RODADA ${G.rodada}`),
      el('div',{class:'ordem'}, G.jogadores.map((j,i)=>el('div',{class:'chip'+(i===G.vez?' ativo':'')+(j.humano?' eu':''),style:`--c:${j.cor}`},
        el('span',{class:'av'},j.avatar), el('span',{class:'nome'},j.nome.split(',')[0]), i===G.vez?el('span',{class:'seta'},'◀ TURNO'):null))),
      el('div',{class:'fase'},`Turno ${G.turnoN}: `, el('b',{style:`color:${p.cor}`},p.nome), ` — ${UI.fase||''}`));
    document.body.classList.toggle('meuturno',eh(p));
  },
  renderTorre(){
    const t=$('#torre'); t.innerHTML='';
    t.append(el('h3',null,'🏰 A Torre'));
    for(let a=10;a>=1;a--){
      const quem=G.jogadores.filter(j=>j.andar===a);
      t.append(el('div',{class:'andar'+(quem.some(j=>j===G.jogadores[G.vez])?' ativo':'')+(a===1?' saida':'')},
        el('div',{class:'num'},a), el('div',{class:'inf'},el('div',{class:'an'},ANDARES[a].nome),el('div',{class:'bn'},`monstro +${ANDARES[a].b}`)),
        el('div',{class:'toks'},quem.map(j=>el('span',{class:'tok',style:`background:${j.cor}`,title:j.nome},j.avatar)))));
    }
    t.append(el('div',{class:'porta'},'🚪 Saída da Torre'));
  },
  renderRivais(){
    const r=$('#rivais'); r.innerHTML='';
    G.jogadores.filter(j=>!j.humano).forEach(j=>r.append(UI.painelJogador(j,false)));
    r.append(el('div',{class:'baralhos'},
      el('div',null,`🂠 Explorar Torre: ${G.E.length}`), el('div',null,`💰 Tesouros: ${G.T.length}`), el('div',{class:'lnk',title:'Ver o descarte do Explorar Torre',onclick:()=>UI.verDescartes('E')},`🗑️ Descarte Exploração: ${G.dE.length} (ver)`),
      el('div',{class:'lnk',title:'Ver o descarte dos Tesouros',onclick:()=>UI.verDescartes('T')},`🗑️ Descarte Tesouros: ${G.dT.length} (ver)`)));
  },
  // Janela para consultar as pilhas de descarte. Usa overlay próprio (abaixo do #modal) para não atrapalhar
  // nenhuma pergunta do jogo que apareça enquanto ela estiver aberta.
  verDescartes(aba='E'){
    let v=document.getElementById('vdesc'); if(v) v.remove();
    v=el('div',{id:'vdesc'});
    const fechar=()=>{ v.remove(); document.removeEventListener('keydown',esc); };
    const esc=e=>{ if(e.key==='Escape') fechar(); };
    document.addEventListener('keydown',esc);
    v.addEventListener('click',e=>{ if(e.target===v) fechar(); });
    const PILHAS={ E:{nome:'🂠 Descarte da Exploração',desc:'Explorar Torre',dis:()=>G.dE,deck:()=>G.E.length},
                   T:{nome:'💰 Descarte dos Tesouros',desc:'Tesouros',dis:()=>G.dT,deck:()=>G.T.length},
                   O:{nome:'🎯 Descarte dos Objetivos',desc:'Objetivos',dis:()=>G.dO,deck:()=>G.O.length} };
    const box=el('div',{class:'modalbox larga vd-box'});
    const desenha=()=>{
      box.innerHTML='';
      const P=PILHAS[aba], lista=P.dis();
      box.append(el('h2',null,'🗑️ Cartas descartadas'),
        el('div',{class:'vd-abas'},Object.keys(PILHAS).map(k=>el('button',{class:'btn'+(k===aba?' ok':''),onclick:()=>{ aba=k; desenha(); }},`${PILHAS[k].nome} (${PILHAS[k].dis().length})`))),
        el('p',{class:'cont'},`${P.nome}: ${lista.length} carta(s) · ${P.deck()} no baralho de ${P.desc}. Mais recentes primeiro.`+(aba!=='O'?` Quando o baralho fica com menos de ${MIN_PILHA} cartas, este descarte é embaralhado de volta nele (cada descarte volta só para a sua pilha).`:'')),
        lista.length?el('div',{class:'grade vd-grade'},lista.slice().reverse().map(c=>el('div',{class:'cartaDesc'},cardEl(c),el('div',{class:'cd-t'},descCarta(c))))):el('div',{class:'cont'},'Nenhuma carta descartada ainda.'),
        el('div',{class:'linha'},el('button',{class:'btn ok',onclick:fechar},'Fechar')));
    };
    desenha(); v.append(box); document.body.append(v);
  },
  painelJogador(j,eu){
    const pb=poderBase(j,null);
    const it=equipados(j).map(c=>el('span',{class:'mini',title:descCarta(c)},c.nome));
    const mg=j.magias.map(c=>el('span',{class:'mini mg'+(c.virada?' v':''),style:`border-color:${corMagia(c)}`,title:descCarta(c)},c.nome+(c.virada?' ↻':'')));
    const ativo=G.jogadores[G.vez]===j;
    return el('div',{class:'pj'+(ativo?' ativo':''),style:`--c:${j.cor}`},
      el('div',{class:'pj-top'},el('span',{class:'av'},j.avatar),el('b',null,j.nome),j.chave?el('span',{class:'chave',title:'Chave da Torre'},'🗝️'):null,ativo?el('span',{class:'ptag'},'JOGANDO'):null),
      el('div',{class:'stats'},
        el('span',{title:'Andar'},`🏰 ${j.andar}`),el('span',{title:'Pontos de Exploração (XP)'},`★ ${j.pe} PE`),el('span',{title:'Poder total (sem bônus de combate)'},`⚔ ${pb.total}`),
        el('span',{title:'Cartas na mão'},`🃏 ${j.mao.length}`),el('span',{title:'Objetivos ativos'},`🎯 ${j.objs.length}`)),
      el('div',{class:'id'},`${j.raca?j.raca.nome:'—'} · ${j.classe?j.classe.nome:'Desconhecido'}`),
      (it.length||mg.length)?el('div',{class:'minis'},it,mg):el('div',{class:'vazio'},'Sem equipamento'));
  },
  renderJogador(){
    const p=G.jogadores[0]; const box=$('#jogador'); box.innerHTML='';
    const pb=poderBase(p,null);
    const info=el('div',{class:'meu-topo'},
      el('div',{class:'meu-id'},el('span',{class:'av'},p.avatar),el('b',null,p.nome),p.chave?el('span',{class:'chave'},'🗝️ Chave'):null),
      el('div',{class:'stats grande'},
        el('span',null,`🏰 Andar ${p.andar}`),el('span',null,`★ ${p.pe} PE`),
        el('span',{class:'pod',title:pb.partes.map(x=>x[0]+': '+(x[1]>0?'+':'')+x[1]).join('\n')},`⚔ Poder ${pb.total}`),
        el('span',null,`${p.raca?p.raca.nome:'Sem raça'} · ${p.classe?p.classe.nome:'Desconhecido'}`)));
    const prep=UI.prepAtiva&&!UI.ocupado;
    const slot=(rot,c)=>el('div',{class:'slot'},el('div',{class:'rot'},rot), c?cardEl(c,{pequena:1,click:()=>UI.cartaClick(c)}):el('div',{class:'vazioSlot'},'vazio'));
    const PN={curta:'armas curtas',longa:'armas de longa distância',magica:'armas mágicas',escudo:'escudos',armadura:'armaduras',manto:'mantos',tunica:'túnicas'};
    const idSlot=(rot,c,vazio)=>{
      let det='';
      if(c){
        if(c.tipo==='raca') det=RACAS[c.nome];
        else { const k=CLASSES[c.nome]; det=k.txt+`
Proficiências: ${k.prof.map(x=>PN[x]).join(', ')}${k.cor?`; magias ${k.cor}s`:''}.
Limite de magias: ${k.lim}.`; }
      } else det=rot==='Raça'?'Assuma uma Raça (carta da mão) na Preparação.':'Sem classe você só usa itens comuns (cabeça, pés, acessórios, consumíveis). Assuma uma Classe na Preparação.';
      return el('div',{class:'slot dbl'},el('div',{class:'rot'},rot+(c?': '+c.nome:'')),
        el('div',{class:'row idrow'},c?cardEl(c,{pequena:1}):el('div',{class:'vazioSlot'},vazio),el('div',{class:'idtxt'},det)));
    };
    const maos=[0,1].map(i=>p.equip.maos[i]);
    const eq=el('div',{class:'equip'},
      slot('Cabeça',p.equip.cabeca),slot('Tronco',p.equip.tronco),slot('Pés',p.equip.pes),slot('Acessório',p.equip.acc),
      el('div',{class:'slot dbl'},el('div',{class:'rot'},'Mãos (2)'),el('div',{class:'row'},p.equip.maos.length?p.equip.maos.map(c=>cardEl(c,{pequena:1,click:()=>UI.cartaClick(c)})):el('div',{class:'vazioSlot'},'vazio'))),
      el('div',{class:'slot dbl'},el('div',{class:'rot'},`Magias (${p.magias.length}/${limiteMagias(p)})`),el('div',{class:'row'},p.magias.length?p.magias.map(c=>cardEl(c,{pequena:1,click:()=>UI.cartaClick(c)})):el('div',{class:'vazioSlot'},'vazio'))),
      el('div',{class:'slot dbl'},el('div',{class:'rot'},`Mochila (${p.mochila.length}/${mochilaCap(p)})`),el('div',{class:'row'},p.mochila.length?p.mochila.map(c=>cardEl(c,{pequena:1,click:()=>UI.cartaClick(c)})):el('div',{class:'vazioSlot'},'vazia'))));
    // Poção do Sono / Canção de Ninar / Ilusão de Saída: botão "Armar". Armada = o jogo a usa sozinho no momento certo
    // (início do turno de outro jogador / Saída revelada por outro). Desarmada = nunca pergunta, o jogo corre normal.
    const cartaMao=c=>{
      const e=cardEl(c,{click:()=>UI.cartaClick(c)});
      if(c.ef==='sono'||c.ef==='ilusao'){
        e.classList.toggle('armada',!!c.armada);
        e.append(el('button',{class:'arma-bt'+(c.armada?' on':''),
          title:(c.ef==='sono'?'Armada: será usada no início do próximo turno de outro jogador.':'Armada: será usada quando outro jogador revelar uma Saída.')+' Você pode armar/desarmar a qualquer momento, inclusive com o jogo pausado.',
          onclick:ev=>{ ev.stopPropagation(); c.armada=!c.armada; UI.renderJogador(); }},c.armada?'⚡ ARMADA':'☐ Armar'));
      }
      return e;
    };
    const mao=el('div',{class:'mao'},p.mao.length?p.mao.map(cartaMao):el('div',{class:'vazioSlot'},'Mão vazia'));
    const objs=el('div',{class:'objs'},p.objs.map(o=>{ const d=OBJETIVOS[o.c.idx]; const pr=progObjetivo(p,o);
    const prog=pr?el('div',{class:'obj-prog'+(pr[0]>=pr[1]?' ok':'')},el('div',{class:'obj-bar'},el('i',{style:`width:${Math.round(100*pr[0]/pr[1])}%`})),el('span',null,`${pr[0]} / ${pr[1]}${pr[2]||''}`)):null;
    return el('div',{class:'obj',title:d.d},el('b',null,'🎯 '+d.n),el('span',null,d.d),prog,el('i',null,`+${d.pe} PE${d.desce?' ⬇':''}${d.t?' +1T':''}`)); }));
    const barra=el('div',{class:'barra'+(prep?' on':'')});
    if(UI.prepAtiva){
      const bt=(txt,fn,dis)=>el('button',{class:'btn',disabled:(dis||UI.ocupado)?'':null,onclick:fn},txt);
      const temMonstro=p.mao.some(c=>c.tipo==='monstro'&&!c.guardiao)&&p.mao.length>=2;
      barra.append(el('div',{class:'dica'},'Preparação: clique nas cartas para equipar/usar. Saída/Baú/Descanso só valem se REVELADOS ao Explorar. Mão acima de 5 será descartada no fim do turno. Venda itens no Mercado (200 de ouro = 1 Tesouro; 400 = descida). Escolha UMA ação:'),
        bt('🛒 Mercado',()=>UI.mercado(p)), bt('🎓 Habilidades',()=>UI.habMenu(p),habilidades(p).length===0),
        bt('🔍 EXPLORAR',()=>UI.escolheuAcao('explorar'),false), bt('🎒 VASCULHAR',()=>UI.escolheuAcao('vasculhar')), bt('😈 PROVOCAR',()=>UI.escolheuAcao('provocar'),!temMonstro));
    }
    box.append(info,barra,el('div',{class:'meu-corpo'},eq,el('div',{class:'colId'},idSlot('Raça',p.raca,'Sem raça'),idSlot('Classe',p.classe,'Desconhecido (sem classe)')),el('div',{class:'colMao'},el('div',{class:'rot'},`Mão (${p.mao.length}/${limiteMao(p)})`),mao),el('div',{class:'colObj'},el('div',{class:'rot'},'Objetivos secretos'),objs)));
  },
  // ---------- modais ----------
  abrirModal(conteudo,opt={}){
    const m=$('#modal'); const box=$('#modalbox'); box.innerHTML=''; box.className='modalbox '+(opt.larga?'larga':'')+(opt.cena?' cenabox '+opt.cena:'');
    box.append(conteudo); m.classList.remove('oculto'); UI.modalDepth++;
  },
  fecharModal(){ $('#modal').classList.add('oculto'); UI.modalDepth=Math.max(0,UI.modalDepth-1); },
  // Cena de apresentação (estilo slide): aparece ~3s com barra de tempo e botão Continuar.
  // tipo: outro(cinza) | inter(verde) | combate(vermelho) | vit(dourado) | desc(azul) | perigo(laranja) | fim(roxo)
  status(p,icone,texto,tipo){
    const s=$('#status'); if(!s) return;
    s.className='st '+(tipo||'outro'); s.innerHTML='';
    s.append(el('span',{class:'st-ic'},icone), p?el('b',{style:`color:${p.cor}`},`${p.avatar} ${p.nome}`):null, el('span',{class:'st-tx'},texto));
    s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash');
  },
  // Cena de apresentação: NÃO usa mais tela sobreposta. O texto aparece na faixa de status do topo
  // (ao lado da carta revelada) com botões Pausar e Continuar e uma barra de tempo (~3s).
  // tipo: outro(cinza) | inter(verde) | combate(vermelho) | vit(dourado) | desc(azul) | perigo(laranja) | fim(roxo)
  cena(o){
    UI.status(o.p,o.icone,`${o.titulo}${o.texto?' — '+o.texto:''}`,o.tipo);
    const st=$('#status'); if(!st) return Promise.resolve();
    return new Promise(res=>{
      const ms=3000*(UI.rapido?0.4:1);
      let feito=false, t=null, pausado=false, restante=ms, ini=0;
      const bar=el('div',{class:'st-bar'},el('i',{style:`animation-duration:${ms}ms`}));
      const btP=el('button',{class:'btn st-pausa'},'⏸ Pausar');
      const btC=el('button',{class:'btn ok st-cont'},'Continuar ▶');
      const fim=()=>{ if(feito) return; feito=true; clearTimeout(t); document.removeEventListener('keydown',tecla); st.classList.remove('pausado','cena'); [btP,btC,bar].forEach(x=>x.remove()); res(); };
      const corre=()=>{ ini=Date.now(); t=setTimeout(fim,restante); bar.firstChild.style.animationPlayState='running'; };
      const alterna=()=>{
        if(feito) return;
        if(pausado){ pausado=false; st.classList.remove('pausado'); btP.textContent='⏸ Pausar'; corre(); }
        else { pausado=true; clearTimeout(t); restante-=Date.now()-ini; bar.firstChild.style.animationPlayState='paused'; st.classList.add('pausado'); btP.textContent='▶ Retomar'; }
      };
      btP.onclick=alterna; btC.onclick=fim;
      const tecla=e=>{ if(e.key==='Enter'){ e.preventDefault(); fim(); } else if(e.key===' '||e.key.toLowerCase()==='p'){ e.preventDefault(); alterna(); } };
      document.addEventListener('keydown',tecla);
      st.classList.add('cena'); st.append(btP,btC,bar);
      corre();
    });
  },
  painelCombate(C){
    const mt=totalMon(C), b=poderBase(C.p,C), jt=totalJog(C);
    const mons=el('div',{class:'cb-mons'},C.mons.map(m=>el('div',{class:'cb-mon'},cardEl(m.c,{pequena:1}),el('div',{class:'cb-pm'},`Poder ${poderMonUm(m,C)}`),
      el('div',{class:'cb-pd'},partesMon(m,C).map(x=>el('div',null,`${x[0]} ${x[1]>0?'+':''}${x[1]}`))),
      null)));
    const linhas=b.partes.map(x=>el('li',null,`${x[0]} `,el('b',null,(x[1]>0?'+':'')+x[1])));
    if(C.bonus) linhas.push(el('li',null,'Magias/consumíveis ',el('b',null,'+'+C.bonus)));
    if(C.helper) linhas.push(el('li',null,`Ajuda de ${C.helper.nome} `,el('b',null,'+'+ajudaPoder(C))));
    const ganha=jt>mt||(podeVencerEmpate(C.p)&&jt===mt)||(C.autoVit&&mt<=6);
    return el('div',{class:'cb'},mons,
      el('div',{class:'cb-vs'},el('div',{class:'cb-col'},el('div',{class:'cb-n '+(ganha?'ok':'ruim')},jt),el('div',null,'Seu poder')),el('div',{class:'x'},'vs'),
        el('div',{class:'cb-col'},el('div',{class:'cb-n mon'},mt),el('div',null,'Monstro'+(C.reducao?` (−${C.reducao})`:'')))),
      el('ul',{class:'cb-det'},linhas),
      (()=>{ const R=motivosMagias(C.p,C); return R.length?el('div',{class:'cb-aviso'},el('b',null,'Magias que você NÃO pode usar agora:'),R.map(t=>el('div',null,'• '+t))):null; })(),
      (C.seVence.pe||C.seVence.t)?el('div',{class:'cb-nota'},`Se vencer: ${C.seVence.pe?'+'+C.seVence.pe+' PE ':''}${C.seVence.t?'+'+C.seVence.t+' Tesouro':''}`):null);
  },
  pick(titulo,texto,opcoes,ctx){
    return new Promise(res=>{
      const box=el('div',{class:'pk'},el('h2',null,titulo));
      if(ctx&&ctx.C) box.append(UI.painelCombate(ctx.C));
      if(texto) box.append(el('p',{class:'txt'},texto));
      if(ctx&&ctx.cartas) box.append(el('div',{class:'grade'},ctx.cartas.map(c=>el('div',{class:'cartaDesc'},cardEl(c),el('div',{class:'cd-t'},descCarta(c))))));
      const lista=el('div',{class:'opcoes'});
      opcoes.forEach(o=>lista.append(el('button',{class:'opt'+(o.carta?' comcarta':''),disabled:o.off?'':null,onclick:()=>{ UI.fecharModal(); res(o.val); }},
        o.carta?cardEl(o.carta,{pequena:1}):null, el('div',{class:'otx'},el('b',null,o.label),o.desc?el('small',null,o.desc):null,o.carta?el('small',{class:'cd-t'},descCarta(o.carta)):null))));
      box.append(lista); UI.abrirModal(box,{larga:!!(ctx&&(ctx.C||ctx.cartas))});
    });
  },
  pickCartas(titulo,cartas,min,max,texto){
    return new Promise(res=>{
      const sel=new Set(); const box=el('div',{class:'pk'},el('h2',null,titulo)); if(texto) box.append(el('p',{class:'txt'},texto));
      const grade=el('div',{class:'grade'}); const info=el('div',{class:'cont'}); const ok=el('button',{class:'btn ok'},'Confirmar');
      const atual=()=>{ info.textContent=`Selecionadas: ${sel.size} (${min===max?'exatamente '+min:`de ${min} a ${max}`})`; ok.disabled=!(sel.size>=min&&sel.size<=max); };
      cartas.forEach(c=>{ const e=cardEl(c); const w=el('div',{class:'cartaDesc clic'},e,el('div',{class:'cd-t'},descCarta(c)));
        w.addEventListener('click',()=>{ if(sel.has(c)){ sel.delete(c); e.classList.remove('sel'); } else { if(max===1){ sel.clear(); grade.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel')); } if(sel.size<max){ sel.add(c); e.classList.add('sel'); } } atual(); });
        grade.append(w); });
      ok.onclick=()=>{ UI.fecharModal(); res(cartas.filter(c=>sel.has(c))); };
      box.append(grade,info,ok); atual(); UI.abrirModal(box,{larga:true});
    });
  },
  // ---------- preparação do jogador ----------
  async faseHumana(p){
    UI.prepAtiva=true; UI.ocupado=false; UI.render();
    return new Promise(res=>{ UI.resolverAcao=res; });
  },
  escolheuAcao(a){
    if(UI.ocupado) return;
    UI.prepAtiva=false; const r=UI.resolverAcao; UI.resolverAcao=null; UI.render(); r(a);
  },
  async seguro(fn){
    if(UI.ocupado) return; UI.ocupado=true; UI.render();
    try{ const msg=await fn(); if(msg) await UI.pick('Aviso',msg,[{label:'OK',val:1}]); }
    catch(e){ console.error(e); await UI.pick('Erro',String(e.message||e),[{label:'OK',val:1}]); }
    UI.ocupado=false; evento(G.jogadores[0],{t:'chk'}); await processaPend(); UI.render();
  },
  async cartaClick(c){
    const p=G.jogadores[0];
    const M = (UI.prepAtiva&&!UI.ocupado) ? menuCarta(p,c) : [];
    let nota=''; if(p.mao.includes(c)){
      if(['saida','bau','descanso','evento'].includes(c.tipo)) nota='\n\n⚠ Na mão esta carta NÃO funciona: só vale quando é REVELADA pela ação Explorar. Aqui ela serve apenas de combustível (descarte para fugir, Provocar, habilidades) ou para vender no limite de mão.';
      else if(c.tipo==='armadilha'&&!c.I) nota='\n\n⚠ Sem (I): na mão serve apenas de combustível.';
      else if(c.tipo==='mod'||c.tipo==='invocacao') nota='\n\nCarta de Interferência: é jogada quando você é perguntado durante combates/turnos de outros jogadores.'; }
    const box=el('div',{class:'pk detalhe'},cardEl(c),el('div',{class:'dtx'},el('h2',null,c.nome),el('p',{class:'txt'},descCarta(c)+nota)));
    const lista=el('div',{class:'opcoes'});
    M.forEach(m=>lista.append(el('button',{class:'opt',onclick:()=>{ UI.fecharModal(); UI.seguro(m.run); }},el('b',null,m.label))));
    lista.append(el('button',{class:'opt fechar',onclick:()=>UI.fecharModal()},'Fechar'));
    box.append(lista); UI.abrirModal(box);
  },
  async habMenu(p){
    const H=habilidades(p);
    const r=await UI.pick('Habilidades de classe','',[...H.map((h,i)=>({label:h.label,val:i})),{label:'Cancelar',val:-1}]);
    if(r>=0) await UI.seguro(H[r].run);
  },
  async mercado(p){
    UI.ocupado=true; UI.render();
    const sel=new Set();
    const fonte=()=>p.mao.filter(c=>c.deck==='T'&&c.ouro);   // só cartas da mão: equipadas/Mochila precisam ser tiradas antes
    await new Promise(fim=>{
      const desenhar=()=>{
        const box=el('div',{class:'pk'},el('h2',null,'🛒 Mercado — vender itens'));
        const L=fonte(); [...sel].forEach(c=>{ if(!L.includes(c)) sel.delete(c); });
        let ouro=[...sel].reduce((s,c)=>s+c.ouro,0); if(p.dobraVenda) ouro*=2;
        box.append(el('p',{class:'txt'},`Só aparecem cartas da MÃO. Itens equipados ou na Mochila não podem ser vendidos: tire-os antes (clique na carta → Tirar).
Cada 200 de ouro = 1 Tesouro (sem troco). Comprar uma descida: 400 de ouro ou mais, 1 vez por turno, não funciona no andar 1. Vale qualquer número de cartas: só o valor em ouro importa.
${p.dobraVenda?'✨ Carta Mercador: neste turno o ouro dos itens vale em DOBRO!':'A carta Mercador (Errante/Cego) dobra o ouro dos itens no turno em que é revelada.'}`));
        const grade=el('div',{class:'grade'});
        L.forEach(c=>{ const w=el('div',{class:'cartaDesc clic'},cardEl(c,{sel:sel.has(c)}),el('div',{class:'cd-t'},descCarta(c))); w.addEventListener('click',()=>{ sel.has(c)?sel.delete(c):sel.add(c); desenhar(); }); grade.append(w); });
        const msg=el('div',{class:'cont'},`Ouro selecionado: ${ouro} → ${tesourosVenda(ouro,sel.size)} Tesouro(s)${descOk(ouro,sel.size)?' ou 1 descida':''}`);
        const b1=el('button',{class:'btn',disabled:tesourosVenda(ouro,sel.size)<1?'':null,onclick:async()=>{ const r=await vender(p,[...sel],'tes'); sel.clear(); if(r) alert(r); desenhar(); }},'Vender → comprar Tesouros');
        const b2=el('button',{class:'btn',disabled:(!descOk(ouro,sel.size)||p.andar<=1||p.comprouDescida)?'':null,onclick:async()=>{ const cs=[...sel]; sel.clear(); UI.fecharModal(); const r=await vender(p,cs,'desc'); if(r) alert(r); UI.render(); desenhar(); }},'Comprar descida (−1 andar)');
        const b3=el('button',{class:'btn ok',onclick:()=>{ UI.fecharModal(); fim(); }},'Fechar mercado');
        box.append(grade,msg,el('div',{class:'linha'},b1,b2,b3)); UI.abrirModal(box,{larga:true});
      };
      desenhar();
    });
    UI.ocupado=false; evento(p,{t:'chk'}); await processaPend(); UI.render();
  },
  fim(v){
    const f=$('#fim'); f.classList.remove('oculto'); f.innerHTML='';
    const eu=v&&v.humano;
    f.append(el('div',{class:'fimbox'},
      el('h1',null,v?(eu?'🚪 Você saiu da Torre!':`🔒 ${v.nome} saiu da Torre`):'A Torre venceu'),
      el('p',null,v?(eu?'Você foi perdoado. Os outros exilados ficam condenados a viver nela para sempre.':'Você e o outro exilado ficam condenados a viver na torre para sempre.'):'Ninguém encontrou a saída.'),
      el('p',{class:'peq'},`Duração: ${G.rodada} rodadas.`),
      el('div',{class:'linha',style:'justify-content:center'},
        el('button',{class:'btn',onclick:()=>f.classList.add('oculto')},'👁 Ver como ficou o jogo'),
        el('button',{class:'btn ok',onclick:()=>location.reload()},'Jogar novamente'))));
    // botões no topo, ao lado de "Regras", para rever o resultado ou recomeçar depois de fechar esta tela
    $('#btnResultado').classList.remove('oculto'); $('#btnNovo').classList.remove('oculto');
  }
};

// ---------- início ----------
function regrasModal(){
  const t=el('div',{class:'pk regras'},el('h2',null,'📖 Resumo das regras'),
    el('div',{class:'rtxt',html:`
    <p><b>Objetivo:</b> desça do andar 10 ao 1 e saia: <b>revele uma Saída</b> no andar 1, ou <b>derrote o Guardião da Torre</b> (Poder 20, só no andar 1) e use a <b>Chave 🗝️</b> no início do seu próximo turno. PE <u>não</u> dão vitória: são XP (a cada 10 PE, +1 Poder).</p>
    <p><b>Seu turno:</b> 1) <b>Preparação</b>: equipar, assumir Raça/Classe, vender itens (cada 200 de ouro = 1 Tesouro; 400 de ouro = descer 1 andar; a carta Mercador dobra o ouro). 2) <b>Uma ação</b>: <b>Explorar</b> (revela carta do topo), <b>Vasculhar</b> (compra 2 cartas) ou <b>Provocar</b> (luta contra um monstro da sua mão, +1 descarte). 3) <b>Fim</b>: limite de 5 cartas na mão.</p>
    <p><b>Combate:</b> seu Poder total (1 + PE/10 + trilha + itens + raça/classe + magias) contra o Poder do monstro + bônus do andar. Maior vence. Os outros jogadores podem interferir (Modificadores de Monstro, Armadilhas (I)). Na derrota: fuja (descarta 1 carta e rola d6: 5–6) ou sofra o castigo. Vencer um monstro de Poder 8+ faz você descer 1 andar.</p>
    <p><b>Ajuda:</b> peça ajuda a um jogador no mesmo andar (ele soma o Poder e ganha 1 Tesouro) e também pode usar magias equipadas e poções da mão no combate. Não vale no andar 1.</p>
    <p><b>Trilhas:</b> a 1ª vez que chega a um andar, escolha 1 de 3 vantagens.</p>
    <p><b>Interferência:</b> Poção do Sono / Canção de Ninar no início do turno de alguém; Invocação de Monstro (+ um monstro da mão) no combate de quem está no mesmo andar ou abaixo (os Poderes somam); Ilusão de Saída anula a Saída revelada por alguém. Para usar Poção do Sono, Canção de Ninar ou Ilusão de Saída, clique em <b>☐ Armar</b> na carta (a qualquer momento, inclusive com a cena pausada): armada, o jogo a usa sozinho no momento certo; desarmada, nunca pergunta.</p>
    <p>Clique em qualquer carta para ver o texto completo. As regras completas estão em <i>Regras_do_Jogo.md</i>.</p>`}),
    el('button',{class:'btn ok',onclick:()=>UI.fecharModal()},'Fechar'));
  UI.abrirModal(t,{larga:true});
}
async function iniciar(){
  const nome=$('#nome').value.trim()||'Você'; const auto=$('#auto').checked;
  $('#intro').classList.add('oculto'); $('#jogo').classList.remove('oculto');
  UI.rapido=$('#rapido').checked;
  await novaPartida(nome,auto);
  await jogarPartida();
}
window.addEventListener('DOMContentLoaded',()=>{
  $('#btnIniciar').onclick=iniciar;
  $('#btnRegras').onclick=regrasModal; $('#btnRegras2').onclick=regrasModal;
  $('#chkRapido').onchange=e=>{ UI.rapido=e.target.checked; };
});
