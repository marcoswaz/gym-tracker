# GymTracker - Notas do Projeto

## O que foi criado

Aplicativo web PWA para registro e acompanhamento de treinos na academia, com sincronização em tempo real via Firebase Firestore.

---

## Estrutura de arquivos

```
gym-tracker/
├── index.html      # Estrutura HTML + configuração do Firebase SDK
├── style.css       # Estilos (dark mode, componentes)
├── app.js          # Lógica principal da aplicação
├── data.js         # Dados iniciais (exercícios e templates de treino)
├── manifest.json   # Configuração PWA
├── sw.js           # Service Worker (cache offline)
├── icon-192.png    # Ícone PWA
└── icon-512.png    # Ícone PWA
```

---

## Arquitetura

### Firebase Firestore
- Projeto: `gym-tracker-73adf`
- O SDK é carregado via ESModule no `index.html` e exposto globalmente via `window._*`
- `app.js` consome essas funções via wrappers locais (`fsDoc`, `fsGetDoc`, `fsSetDoc`, `fsOnSnap`)

### Estrutura de dados no Firestore
```
gymtracker/profiles   → { data: JSON.stringify([...perfis]) }
gymtracker/exercises  → { data: JSON.stringify([...exercícios]) }
```

### Estado global (`state` em app.js)
```js
{
  profiles: [],           // array de perfis carregados do Firestore
  exercises: [],          // array de exercícios carregados do Firestore
  currentProfile: null,   // id do perfil logado
  editingWorkoutId: null,
  editingExerciseId: null,
  viewingSessionId: null,
  tempWorkoutExercises: [],
  unsubProfiles: null,    // unsubscribe do listener de perfis
  unsubExercises: null    // unsubscribe do listener de exercícios
}
```

---

## Funcionalidades implementadas

### Perfis
- Múltiplos perfis de usuário com nome e avatar (emoji)
- Cada perfil tem seus próprios treinos e histórico de sessões
- Criação, listagem e exclusão de perfis

### Treinos
- Criação e edição de planos de treino com nome, descrição e cor
- Adição/remoção/reordenação de exercícios por treino
- Número de séries configurável por exercício
- 4 templates padrão criados automaticamente: Treino A (Peito/Tríceps), B (Costas/Bíceps), C (Pernas/Glúteos), D (Ombros/Abdômen)

### Sessões de treino
- Registro de peso e repetições por série, por exercício
- Pré-preenchimento com os dados da última sessão do mesmo treino
- Campo de observações
- Histórico com filtro por treino e por mês
- Visualização detalhada e exclusão de sessões
- Exportação de histórico para CSV

### Biblioteca de exercícios
- 20 exercícios padrão com descrição e link de vídeo YouTube
- Busca por nome e filtro por grupo muscular
- Criação, edição e exclusão de exercícios
- Modal de detalhes com vídeo embutido e histórico do perfil naquele exercício

### Sincronização
- Listeners em tempo real (`onSnapshot`) para perfis e exercícios
- Loading overlay durante operações de escrita
- Toasts de feedback para ações do usuário

---

## Grupos musculares disponíveis
Peito, Costas, Ombros, Bíceps, Tríceps, Pernas, Glúteos, Abdômen, Cardio, Outro

---

## PWA
- Instalável em celular via manifest.json
- Service Worker registrado para funcionamento offline básico
- Ícones: 192x192 e 512x512

---

## Funcionalidades em pausa

### Análise de vídeo por IA (não implementado)
A ideia é permitir upload de vídeos das execuções dos exercícios para análise automática por IA com sugestões de correção de postura.

**Fluxo planejado:**
- Upload do vídeo após salvar a sessão, acessível pelo histórico
- Armazenamento no Firebase Storage
- Análise via API do Gemini (extração de frames + prompt descrevendo o exercício)
- Feedback exibido no modal de detalhes da sessão

**Por que está pausado:**
A conta Google utilizada tem uma política organizacional que impede a geração de API keys no formato padrão (`AIzaSy...`). Todas as chaves geradas pelo Google AI Studio e pelo Cloud Console saem no formato `AQ.` (OAuth credential vinculada a service account), que não é compatível com chamadas REST diretas do browser.

**Alternativas para retomar:**
1. Usar uma conta Google pessoal (fora de organização) para gerar a chave no AI Studio
2. Implementar um backend intermediário (ex: Cloudflare Workers gratuito) para autenticar com a chave `AQ.` via OAuth2
3. Substituir Gemini por **MediaPipe Pose** — roda no browser, sem chave de API, analisa postura via detecção de articulações
