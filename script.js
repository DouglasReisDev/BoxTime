/* ==========================================================
   BOXE TIMER - JAVASCRIPT
   Timer de rounds para treino de boxe.

   O código está dividido em partes:
   1. Configuração (valores e localStorage)
   2. Tela de configuração (botões + e −, presets)
   3. Som e vibração
   4. Treino (fases, relógio, pausar, parar)
   ========================================================== */


/* ==========================================================
   1. CONFIGURAÇÃO
   ========================================================== */

// Objeto com os valores que o usuário pode mudar.
// Todos os tempos são guardados em SEGUNDOS.
var config = {
  prep: 10,        // contagem antes do round 1
  round: 60,       // duração de cada round
  descanso: 40,    // duração do descanso
  rounds: 10,      // quantidade de rounds
  aviso: 10,       // quantos segundos antes do fim do round toca o aviso
  som: true,       // som ligado?
  vibracao: true   // vibração ligada?
};

// Limites de cada campo: quanto muda a cada clique, mínimo e máximo
var limites = {
  prep:     { passo: 5,  min: 0,  max: 30 },
  round:    { passo: 15, min: 10, max: 600 },
  descanso: { passo: 5,  min: 0,  max: 300 },
  rounds:   { passo: 1,  min: 1,  max: 50 },
  aviso:    { passo: 5,  min: 0,  max: 60 }
};

// Pega os elementos do HTML uma vez só e guarda em variáveis.
// Assim não precisamos procurar no HTML toda hora.
var telaConfig = document.getElementById("tela-config");
var telaTreino = document.getElementById("tela-treino");
var btnSom = document.getElementById("btn-som");
var btnVibracao = document.getElementById("btn-vibracao");
var elTotal = document.getElementById("total");
var elDetalhes = document.getElementById("detalhes");
var btnIniciar = document.getElementById("btn-iniciar");
var elFase = document.getElementById("fase");
var elRelogio = document.getElementById("relogio");
var elArco = document.getElementById("arco");
var elBolinhas = document.getElementById("bolinhas");
var elLegenda = document.getElementById("legenda");
var btnPausar = document.getElementById("btn-pausar");
var btnParar = document.getElementById("btn-parar");

// Tenta carregar a configuração salva da última vez.
// localStorage guarda dados no navegador, mesmo depois de fechar a página.
// Usamos try/catch porque o localStorage pode estar bloqueado em alguns casos.
try {
  var salvo = localStorage.getItem("boxeTimerConfig");
  if (salvo) {
    // JSON.parse transforma o texto salvo de volta em objeto
    var configSalva = JSON.parse(salvo);
    // Copia cada valor salvo para dentro do objeto config
    for (var chave in configSalva) {
      config[chave] = configSalva[chave];
    }
  }
} catch (erro) {
  console.log("Não foi possível carregar a configuração:", erro);
}

// Salva a configuração no navegador
function salvarConfig() {
  try {
    // JSON.stringify transforma o objeto em texto (localStorage só guarda texto)
    localStorage.setItem("boxeTimerConfig", JSON.stringify(config));
  } catch (erro) {
    console.log("Não foi possível salvar a configuração:", erro);
  }
}

// Converte segundos para o formato "MM:SS". Exemplo: 75 vira "01:15"
function formatarTempo(segundos) {
  var minutos = Math.floor(segundos / 60);   // Math.floor arredonda para baixo
  var resto = segundos % 60;                 // % devolve o resto da divisão
  // padStart(2, "0") completa com zero à esquerda: "5" vira "05"
  return String(minutos).padStart(2, "0") + ":" + String(resto).padStart(2, "0");
}

// Calcula a duração total do treino (sem contar a preparação).
// Não há descanso depois do último round, por isso (rounds - 1).
function calcularTotal() {
  return config.rounds * config.round + (config.rounds - 1) * config.descanso;
}


/* ==========================================================
   2. TELA DE CONFIGURAÇÃO
   ========================================================== */

// Atualiza tudo que aparece na tela de configuração
function atualizarTela() {
  // Mostra cada valor no seu lugar
  document.getElementById("valor-prep").textContent = formatarTempo(config.prep);
  document.getElementById("valor-round").textContent = formatarTempo(config.round);
  document.getElementById("valor-descanso").textContent = formatarTempo(config.descanso);
  document.getElementById("valor-rounds").textContent = config.rounds; // não é tempo, então não formata
  document.getElementById("valor-aviso").textContent = formatarTempo(config.aviso);

  // Resumo do treino
  elTotal.textContent = formatarTempo(calcularTotal());
  elDetalhes.textContent =
    config.rounds + " rounds · " +
    formatarTempo(config.round) + " de luta · " +
    formatarTempo(config.descanso) + " de descanso";

  // classList.toggle("ligado", condicao): adiciona a classe se a condição for true
  // e remove se for false
  btnSom.classList.toggle("ligado", config.som);
  btnVibracao.classList.toggle("ligado", config.vibracao);

  // Marca como "ativo" o preset que tem os mesmos valores da configuração atual
  var presets = document.querySelectorAll(".preset");
  for (var i = 0; i < presets.length; i++) {
    var p = presets[i];
    // dataset lê os atributos data-* do HTML. Vêm como texto, então usamos Number()
    var igual =
      Number(p.dataset.round) === config.round &&
      Number(p.dataset.descanso) === config.descanso &&
      Number(p.dataset.rounds) === config.rounds;
    p.classList.toggle("ativo", igual);
  }

  salvarConfig();
}

// Aumenta ou diminui um campo. direcao é 1 (aumenta) ou -1 (diminui)
function alterarValor(campo, direcao) {
  var limite = limites[campo];
  var novoValor = config[campo] + direcao * limite.passo;

  // Garante que o valor fique entre o mínimo e o máximo
  if (novoValor < limite.min) {
    novoValor = limite.min;
  }
  if (novoValor > limite.max) {
    novoValor = limite.max;
  }

  config[campo] = novoValor;
  atualizarTela();
}

// ----- Botões + e − (com repetição ao segurar) -----
var temporizadorSegurar = null; // guarda o setInterval do "segurar"

var botoesPasso = document.querySelectorAll(".btn-passo");

for (var i = 0; i < botoesPasso.length; i++) {
  configurarBotaoPasso(botoesPasso[i]);
}

// Esta função existe para cada botão ter suas próprias variáveis
// (em loops com "var" isso evita um bug clássico de closure)
function configurarBotaoPasso(botao) {
  var campo = botao.dataset.campo;
  var direcao = Number(botao.dataset.direcao);

  // Quando o dedo toca no botão
  botao.addEventListener("pointerdown", function () {
    alterarValor(campo, direcao); // muda uma vez logo de cara

    var repeticoes = 0;
    // Depois de alguns instantes segurando, começa a repetir rápido
    temporizadorSegurar = setInterval(function () {
      repeticoes++;
      if (repeticoes > 4) {
        alterarValor(campo, direcao);
      }
    }, 110);
  });

  // Quando o dedo sai do botão (soltou, arrastou pra fora ou cancelou), para de repetir
  var parar = function () {
    clearInterval(temporizadorSegurar);
  };
  botao.addEventListener("pointerup", parar);
  botao.addEventListener("pointerleave", parar);
  botao.addEventListener("pointercancel", parar);
}

// ----- Presets -----
var botoesPreset = document.querySelectorAll(".preset");

for (var j = 0; j < botoesPreset.length; j++) {
  botoesPreset[j].addEventListener("click", function () {
    // "this" é o botão que foi clicado
    config.round = Number(this.dataset.round);
    config.descanso = Number(this.dataset.descanso);
    config.rounds = Number(this.dataset.rounds);
    atualizarTela();
  });
}

// ----- Botões de som e vibração -----
btnSom.addEventListener("click", function () {
  config.som = !config.som; // o "!" inverte: true vira false e vice-versa
  atualizarTela();
});

btnVibracao.addEventListener("click", function () {
  config.vibracao = !config.vibracao;
  atualizarTela();

  // Dá uma vibradinha de teste ao ligar (só funciona em alguns celulares)
  if (config.vibracao && navigator.vibrate) {
    navigator.vibrate(80);
  }
});

// Mostra os valores na tela assim que a página abre
atualizarTela();


/* ==========================================================
   3. SOM E VIBRAÇÃO
   Os sons são criados pelo próprio navegador (Web Audio API),
   por isso não precisamos de arquivos .mp3.
   ========================================================== */

// O AudioContext é o "estúdio" que produz o som.
// Só criamos depois do clique em "Iniciar", porque os navegadores
// bloqueiam áudio antes de o usuário interagir com a página.
var audio = null;

// Toca uma nota.
// frequencia: Hz (maior = mais agudo) | atraso: segundos até começar
// duracao: segundos | tipo: formato da onda | volume: de 0 a 1
function tocarTom(frequencia, atraso, duracao, tipo, volume) {
  // Se o som está desligado ou o áudio ainda não existe, não faz nada
  if (!config.som || !audio) {
    return;
  }

  var oscilador = audio.createOscillator(); // gera a onda sonora
  var ganho = audio.createGain();           // controla o volume

  oscilador.type = tipo;
  oscilador.frequency.value = frequencia;

  // Liga: oscilador -> volume -> alto-falante
  oscilador.connect(ganho);
  ganho.connect(audio.destination);

  var inicio = audio.currentTime + atraso;

  // O volume sobe rápido e depois cai aos poucos (evita "estalos" no som)
  ganho.gain.setValueAtTime(0, inicio);
  ganho.gain.linearRampToValueAtTime(volume, inicio + 0.01);
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);

  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.05);
}

// Som de sino (como o gongo do ringue). Mistura 3 notas.
function tocarSino(vezes) {
  for (var i = 0; i < vezes; i++) {
    var atraso = i * 0.7; // cada batida do sino começa 0,7s depois da anterior
    tocarTom(880, atraso, 1.2, "sine", 0.5);
    tocarTom(1760, atraso, 0.9, "sine", 0.25);
    tocarTom(2640, atraso, 0.5, "sine", 0.12);
  }
}

// Bipe curto, usado nos avisos
function tocarBip(vezes, frequencia) {
  for (var i = 0; i < vezes; i++) {
    tocarTom(frequencia, i * 0.18, 0.12, "square", 0.25);
  }
}

// Vibra o celular. "padrao" pode ser um número (ms) ou uma lista [vibra, pausa, vibra...]
function vibrar(padrao) {
  // Só vibra se estiver ligado E se o aparelho/navegador suportar
  if (config.vibracao && navigator.vibrate) {
    navigator.vibrate(padrao);
  }
}


/* ==========================================================
   4. TREINO
   ========================================================== */

// Comprimento do círculo do relógio (2 x pi x raio, com raio = 130)
var CIRCUNFERENCIA = 816.8;

// Variáveis que guardam o estado do treino
var fases = [];            // lista de fases: preparação, round, descanso, round...
var indiceFase = 0;        // em qual fase estamos agora (posição na lista)
var fimDaFase = 0;         // momento (em milissegundos) em que a fase atual termina
var ultimoSegundo = null;  // último segundo mostrado (para tocar avisos só uma vez)
var pausado = false;       // o treino está pausado?
var restantePausado = 0;   // quanto tempo faltava quando pausou
var intervalo = null;      // guarda o setInterval do relógio
var wakeLock = null;       // impede a tela de apagar durante o treino

// Monta a lista de fases com base na configuração.
// Exemplo com 2 rounds: [preparação, round 1, descanso, round 2]
function montarFases() {
  fases = [];

  if (config.prep > 0) {
    fases.push({ tipo: "preparacao", duracao: config.prep });
  }

  for (var i = 1; i <= config.rounds; i++) {
    fases.push({ tipo: "round", numero: i, duracao: config.round });

    // Descanso entre os rounds (não existe depois do último)
    if (i < config.rounds && config.descanso > 0) {
      fases.push({ tipo: "descanso", numero: i, duracao: config.descanso });
    }
  }
}

// Desenha as bolinhas de progresso.
// roundAtual: número do round em andamento (0 = ainda na preparação)
function desenharBolinhas(roundAtual) {
  elBolinhas.innerHTML = ""; // limpa as bolinhas antigas

  // Com muitos rounds as bolinhas ficariam apertadas, então não mostramos
  if (config.rounds > 20) {
    return;
  }

  for (var i = 1; i <= config.rounds; i++) {
    var bolinha = document.createElement("i"); // cria um elemento <i>

    if (i < roundAtual) {
      bolinha.classList.add("feito");   // rounds já terminados
    }
    if (i === roundAtual) {
      bolinha.classList.add("atual");   // round em andamento
    }

    elBolinhas.appendChild(bolinha); // coloca a bolinha dentro do container
  }
}

// Começa a fase atual (a que está em fases[indiceFase])
function comecarFase() {
  var fase = fases[indiceFase];
  var proxima = fases[indiceFase + 1]; // pode ser undefined se for a última

  // Date.now() é o horário atual em milissegundos.
  // Somamos a duração da fase para saber quando ela termina.
  fimDaFase = Date.now() + fase.duracao * 1000;
  ultimoSegundo = null;

  // Troca a cor da tela e tira o amarelo do aviso
  telaTreino.dataset.fase = fase.tipo;
  telaTreino.classList.remove("aviso");

  if (fase.tipo === "preparacao") {
    elFase.textContent = "PREPARAR";
    elLegenda.textContent = "O round 1 começa em " + formatarTempo(fase.duracao);
    desenharBolinhas(0);

  } else if (fase.tipo === "round") {
    elFase.textContent = "ROUND " + fase.numero + "/" + config.rounds;

    if (proxima) {
      elLegenda.textContent = "Próximo: descanso de " + formatarTempo(config.descanso);
    } else {
      elLegenda.textContent = "Último round, vai até o fim!";
    }

    desenharBolinhas(fase.numero);
    tocarSino(1);   // sino de início do round
    vibrar(200);

  } else {
    // descanso
    elFase.textContent = "DESCANSO";
    elLegenda.textContent = "Próximo: round " + (fase.numero + 1);
    desenharBolinhas(fase.numero + 1);
  }
}

// Esta função roda várias vezes por segundo e atualiza o relógio.
function atualizarRelogio() {
  // Se estiver pausado, não faz nada
  if (pausado) {
    return;
  }

  var fase = fases[indiceFase];

  // Quanto falta (em ms). Math.max garante que nunca fique negativo.
  var restanteMs = Math.max(0, fimDaFase - Date.now());
  // Math.ceil arredonda para cima: 59,2s aparece como 60s, como num cronômetro de verdade
  var segundos = Math.ceil(restanteMs / 1000);

  elRelogio.textContent = formatarTempo(segundos);

  // Anima o círculo: quanto menos tempo, mais "vazio" ele fica
  var fracaoPassada = 1 - restanteMs / (fase.duracao * 1000);
  elArco.style.strokeDashoffset = CIRCUNFERENCIA * fracaoPassada;

  // Só entra aqui quando o segundo muda (assim o bipe toca uma vez só por segundo)
  if (segundos !== ultimoSegundo) {
    ultimoSegundo = segundos;

    // AVISO: round quase acabando
    if (
      fase.tipo === "round" &&
      config.aviso > 0 &&
      config.aviso < fase.duracao &&
      segundos === config.aviso
    ) {
      tocarBip(2, 1200);
      vibrar([120, 80, 120]);
      telaTreino.classList.add("aviso"); // deixa a tela amarela
    }

    // AVISO: descanso ou preparação quase acabando (3, 2 e 1 segundos)
    if ((fase.tipo === "descanso" || fase.tipo === "preparacao") && segundos <= 3 && segundos > 0) {
      tocarBip(1, 800);
      vibrar(60);
    }

    // AVISO extra: 5 segundos antes do fim do descanso
    if (fase.tipo === "descanso" && segundos === 5 && fase.duracao > 5) {
      tocarBip(2, 800);
    }
  }

  // A fase terminou?
  if (restanteMs <= 0) {
    if (fase.tipo === "round") {
      // Sino de fim de round (3 batidas se for o último)
      var ehUltima = indiceFase === fases.length - 1;
      tocarSino(ehUltima ? 3 : 2);
      vibrar([300, 100, 300]);
    }

    indiceFase++; // vai para a próxima fase

    if (indiceFase >= fases.length) {
      finalizarTreino(); // acabaram as fases
    } else {
      comecarFase();
    }
  }
}

// Chamada quando todas as fases terminam
function finalizarTreino() {
  clearInterval(intervalo); // para o relógio

  telaTreino.dataset.fase = "fim";
  telaTreino.classList.remove("aviso");
  elFase.textContent = "TREINO CONCLUÍDO";
  elRelogio.textContent = "🥊";
  elLegenda.textContent = config.rounds + " rounds em " + formatarTempo(calcularTotal()) + ". Bom trabalho!";
  elArco.style.strokeDashoffset = 0;
  desenharBolinhas(config.rounds + 1); // todas as bolinhas ficam preenchidas

  btnPausar.classList.add("escondido");
  btnParar.textContent = "Voltar";

  liberarTela();
}

// ----- Manter a tela ligada durante o treino -----
// async/await: "wakeLock.request" demora um pouquinho, então esperamos o resultado
async function manterTelaLigada() {
  try {
    if (navigator.wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (erro) {
    // Se o navegador não deixar, o treino continua normalmente
    console.log("Wake Lock indisponível:", erro);
  }
}

function liberarTela() {
  try {
    if (wakeLock) {
      wakeLock.release();
    }
  } catch (erro) {
    console.log(erro);
  }
  wakeLock = null;
}

// O navegador solta o wake lock quando você sai da aba. Ao voltar, pedimos de novo.
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && intervalo && !pausado) {
    manterTelaLigada();
  }
});

// ----- Botão INICIAR -----
btnIniciar.addEventListener("click", function () {
  // Cria o áudio agora (depois do clique, como os navegadores exigem)
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Alguns navegadores deixam o áudio "suspenso" até o usuário interagir
  if (audio.state === "suspended") {
    audio.resume();
  }

  montarFases();
  indiceFase = 0;
  pausado = false;

  // Troca de tela: esconde a configuração e mostra o treino
  telaConfig.classList.add("escondido");
  telaTreino.classList.remove("escondido");

  // Deixa os botões no estado inicial
  btnPausar.classList.remove("escondido");
  btnPausar.textContent = "Pausar";
  btnParar.textContent = "Parar";

  comecarFase();

  // Garante que não existe outro relógio rodando e cria um novo.
  // 100ms = atualiza 10 vezes por segundo (fica bem preciso).
  clearInterval(intervalo);
  intervalo = setInterval(atualizarRelogio, 100);
  atualizarRelogio();

  manterTelaLigada();
});

// ----- Botão PAUSAR / CONTINUAR -----
btnPausar.addEventListener("click", function () {
  if (!pausado) {
    // Pausar: guarda quanto tempo faltava
    pausado = true;
    restantePausado = fimDaFase - Date.now();
    btnPausar.textContent = "Continuar";
  } else {
    // Continuar: calcula um novo horário de término a partir de agora
    pausado = false;
    fimDaFase = Date.now() + restantePausado;
    btnPausar.textContent = "Pausar";
  }
});

// ----- Botão PARAR / VOLTAR -----
btnParar.addEventListener("click", function () {
  clearInterval(intervalo);
  intervalo = null;
  liberarTela();

  // Volta para a tela de configuração
  telaTreino.classList.add("escondido");
  telaConfig.classList.remove("escondido");
});
