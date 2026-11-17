# Torre dos Exilados — versão online (solo)

Jogo de tabuleiro digital, **100% estático** (HTML + JS + imagens). Não precisa de servidor, banco externo nem build:
basta publicar esta pasta inteira em qualquer hospedagem de sites estáticos.

Modo atual: **solo** (você contra 2 NPCs). Multiplayer ficou para uma etapa futura.

## Estrutura

| Pasta / arquivo | O que é |
|---|---|
| `index.html` | O jogo (abra este arquivo / é a página inicial do site) |
| `cartas.html` | Catálogo de todas as cartas (também usado para ajustar as imagens) |
| `dados/dados.js` | **Base de dados do jogo**: cartas, monstros, magias, objetivos, andares, eventos, etc. |
| `motor/motor_a.js` `motor_b.js` `motor_c.js` | **Motor** (regras): poder/equipamento, combate/castigos/fuga, turnos/exploração/IA dos NPCs |
| `motor/ui.js` | Interface: telas, log, cenas, painéis |
| `img/` | **Base de imagens** das cartas |
| `img/imagens.js` | Mapa `"Nome da carta": "arquivo.png"` |
| `img/ajustes.js` | Posição/zoom de cada imagem na carta (gerado pelo `cartas.html`) |
| `docs/Regras_do_Jogo.md` | Regras completas |

## Como publicar (escolha uma)

- **Netlify** (mais fácil): acesse app.netlify.com/drop e arraste esta pasta. O arquivo `_headers` já configura o cache.
- **GitHub Pages**: crie um repositório, envie o conteúdo desta pasta, e em *Settings → Pages* escolha a branch `main`, pasta `/ (root)`. O arquivo `.nojekyll` já está incluso.
- **Vercel / Cloudflare Pages**: importe a pasta/repositório; sem comando de build, diretório de saída = raiz.
- **Hospedagem comum (FTP)**: envie todo o conteúdo para `public_html` (ou a pasta do site).

Para testar localmente: dê dois cliques em `index.html` ou rode `python -m http.server 8000` nesta pasta e abra http://localhost:8000.

## Como adicionar imagens (aos poucos)

1. Salve a imagem em `img/` (png, jpg ou webp; proporção ideal 58×35 mm, cerca de 1740×1050 px).
2. Em `img/imagens.js`, confira/edite a linha da carta: `"Orc": "orc.png",`. Já existe um nome sugerido para cada carta.
3. Cartas sem imagem mostram o ícone padrão, então dá para publicar com o que já existe.
4. Para ajustar enquadramento: abra `cartas.html`, use *Ajustar imagens*, depois *Exportar ajustes* e salve o `ajustes.js` baixado em `img/`.

**Dica de desempenho:** as imagens atuais somam ~46 MB. Antes de divulgar muito, converta para `.webp` (ou reduza para ~900 px de largura) e atualize os nomes em `imagens.js`: o jogo carrega bem mais rápido.

## Como alterar regras e cartas

- Números e textos de cartas, monstros, objetivos: `dados/dados.js`.
- Lógica das regras (combate, fuga, castigos, descida, Mercado): `motor/`.
- Depois de editar, publique de novo (e force F5 / Ctrl+F5 no navegador).

## Regras de destaque desta versão

- Troca por ouro só pelo valor das cartas (200 = 1 Tesouro, 400 = descer 1 andar, sem mínimo de cartas); o **Mercador (Errante/Cego)** dobra o ouro da venda no turno.
- Fugir sem lutar é possível no início do combate (vai direto ao teste de fuga).
- Cenas de apresentação das ações dos jogadores, com pausa e continuar.

## Atenção a maiúsculas/minúsculas
A maioria das hospedagens (Linux) diferencia `Harpia.png` de `harpia.png`. Mantenha os nomes dos arquivos em `img/` **exatamente** iguais aos de `img/imagens.js` (de preferência tudo em minúsculas).
