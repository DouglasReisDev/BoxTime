# 🥊 Boxe Timer

Timer de rounds para treino de boxe, feito com **HTML, CSS e JavaScript puro** (sem bibliotecas).

## Funcionalidades

- Configuração do tempo do round, do descanso e do número de rounds
- Contagem de preparação antes do primeiro round
- Presets prontos (Treino 10×1, Boxe 3×3, Saco 12×3, HIIT 20/10)
- Aviso sonoro quando o round está acabando, quando termina e quando o descanso está acabando
- Vibração (em celulares compatíveis) e botão de mudo
- Pausar e continuar
- Tela fica ligada durante o treino
- Salva as configurações no navegador (localStorage)

## Estrutura

```
boxe-timer/
├── index.html   # estrutura da página
├── style.css    # estilos (tema escuro)
└── script.js    # lógica do timer
```

## Como usar

Abra o `index.html` no navegador. Não precisa instalar nada.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos
2. Vá em **Settings > Pages**
3. Em **Branch**, escolha `main` e a pasta `/ (root)`
4. Salve e aguarde o link do site aparecer

## O que estou praticando

- Manipulação do DOM (`getElementById`, `querySelector`, `classList`, `dataset`)
- Eventos (`click`, `pointerdown`)
- `setInterval` e cálculo de tempo com `Date.now()`
- Web Audio API (sons sem arquivos de áudio)
- `localStorage`
- Variáveis CSS, flexbox e SVG
