// ===================== DADOS DO JOGO — Torre dos Exilados =====================
// Tudo aqui vem do Regras_do_Jogo.md

const ANDARES = {
  1:{nome:'Portão da Saída',b:4}, 2:{nome:'Câmaras da Condenação',b:3}, 3:{nome:'Necrópole',b:3},
  4:{nome:'Forja Esquecida',b:2}, 5:{nome:'Jardim Apodrecido',b:2}, 6:{nome:'Catedral Sombria',b:1},
  7:{nome:'Biblioteca Esquecida',b:1}, 8:{nome:'Galeria dos Condenados',b:0}, 9:{nome:'Salão dos Ecos',b:0},
  10:{nome:'Cela do Exílio',b:0}
};

const CLASSES = {
  'Guardião':{prof:['curta','armadura','escudo'],cor:null,lim:2,txt:'Muralha: ao perder, descarte um escudo equipado para anular o castigo. +1 Poder com escudo.'},
  'Assassino':{prof:['curta','manto'],cor:null,lim:2,txt:'+1 Poder lutando sem ajuda. Olhar o Tesouro (descarte 2: veja o topo do baralho de Tesouros).'},
  'Mago':{prof:['magica','tunica'],cor:'Azul',lim:4,txt:'Limite de magias 4. Estudo (descarte 2: desvira 1 magia). Sobrecarga (descarte 1: +2 Poder, máx 2x).'},
  'Bruxo':{prof:['magica','tunica'],cor:'Preta',lim:3,txt:'Limite 3. Pacto de Sangue: sacrifique um Familiar para anular um castigo.'},
  'Caçador':{prof:['longa','manto'],cor:null,lim:2,txt:'+1 Poder contra Bestial e Alado. Rastrear (descarte 2: veja 3 do Explorar e mande 1 ao fundo).'},
  'Clérigo':{prof:['magica','tunica'],cor:'Branca',lim:3,txt:'Limite 3. Morto-vivo/Demônio/Fantasma têm −3 Poder contra você. Bênção: quem ajudar recebe +2.'},
  'Druida':{prof:['curta','manto'],cor:'Verde',lim:2,txt:'+1 Poder ao usar magia Verde. Ciclo (1x/turno, descarte 1: desvira 1 magia).'},
  'Guerreiro':{prof:['curta','longa','escudo','manto'],cor:null,lim:2,txt:'Investida: +1 Poder por arma equipada (máx +2).'}
};
const RACAS = {
  'Anão':'+1 Poder. −1 Poder contra [Alado].',
  'Orc':'Empate conta como vitória. +1 Poder lutando sem ajuda e sem magias.',
  'Elfo':'+1 limite de magias. 1x por andar, ao descer, desvira 1 magia.',
  'Tiefling':'Proficiência em magias Vermelhas. +1 Poder ao usar magia Vermelha.',
  'Halfling':'Limite de mão 7. Fuga não custa descarte. −2 Poder contra [Morto-vivo].',
  'Humano':'1x por andar, descarte 1 carta para fugir automaticamente de um monstro.'
};

// ---------------- MONSTROS ----------------
// [nome, poder, pe, tesouros, tipos, habilidades, castigo]
const pe=n=>({k:'pe',n}), dm=n=>({k:'descM',n}), vira=n=>({k:'vira',n});
const MONSTROS = [
 ['Rato da Torre',1,2,1,['Bestial'],{},[dm(1)]],
 ['Rato Pestilento',1,2,1,['Bestial'],{},[pe(1)]],
 ['Rato Gigante',2,2,1,['Bestial'],{},[{k:'pes'}]],
 ['Morcego Sanguíneo',2,2,1,['Bestial','Alado'],{longa:2},[pe(2)]],
 ['Morcego das Sombras',2,2,1,['Bestial','Alado'],{longa:2},[dm(1)]],
 ['Morcego Cego',3,2,1,['Bestial','Alado'],{longa:2},[vira(1)]],
 ['Esqueleto Sentinela',3,2,1,['Morto-vivo'],{},[{k:'cab'}]],
 ['Esqueleto Arqueiro',3,2,1,['Morto-vivo'],{},[pe(2)]],
 ['Esqueleto Carcereiro',4,2,1,['Morto-vivo'],{},[dm(1)]],
 ['Lodo Ácido',4,2,1,[],{noCurta:1},[{k:'tronco'}]],
 ['Lodo Cinzento',4,2,1,[],{noLonga:1},[{k:'pes'}]],
 ['Goblin Saqueador',4,2,2,[],{},[{k:'saq'}]],
 ['Goblin Batedor',4,2,2,[],{},[{k:'mochila'}]],
 ['Lobo Faminto',4,3,1,['Bestial'],{},[pe(1)]],
 ['Lobo Cinzento',4,3,1,['Bestial'],{},[dm(1)]],
 ['Aranha Tecelã',5,4,1,['Bestial'],{},[vira(2)]],
 ['Kobold Armadilheiro',5,4,2,[],{},[{k:'kobold'}]],
 ['Vigia Oco',5,3,1,['Constructo'],{rival:'Assassino'},[{k:'equip',n:1}]],
 ['Cão Infernal',6,4,2,['Demônio'],{imuneVermelha:1},[pe(4)]],
 ['Cão das Brasas',6,4,2,['Demônio'],{brancaMais:2},[pe(3),dm(1)]],
 ['Carniçal',6,4,2,['Morto-vivo'],{},[dm(2)]],
 ['Carniçal Faminto',6,4,2,['Morto-vivo'],{},[pe(4)]],
 ['Sentinela de Bronze',7,4,2,['Constructo'],{rival:'Caçador'},[pe(3)]],
 ['Armadura Animada',7,4,2,['Constructo'],{azulMais:2},[{k:'escTronco'}]],
 ['Sacerdotisa Vazia',8,5,2,['Fantasma'],{rival:'Bruxo'},[vira(1),pe(1)]],
 ['Espectro Lamentoso',8,4,2,['Fantasma','Morto-vivo'],{noCurta:1,noLonga:1},[{k:'viraT'}]],
 ['Espectro Chorão',8,4,2,['Fantasma','Morto-vivo'],{noMagica:1},[pe(4)]],
 ['Bruto das Profundezas',8,4,2,[],{anaoMais:2,rival:'Guardião'},[{k:'bruto'}]],
 ['Cultista Profano',8,5,2,[],{rival:'Clérigo'},[pe(4)]],
 ['Gárgula',9,6,2,['Constructo'],{foge6:1},[pe(6)]],
 ['Harpia',10,6,3,['Alado','Bestial'],{longa:3},[{k:'pes'}]],
 ['Mímico',10,6,3,[],{chaveMestra:3},[{k:'mimico'}]],
 ['Troll das Cavernas',11,6,3,[],{vermelhaMais:3},[pe(6),{k:'sobe'}]],
 ['Golem de Pedra',12,6,3,['Constructo'],{fugaAuto:1,rival:'Druida'},[{k:'golem'}]],
 ['Feiticeiro Caído',12,6,3,[],{noAzul:1,rival:'Mago'},[{k:'magEq'}]],
 ['Basilisco',13,8,3,['Bestial'],{},[{k:'turno'}]],
 ['Cavaleiro Sem Rosto',14,8,4,['Morto-vivo'],{guardGuerr:2},[pe(8),{k:'sobe'}]],
 ['Quimera',15,8,4,['Bestial','Alado'],{rival:'Guerreiro'},[{k:'equip',n:2}]],
 ['Lich do Andar Inferior',16,8,4,['Morto-vivo'],{clerigoMais:4},[pe(10),{k:'viraT'},{k:'sobe'}]],
 ['Wyvern',17,10,4,['Alado','Bestial'],{longa:2},[pe(10),{k:'sobe'}]],
 ['Devorador de Mentes',18,10,5,['Demônio'],{elfoMenos:3},[{k:'idRC'}]],
 ['Dragão Ancião',20,10,5,['Alado','Bestial'],{foge6:1},[pe(15),{k:'todosEq'},{k:'sobe'}]],
 ['Aranha de Pedra',3,2,1,['Bestial'],{},[dm(1)]],
 ['Enxame de Cinzas',5,3,2,[],{},[{k:'enxame'}]],
 ['Cão de Três Cabeças',7,4,2,['Bestial'],{},[pe(2),dm(1)]],
 ['Aracnídeo Alado',7,5,2,['Bestial','Alado'],{longa:2},[{k:'equip',n:1}]],
 ['Guardião do Umbral',12,9,3,['Fantasma'],{},[pe(3),{k:'equip',n:1,soEq:1}]],
 ['A Coisa sob a Escada',14,10,4,['Demônio'],{},[pe(4),{k:'equip',n:1}]]
];
const GUARDIOES = ['Guardião do Portão','Guardião da Chave','Guardião do Limiar','Guardião da Porta Final','Guardião das Correntes','Guardião Sem Nome'];

const MODS = [
 ['Elite Veterano',5,2,1],['Elite Blindado',5,2,1],['Elite Sanguinário',4,2,1],['Elite Ancestral',6,2,1],
 ['Enfurecido',3,1,0],['Frenético',3,1,0],['Possuído',0,0,0],['Filhote',-5,-2,-1],['Debilitado',-4,-1,0],['Reforços',10,4,2]
];
// [nome, (I), id]
const ARMADILHAS = [
 ['Piso Falso',0],['Piso Instável',0],['Fosso Oculto',0],['Lâminas Ocultas',0],['Dardos Envenenados',0],
 ['Névoa Entorpecente',1],['Runa do Silêncio',1],['Selo do Mutismo',1],['Véu da Surdez',1],['Ladrão nas Sombras',0],
 ['Gás do Esquecimento',1],['Desabamento',0],['Corrente de Ar',1],['Ácido Corrosivo',0],['Portal Reverso',1],
 ['Marca do Caçador',1],['Fios de Captura',0],['Maldição Arcana',1]
];
const ARM_TXT = {
 'Piso Falso':'Perca 3 PE.','Piso Instável':'Perca 3 PE.','Fosso Oculto':'Perca 4 PE.',
 'Lâminas Ocultas':'Perca 2 PE ou descarte sua arma de maior bônus.','Dardos Envenenados':'Perca 2 PE ou descarte o item de cabeça.',
 'Névoa Entorpecente':'Vire uma magia pronta; se não tiver, perca 2 PE.','Runa do Silêncio':'Vire todas as suas magias.',
 'Selo do Mutismo':'Vire todas as suas magias.','Véu da Surdez':'Vire todas as suas magias.',
 'Ladrão nas Sombras':'Descarte a carta da Mochila e 1 da mão.','Gás do Esquecimento':'Descarte sua Raça ou sua Classe.',
 'Desabamento':'Perca 5 PE e suba 1 andar.','Corrente de Ar':'Todos passam 1 carta da mão ao jogador da esquerda.',
 'Ácido Corrosivo':'Descarte seu item de tronco.','Portal Reverso':'Perca 3 PE e suba 1 andar.',
 'Marca do Caçador':'O próximo monstro que você enfrentar recebe +2 Poder.','Fios de Captura':'Não pode equipar nem trocar itens no próximo turno.',
 'Maldição Arcana':'Descarte 1 magia equipada.'
};
const BAUS = [['Baú de Bronze Velho',2],['Baú de Bronze Amassado',2],['Baú de Bronze Trancado',2],['Baú de Bronze Enferrujado',2],['Baú de Bronze Selado',2],
 ['Baú de Prata Gravado',3],['Baú de Prata Espelhado',3],['Baú de Prata Lacrado',3],['Baú de Ouro do Carcereiro',4],['Baú de Ouro da Rainha Exilada',4]];
const SAIDAS = [];
['Escadaria Antiga','Escadaria em Espiral','Escadaria Desabada','Escadaria de Mármore','Escadaria dos Penitentes','Escadaria Escura',
 'Passagem Secreta','Passagem Estreita','Passagem Úmida','Passagem do Carcereiro','Passagem Esquecida','Passagem Sussurrante',
 'Ponte sobre o Abismo','Ponte de Corda','Ponte de Ossos','Ponte Partida','Ponte de Cristal','Poço sem Fundo','Poço dos Desejos','Poço Seco','Poço Negro',
 'Elevador Antigo','Elevador de Correntes','Elevador Enferrujado','Elevador de Contrapeso'].forEach(n=>SAIDAS.push([n,'']));
['Atalho Vertical','Atalho Proibido','Atalho do Contrabandista','Atalho Íngreme'].forEach(n=>SAIDAS.push([n,'atalho']));
['Fenda na Parede','Fenda no Piso','Fenda Luminosa','Fenda Profunda','Fenda dos Gritos'].forEach(n=>SAIDAS.push([n,'fenda']));
const DESCANSOS = ['Fogueira Esquecida','Capela em Ruínas','Alcova Silenciosa','Santuário Quebrado','Cela Vazia','Oratório Apagado','Biblioteca Lacrada','Claustro','Fonte de Águas Pálidas','Salão do Sono'];
const EVENTOS = {
 'Mercador Errante':'Até o fim do turno, os itens valem o DOBRO de ouro na venda (abre o Mercado agora).',
 'Mercador Cego':'Até o fim do turno, os itens valem o DOBRO de ouro na venda (abre o Mercado agora).',
 'Ruínas Mapeadas':'Receba 1 Objetivo.','Mapa de Sangue':'Receba 1 Objetivo.',
 'Eco do Passado':'Procure no descarte de Tesouros uma Raça ou Classe e assuma-a.',
 'O Andar Muda':'Embaralhe o descarte do Explorar no baralho e compre 1 Tesouro.',
 'Presságio':'Na próxima vez que você revelar ou provocar um monstro (neste turno ou nos seguintes), ele recebe −2 Poder.','Visão do Fim':'Na próxima vez que você revelar ou provocar um monstro (neste turno ou nos seguintes), ele recebe −2 Poder.',
 'Porta Entreaberta':'Explore novamente, abrindo 2 cartas.',
 'Julgamento da Torre':'Quem tiver o item equipado de menor bônus compra 1 Tesouro; quem tiver o maior perde 2 PE.',
 'Chefe do Andar':'Enfrente o monstro mais forte entre as 3 do topo do Explorar. Vencendo, desça 1 andar.',
 'Sussurros do Exílio':'Ganhe 2 PE ou desvire 1 magia.',
 'Lembrança Súbita':'Compre 1 Tesouro; se for Raça ou Classe, assuma-a e ganhe 1 PE.'
};
const INVOCACOES = ['Invocação: Rastro de Sangue','Invocação: Chamado dos Mortos','Invocação: Fenda Sombria','Invocação: Ninho Aberto','Invocação: Eco Profano','Invocação: Marcha de Ferro','Invocação: Uivo Distante'];

// ---------------- TESOUROS ----------------
// arma: [nome, sub, poder, maos, ouro, esp]
const ARMAS = [
 ['Adaga Enferrujada','curta',1,1,50,{}],['Adaga de Ferro','curta',1,1,50,{}],['Espada Curta','curta',2,1,100,{}],['Espada de Vigília','curta',2,1,100,{}],
 ['Machadinha','curta',2,1,100,{}],['Maça de Ferro','curta',3,1,150,{vs:{'Morto-vivo':2}}],['Lâmina Gêmea','curta',3,1,200,{classe:{'Assassino':2}}],
 ['Adaga de Obsidiana','curta',3,1,250,{fuga:1}],['Martelo de Guerra','curta',4,2,200,{raca:{'Anão':2}}],['Montante','curta',5,2,300,{}],
 ['Funda','longa',1,1,50,{}],['Funda de Couro','longa',1,1,50,{}],['Dardos de Arremesso','longa',2,1,100,{}],['Arco Curto','longa',2,2,100,{}],
 ['Arco de Osso','longa',2,2,100,{}],['Besta','longa',3,2,150,{}],['Arco Longo','longa',4,2,200,{}],['Arco Élfico','longa',5,2,300,{raca:{'Elfo':1}}],
 ['Varinha de Aprendiz','magica',1,1,50,{}],['Varinha de Salgueiro','magica',1,1,50,{}],['Cajado de Carvalho','magica',3,2,150,{}],
 ['Orbe Sombria','magica',3,1,200,{classe:{'Bruxo':2}}],['Cetro Solar','magica',3,1,200,{classe:{'Clérigo':2}}],['Cajado do Arquimago','magica',5,2,300,{classe:{'Mago':2}}]
];
const ESCUDOS = [['Broquel',1,50,{}],['Broquel de Ferro',1,50,{}],['Escudo de Madeira',2,100,{}],['Escudo de Torre',3,150,{}],['Égide Rúnica',4,250,{imuneLaminas:1}]];
// tronco: [nome, sub, poder, ouro, esp]
const TRONCOS = [
 ['Couro Batido','armadura',1,50,{}],['Couro Fervido','armadura',1,50,{}],['Cota de Malha','armadura',2,100,{}],['Armadura de Placas','armadura',3,200,{}],
 ['Placas do Paladino Caído','armadura',4,300,{vs:{'Morto-vivo':2}}],['Manto de Viajante','manto',1,50,{}],['Manto de Peregrino','manto',1,50,{}],
 ['Manto Sombrio','manto',2,150,{fuga:1}],['Manto de Folhagem','manto',2,150,{classe:{'Druida':1}}],['Manto do Vento','manto',3,250,{}],
 ['Túnica de Linho','tunica',1,50,{}],['Túnica Bordada','tunica',2,100,{}],['Túnica Carmesim','tunica',3,200,{}],['Túnica Estelar','tunica',3,300,{lim:1}]
];
const CABPES = [
 ['Elmo Amassado','cabeca',1,50,{}],['Elmo de Couro','cabeca',1,50,{}],['Capuz do Explorador','cabeca',1,100,{capuz:1}],['Coroa Partida','cabeca',2,200,{}],
 ['Botas Gastas','pes',1,50,{}],['Botas de Couro','pes',1,50,{}],['Botas de Fuga','pes',0,150,{fuga:2}],['Grevas de Ferro','pes',2,150,{}]
];
const ACESSORIOS = [['Anel de Retorno',150,{anel:1},'1 vez por partida, descarte-o para ignorar uma Armadilha.'],['Amuleto da Torre',150,{amuleto:1},'Ao revelar uma Saída, olhe a próxima carta do Explorar.'],
 ['Grande Mochila',150,{mochila:3},'A Mochila guarda 3 cartas.'],['Foco Rúnico',250,{lim:1},'+1 limite de magias.']];
const GRIMORIOS = [['Grimório Rubro','Vermelha'],['Grimório Negro','Preta'],['Grimório Azul','Azul'],['Grimório Branco','Branca'],['Grimório Verde','Verde']];
// magia: [nome, cor, unica, id, txt]
const MAGIAS = [
 ['Bola de Fogo','Vermelha',1,'+6 Poder. ÚNICA.'],['Explosão','Vermelha',1,'Derrote automaticamente monstro de Poder total ≤ 6. ÚNICA.'],
 ['Lança de Fogo','Vermelha',0,'+3 Poder.'],['Fúria Infernal','Vermelha',0,'+2 Poder; se vencer, +1 Tesouro.'],['Muralha de Chamas','Vermelha',0,'(I) −4 Poder em um monstro.'],
 ['Mísseis Arcanos','Azul',0,'+4 Poder.'],['Seta Arcana','Azul',0,'+2 Poder.'],['Contramágica','Azul',0,'(I) Cancela 1 carta jogada contra você (inclusive Sono).'],
 ['Clarividência','Azul',0,'Fora de combate: veja as 3 do topo do Explorar e reordene.'],['Invisibilidade','Azul',0,'Fuga automática.'],
 ['Luz Sagrada','Branca',0,'+4 Poder (+8 contra Morto-vivo, Demônio, Fantasma).'],['Chama Sagrada','Branca',0,'+2 Poder (+5 contra Morto-vivo, Demônio, Fantasma).'],
 ['Escudo da Fé','Branca',0,'(I) Anule 1 castigo.'],['Bênção','Branca',0,'(I) +5 Poder a um jogador em combate.'],['Purificar','Branca',0,'(I) Anule 1 Armadilha.'],
 ['Pele de Casca','Verde',0,'+3 Poder.'],['Folhagem Protetora','Verde',0,'+2 Poder.'],['Vinhas','Verde',0,'(I) Monstro −3 Poder; fuga +2 neste combate.'],
 ['Chamado da Fera','Verde',0,'+6 Poder; descarte 1 carta da mão.'],['Passo Silvestre','Verde',0,'Ignore o bônus de andar do monstro.']
];
// familiar: [nome, pod, txtVirado, txtSacrificio]
const FAMILIARES = [
 ['Corvo Agourento',1,'Um monstro −3 Poder.','Um monstro −8 Poder.'],['Serpente Sombria',1,'+4 Poder neste combate.','+10 Poder neste combate.'],
 ['Gato Espectral',1,'Anule 1 Armadilha contra você.','Anule 1 castigo.'],['Sanguessuga Vil',1,'Se vencer, +2 PE.','Se vencer, +5 PE.'],
 ['Sombra Devoradora',2,'Se vencer, compre 1 Tesouro.','Pegue 1 carta aleatória da mão de um jogador.']
];
const CONSUMIVEIS = [
 ['Poção do Sono',2,100,'sono','(I) Item de Sono: um jogador perde o turno.'],['Poção de Força',3,50,'forca3','+3 Poder em combate.'],['Fogo Líquido',2,100,'forca5','+5 Poder em combate.'],
 ['Bomba de Fumaça',2,100,'fuga','Fuga automática.'],['Ferramentas de Desarme',2,100,'desarme','Anule 1 Armadilha.'],
 ['Pergaminho de Restauração',1,150,'resta','Desvire todas as suas magias.'],['Corda e Gancho',1,200,'corda','Desça 1 andar (não sai da torre).'],
 ['Elixir das Lembranças',1,150,'elixir','Olhe as 5 do topo dos Tesouros; pegue 1 Raça ou Classe.']
];
const ESPECIAIS = [['Ilusão de Saída',4,100,'ilusao','(I) Anula uma descida ou saída por Saída revelada.'],['Chave Mestra',1,100,'chave','Ao abrir um Baú, compre +1 Tesouro.'],
 ['Mapa Rasgado',1,100,'mapa','Receba 1 Objetivo.'],['Canção de Ninar',1,100,'sono','(I) Item de Sono: um jogador perde o turno.']];

// ---------------- OBJETIVOS ----------------
// on(p, e, o) -> true se completou.  e.t = tipo do evento
const cont=(t,n,f)=>(p,e,o)=>{ if(e.t===t&&(!f||f(e,p,o))){o.k=(o.k||0)+1; return o.k>=n;} return false; };
const OBJETIVOS = [
 {n:'Caçador de Feras',d:'Derrote 3 monstros.',pe:5,desce:1,on:cont('vit',3)},
 {n:'Purificador',d:'Derrote 2 monstros [Morto-vivo].',pe:5,desce:1,on:cont('vit',2,e=>e.mons.some(m=>m.tipos.includes('Morto-vivo')))},
 {n:'Matador de Gigantes',d:'Derrote um monstro de Poder 14 ou mais.',pe:8,desce:1,on:(p,e)=>e.t==='vit'&&e.poderMon>=14},
 {n:'Saqueador',d:'Tenha itens equipados somando 500 de ouro.',pe:6,on:(p,e)=>e.t==='chk'&&ouroEquipado(p)>=500},
 {n:'Arcanista',d:'Use 3 magias num mesmo combate.',pe:5,on:(p,e)=>e.t==='fimCombate'&&e.magias>=3},
 {n:'Por Conta Própria',d:'Derrote monstro de Poder 10+ sem ajuda e sem magias.',pe:6,desce:1,on:(p,e)=>e.t==='vit'&&e.poderMon>=10&&!e.ajudado&&e.magias===0},
 {n:'Explorador',d:'Desça 3 andares.',pe:5,on:cont('desce',3)},
 {n:'Descanso Merecido',d:'Revele 2 Pontos de Descanso.',pe:4,on:cont('descanso',2)},
 {n:'Aliado',d:'Ajude em 2 combates vencidos.',pe:5,desce:1,on:cont('ajuda',2)},
 {n:'Sobrevivente',d:'Fuja com sucesso de 2 monstros.',pe:4,on:cont('fuga',2)},
 {n:'Armeiro',d:'Tenha mãos, tronco, cabeça e pés equipados.',pe:5,on:(p,e)=>e.t==='chk'&&p.equip.maos.length>0&&p.equip.tronco&&p.equip.cabeca&&p.equip.pes},
 {n:'Abridor de Baús',d:'Abra 2 Baús.',pe:4,on:cont('bau',2)},
 {n:'Desarmador',d:'Anule 1 Armadilha.',pe:3,on:cont('trapAnula',1)},
 {n:'Mestre do Grimório',d:'Limite de magias completo e todas em pé.',pe:4,on:(p,e)=>e.t==='chk'&&p.magias.length>0&&p.magias.length>=limiteMagias(p)&&p.magias.every(m=>!m.virada)},
 {n:'Contra Tudo',d:'Vença um combate em que outro jogador jogou carta contra você.',pe:5,desce:1,on:(p,e)=>e.t==='vit'&&e.interf},
 {n:'Mercador',d:'Venda itens somando 250 de ouro de uma só vez.',pe:4,on:(p,e)=>e.t==='venda'&&e.ouro>=250},
 {n:'Colecionador',d:'Tenha magias de 2 cores equipadas.',pe:4,on:(p,e)=>e.t==='chk'&&new Set(p.magias.map(m=>m.cor)).size>=2},
 {n:'Coração da Torre',d:'Vença um combate contra 2 monstros ao mesmo tempo.',pe:10,on:(p,e)=>e.t==='vit'&&e.mons.length>=2},
 {n:'Primeiro Sangue',d:'Derrote 1 monstro.',pe:3,on:cont('vit',1)},
 {n:'Caçador Persistente',d:'Derrote 2 monstros em turnos diferentes.',pe:4,on:(p,e,o)=>{ if(e.t!=='vit')return false; o.ts=o.ts||[]; if(!o.ts.includes(e.turno))o.ts.push(e.turno); return o.ts.length>=2; }},
 {n:'Cartógrafo',d:'Revele 3 cartas de Saída.',pe:5,on:cont('saida',3)},
 {n:'Sobrevivente das Armadilhas',d:'Sobreviva a 2 Armadilhas.',pe:4,on:cont('trap',2)},
 {n:'Estudioso do Véu',d:'Use 2 magias diferentes.',pe:4,on:(p,e,o)=>{ if(e.t!=='magia')return false; o.ms=o.ms||[]; if(!o.ms.includes(e.nome))o.ms.push(e.nome); return o.ms.length>=2; }},
 {n:'Sem Recuo',d:'Derrote um monstro de Poder 8 ou mais sem usar magias nem consumíveis.',pe:6,desce:1,on:(p,e)=>e.t==='vit'&&e.magias===0&&!e.consum&&e.poderMon>=8},
 {n:'Explorador Metódico',d:'Explore 5 vezes.',pe:3,t:1,on:cont('explorar',5)},
 {n:'Arrependimento',d:'Descarte uma Raça ou Classe e assuma outra.',pe:5,on:cont('trocaId',1)},
 {n:'Redenção',d:'Ajude 2 jogadores diferentes em combates vencidos.',pe:6,desce:1,on:(p,e,o)=>{ if(e.t!=='ajuda')return false; o.js=o.js||[]; if(!o.js.includes(e.quem))o.js.push(e.quem); return o.js.length>=2; }},
 {n:'Cobrador',d:'Vença um combate em que outro jogador jogou Armadilha em você.',pe:5,on:(p,e)=>e.t==='vit'&&e.trapInterf},
 {n:'Conhece-te a Ti Mesmo',d:'Tenha Raça e Classe ao mesmo tempo.',pe:5,on:(p,e)=>e.t==='chk'&&p.raca&&p.classe},
 {n:'Penhor da Torre',d:'Compre 2 Tesouros com ouro no mesmo turno.',pe:4,desce:1,on:(p,e)=>e.t==='compraOuro'&&e.n>=2}
];

// Progresso exibido no painel: (p, st) -> [atual, meta, unidade?]. st = estado interno do objetivo (o.st).
// Objetivos de "um só evento" mostram 0/1 até serem cumpridos.
const K=(n)=>(p,s)=>[Math.min(s.k||0,n),n];
const UM=()=>[0,1];
const OBJ_PROG = {
 'Caçador de Feras':K(3),'Purificador':K(2),'Matador de Gigantes':UM,
 'Saqueador':p=>[Math.min(ouroEquipado(p),500),500,' ouro'],
 'Arcanista':UM,'Por Conta Própria':UM,'Explorador':K(3),'Descanso Merecido':K(2),'Aliado':K(2),'Sobrevivente':K(2),
 'Armeiro':p=>[(p.equip.maos.length>0?1:0)+(p.equip.tronco?1:0)+(p.equip.cabeca?1:0)+(p.equip.pes?1:0),4,' slots'],
 'Abridor de Baús':K(2),'Desarmador':K(1),
 'Mestre do Grimório':p=>[p.magias.filter(m=>!m.virada).length,Math.max(1,limiteMagias(p)),' magias em pé'],
 'Contra Tudo':UM,'Mercador':UM,
 'Colecionador':p=>[Math.min(2,new Set(p.magias.map(m=>m.cor)).size),2,' cores'],
 'Coração da Torre':UM,'Primeiro Sangue':K(1),
 'Caçador Persistente':(p,s)=>[Math.min((s.ts||[]).length,2),2],
 'Cartógrafo':K(3),'Sobrevivente das Armadilhas':K(2),
 'Estudioso do Véu':(p,s)=>[Math.min((s.ms||[]).length,2),2],
 'Sem Recuo':UM,'Explorador Metódico':K(5),'Arrependimento':K(1),
 'Redenção':(p,s)=>[Math.min((s.js||[]).length,2),2],
 'Cobrador':UM,
 'Conhece-te a Ti Mesmo':p=>[(p.raca?1:0)+(p.classe?1:0),2],
 'Penhor da Torre':p=>[Math.min(p.compraOuroTurno||0,2),2,' compras (neste turno)']
};
function progObjetivo(p,o){
  const d=OBJETIVOS[o.c.idx], f=OBJ_PROG[d.n]; if(!f) return null;
  try{ return f(p,o.st||{}); }catch(e){ return null; }
}

// ---------------- CONSTRUÇÃO DOS BARALHOS ----------------
let _uid = 1;
function carta(base){ const c = Object.assign({uid:_uid++}, base); if (typeof IMAGENS!=='undefined' && IMAGENS[c.nome]) c.img='img/'+IMAGENS[c.nome]; return c; }

function baralhoExplorar(nJog){
  const d = [];
  MONSTROS.forEach(m=>d.push(carta({deck:'E',tipo:'monstro',nome:m[0],poder:m[1],pe:m[2],t:m[3],tipos:m[4],hab:m[5],castigo:m[6]})));
  MODS.forEach(m=>d.push(carta({deck:'E',tipo:'mod',nome:m[0],mp:m[1],mpe:m[2],mt:m[3],I:1})));
  ARMADILHAS.forEach(a=>d.push(carta({deck:'E',tipo:'armadilha',nome:a[0],I:a[1],txt:ARM_TXT[a[0]]})));
  BAUS.forEach(b=>d.push(carta({deck:'E',tipo:'bau',nome:b[0],n:b[1]})));
  SAIDAS.forEach(s=>d.push(carta({deck:'E',tipo:'saida',nome:s[0],sub:s[1]})));
  DESCANSOS.forEach(n=>d.push(carta({deck:'E',tipo:'descanso',nome:n})));
  Object.keys(EVENTOS).forEach(n=>d.push(carta({deck:'E',tipo:'evento',nome:n,txt:EVENTOS[n]})));
  INVOCACOES.forEach(n=>d.push(carta({deck:'E',tipo:'invocacao',nome:n,I:1})));
  for(let i=0;i<nJog;i++) d.push(carta({deck:'E',tipo:'monstro',guardiao:1,nome:GUARDIOES[i],poder:20,pe:12,t:5,tipos:[],hab:{},castigo:[pe(12),{k:'maoAte1'}]}));
  return d;
}
function baralhoTesouro(){
  const d = [];
  const T = o=>d.push(carta(Object.assign({deck:'T'},o)));
  ARMAS.forEach(a=>T({tipo:'arma',nome:a[0],sub:a[1],poder:a[2],maos:a[3],ouro:a[4],esp:a[5]}));
  ESCUDOS.forEach(a=>T({tipo:'escudo',nome:a[0],sub:'escudo',poder:a[1],ouro:a[2],esp:a[3]}));
  TRONCOS.forEach(a=>T({tipo:'tronco',nome:a[0],sub:a[1],poder:a[2],ouro:a[3],esp:a[4]}));
  CABPES.forEach(a=>T({tipo:a[1],nome:a[0],sub:a[1],poder:a[2],ouro:a[3],esp:a[4]}));
  ACESSORIOS.forEach(a=>T({tipo:'acc',nome:a[0],sub:'acc',poder:0,ouro:a[1],esp:a[2],txt:a[3]}));
  GRIMORIOS.forEach(a=>T({tipo:'grimorio',nome:a[0],cor:a[1],ouro:400,maos:1}));
  MAGIAS.forEach(a=>T({tipo:'magia',nome:a[0],cor:a[1],unica:a[2],txt:a[3],ouro:150}));
  FAMILIARES.forEach(a=>T({tipo:'magia',fam:1,nome:a[0],cor:'Preta',pod:a[1],vir:a[2],sac:a[3],ouro:150,txt:'Em pé: +'+a[1]+' Poder. Virado: '+a[2]+' Sacrificar: '+a[3]}));
  CONSUMIVEIS.forEach(a=>{ for(let i=0;i<a[1];i++) T({tipo:'consumivel',nome:a[0],ouro:a[2],ef:a[3],txt:a[4],I:a[3]==='sono'}); });
  ESPECIAIS.forEach(a=>{ for(let i=0;i<a[1];i++) T({tipo:'especial',nome:a[0],ouro:a[2],ef:a[3],txt:a[4],I:a[3]==='ilusao'||a[3]==='sono'}); });
  Object.keys(RACAS).forEach(n=>{ for(let i=0;i<3;i++) T({tipo:'raca',nome:n,txt:RACAS[n],ouro:100}); });
  Object.keys(CLASSES).forEach(n=>{ for(let i=0;i<2;i++) T({tipo:'classe',nome:n,txt:CLASSES[n].txt,ouro:100}); });
  return d;
}
function baralhoObjetivos(){ return OBJETIVOS.map((o,i)=>carta({deck:'O',tipo:'objetivo',nome:o.n,txt:o.d,idx:i})); }
