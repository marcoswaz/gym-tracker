// ===== DADOS INICIAIS (exercícios padrão) =====
// Estes exercícios são carregados na primeira vez que o app abre.
// Voce pode editar, adicionar ou remover exercícios direto no app.

const DEFAULT_EXERCISES = [
  // PEITO
  {
    id: 'ex_supino_reto',
    name: 'Supino Reto com Barra',
    group: 'Peito',
    description: 'Deite no banco reto, pegue a barra com pegada maior que a largura dos ombros. Desça a barra até o peito de forma controlada e empurre de volta para cima. Mantenha os pés no chão e os glúteos no banco.',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    defaultSets: 4
  },
  {
    id: 'ex_supino_inclinado',
    name: 'Supino Inclinado com Halteres',
    group: 'Peito',
    description: 'Ajuste o banco a 30-45 graus. Segure um halter em cada mão, desça os halteres até a altura do peito e empurre para cima. Foco na parte superior do peito.',
    videoUrl: 'https://www.youtube.com/watch?v=DbFgADa2PL8',
    defaultSets: 3
  },
  {
    id: 'ex_cross_over',
    name: 'Crossover no Cabo',
    group: 'Peito',
    description: 'Em pé no centro do cabo, traga as alças em arco na frente do corpo cruzando levemente. Contraia o peito ao máximo na posição final. Mantenha leve flexão dos cotovelos.',
    videoUrl: 'https://www.youtube.com/watch?v=taI4XduLpTk',
    defaultSets: 3
  },
  // COSTAS
  {
    id: 'ex_puxada_frente',
    name: 'Puxada na Frente',
    group: 'Costas',
    description: 'Sente na máquina, segure a barra com pegada pronada (palmas para frente) afastada. Puxe a barra até a altura do queixo, retraindo as escápulas. Suba de forma controlada.',
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    defaultSets: 4
  },
  {
    id: 'ex_remada_curvada',
    name: 'Remada Curvada com Barra',
    group: 'Costas',
    description: 'Incline o tronco a 45 graus, puxe a barra em direção ao umbigo contraindo as costas. Mantenha as costas retas e o core contraído durante todo o movimento.',
    videoUrl: 'https://www.youtube.com/watch?v=vT2GjY_Umpw',
    defaultSets: 4
  },
  {
    id: 'ex_levantamento_terra',
    name: 'Levantamento Terra',
    group: 'Costas',
    description: 'Pés na largura do quadril, barra sobre o meio do pé. Pegue a barra, mantenha as costas retas e o peito para fora. Empurre o chão com os pés ao subir. Não arredonde a lombar.',
    videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    defaultSets: 4
  },
  // OMBROS
  {
    id: 'ex_desenvolvimento',
    name: 'Desenvolvimento com Halteres',
    group: 'Ombros',
    description: 'Sentado com coluna ereta, empurre os halteres para cima até quase tocar e desça controlado até a altura da orelha. Não trave o cotovelo no topo.',
    videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    defaultSets: 4
  },
  {
    id: 'ex_elevacao_lateral',
    name: 'Elevação Lateral',
    group: 'Ombros',
    description: 'Em pé, eleve os halteres lateralmente até a altura do ombro com leve flexão dos cotovelos. Desça de forma controlada. Evite usar o trapézio.',
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    defaultSets: 3
  },
  // BÍCEPS
  {
    id: 'ex_rosca_direta',
    name: 'Rosca Direta com Barra',
    group: 'Bíceps',
    description: 'Em pé com pegada supinada (palmas para cima), flexione os cotovelos trazendo a barra até os ombros. Mantenha os cotovelos fixos ao lado do corpo.',
    videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    defaultSets: 3
  },
  {
    id: 'ex_rosca_alternada',
    name: 'Rosca Alternada com Halteres',
    group: 'Bíceps',
    description: 'Alternando os braços, flexione o cotovelo supinando o punho durante o movimento. Contraia o bíceps no topo e desça controlado.',
    videoUrl: 'https://www.youtube.com/watch?v=sAq_ocpRh_I',
    defaultSets: 3
  },
  // TRÍCEPS
  {
    id: 'ex_triceps_testa',
    name: 'Tríceps Testa',
    group: 'Tríceps',
    description: 'Deitado no banco, segure a barra com pegada fechada. Flexione os cotovelos trazendo a barra em direção à testa, depois estenda para cima. Mantenha os cotovelos fixos.',
    videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
    defaultSets: 3
  },
  {
    id: 'ex_triceps_cabo',
    name: 'Tríceps no Cabo (Corda)',
    group: 'Tríceps',
    description: 'Com a corda no cabo alto, puxe para baixo abrindo as mãos no final do movimento. Mantenha os cotovelos fixos ao lado do corpo. Contraia o tríceps totalmente.',
    videoUrl: 'https://www.youtube.com/watch?v=vB5OHsJ3EME',
    defaultSets: 3
  },
  // PERNAS
  {
    id: 'ex_agachamento',
    name: 'Agachamento Livre',
    group: 'Pernas',
    description: 'Pés na largura dos ombros ligeiramente virados para fora. Desça até as coxas ficarem paralelas ao chão mantendo o tronco ereto e o joelho no alinhamento dos dedos.',
    videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    defaultSets: 4
  },
  {
    id: 'ex_leg_press',
    name: 'Leg Press 45°',
    group: 'Pernas',
    description: 'Posicione os pés na largura do quadril na plataforma. Desça controlado até 90 graus no joelho e empurre de volta sem trancar os joelhos no topo.',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    defaultSets: 4
  },
  {
    id: 'ex_stiff',
    name: 'Stiff com Barra',
    group: 'Pernas',
    description: 'Em pé, incline o tronco para frente mantendo as costas retas e descendo a barra ao longo das pernas. Sinta o alongamento nos posteriores e volte contraindo o glúteo.',
    videoUrl: 'https://www.youtube.com/watch?v=1uDiW5--rAE',
    defaultSets: 3
  },
  {
    id: 'ex_extensora',
    name: 'Cadeira Extensora',
    group: 'Pernas',
    description: 'Sentado na máquina com as costas apoiadas, estenda as pernas até a posição horizontal. Desça controlado. Foco no quadríceps.',
    videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
    defaultSets: 3
  },
  {
    id: 'ex_flexora',
    name: 'Cadeira Flexora',
    group: 'Pernas',
    description: 'Deitado na máquina, flexione os joelhos trazendo os calcanhares em direção ao glúteo. Contraia os posteriores no topo e desça controlado.',
    videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
    defaultSets: 3
  },
  // GLÚTEOS
  {
    id: 'ex_hip_thrust',
    name: 'Hip Thrust com Barra',
    group: 'Glúteos',
    description: 'Apoie as costas no banco, barra sobre o quadril. Empurre o quadril para cima contraindo o glúteo ao máximo. Desça controlado sem tocar o chão.',
    videoUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
    defaultSets: 4
  },
  {
    id: 'ex_afundo',
    name: 'Afundo (Lunge)',
    group: 'Glúteos',
    description: 'Dê um passo longo para frente e desça o joelho traseiro em direção ao chão. Volte à posição inicial empurrando com o calcanhar. Alterne as pernas.',
    videoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    defaultSets: 3
  },
  // ABDÔMEN
  {
    id: 'ex_abdominal',
    name: 'Abdominal Crunch',
    group: 'Abdômen',
    description: 'Deitado com joelhos dobrados, eleve o tronco contraindo o abdômen sem puxar o pescoço. Expire ao subir e inspire ao descer.',
    videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    defaultSets: 3
  },
  {
    id: 'ex_prancha',
    name: 'Prancha Isométrica',
    group: 'Abdômen',
    description: 'Apoie-se nos cotovelos e pontas dos pés mantendo o corpo em linha reta. Contraia o abdômen e glúteo. Mantenha por tempo determinado.',
    videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    defaultSets: 3
  }
];

// Treinos padrão (serão sugeridos mas o usuário pode modificar)
const DEFAULT_WORKOUT_TEMPLATES = [
  {
    id: 'tpl_a',
    name: 'Treino A - Peito e Tríceps',
    description: 'Foco em empurrar: peito e tríceps',
    color: '#6366f1',
    exercises: [
      { exerciseId: 'ex_supino_reto', sets: 4 },
      { exerciseId: 'ex_supino_inclinado', sets: 3 },
      { exerciseId: 'ex_cross_over', sets: 3 },
      { exerciseId: 'ex_triceps_testa', sets: 3 },
      { exerciseId: 'ex_triceps_cabo', sets: 3 }
    ]
  },
  {
    id: 'tpl_b',
    name: 'Treino B - Costas e Bíceps',
    description: 'Foco em puxar: costas e bíceps',
    color: '#22c55e',
    exercises: [
      { exerciseId: 'ex_puxada_frente', sets: 4 },
      { exerciseId: 'ex_remada_curvada', sets: 4 },
      { exerciseId: 'ex_levantamento_terra', sets: 4 },
      { exerciseId: 'ex_rosca_direta', sets: 3 },
      { exerciseId: 'ex_rosca_alternada', sets: 3 }
    ]
  },
  {
    id: 'tpl_c',
    name: 'Treino C - Pernas e Glúteos',
    description: 'Foco em pernas, glúteos e posterior',
    color: '#f59e0b',
    exercises: [
      { exerciseId: 'ex_agachamento', sets: 4 },
      { exerciseId: 'ex_leg_press', sets: 4 },
      { exerciseId: 'ex_stiff', sets: 3 },
      { exerciseId: 'ex_hip_thrust', sets: 4 },
      { exerciseId: 'ex_extensora', sets: 3 },
      { exerciseId: 'ex_flexora', sets: 3 }
    ]
  },
  {
    id: 'tpl_d',
    name: 'Treino D - Ombros e Abdômen',
    description: 'Ombros, elevações e core',
    color: '#ec4899',
    exercises: [
      { exerciseId: 'ex_desenvolvimento', sets: 4 },
      { exerciseId: 'ex_elevacao_lateral', sets: 3 },
      { exerciseId: 'ex_abdominal', sets: 3 },
      { exerciseId: 'ex_prancha', sets: 3 }
    ]
  }
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
  '#f97316', '#14b8a6'
];

const AVATARS = ['🧑', '👩', '👨', '🏋️', '🏋️‍♀️', '💪', '🦁', '🐯', '🦊', '🐺', '🦅', '⚡', '🔥', '🌟', '🚀'];
