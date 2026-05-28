# Piqui Manifest

Documento de referencia para regenerar Piqui (extensión de Chrome) desde cero.
Cubre identidad, stack, sistema de tokens, componentes, lógica y assets.

---

## 1. Identidad

**Piqui** es una mascota virtual con forma de jalapeño que vive en el side panel de Chrome. El usuario interactúa con él vía acciones (placeholder de mecánicas tipo Tamagotchi: alimentar, jugar, calmar) y chat.

**Dirección estética:** Tamagotchi / virtual pet moderno. Light theme, amigable sin ser infantil, juguetón pero contenido.

**Principios visuales (no negociables):**
- Cero negro puro — siempre marrón cálido (`#2C2218`)
- Cero glassmorphism / blur
- Cero gradientes (excepción: borrada — actualmente todo color sólido)
- Bordes muy finos (1px) y solo cuando necesario; la jerarquía la maneja la sombra suave
- Radios generosos (chunky) para sensación "jugosa"
- Iconografía consistente: Phosphor Icons weight `duotone`

---

## 2. Stack técnico

| Pieza | Elección | Por qué |
|---|---|---|
| Bundler | Vite 5 | HMR rápido, config simple |
| Framework UI | React 18 + TypeScript | Components reusables, type safety |
| Chrome ext tooling | `@crxjs/vite-plugin` | MV3 + HMR sin boilerplate |
| Icons | `@phosphor-icons/react` (duotone) | Weight duotone matchea el vibe playful |
| Fonts | Plus Jakarta Sans (Google Fonts) | Rounded humanist, amigable sin caricaturesco |
| Package manager | pnpm | Preferencia del usuario |

**Versions ancladas:** ver `package.json`.

---

## 3. Estructura de archivos

```
chrome-ext/
├── manifest.config.ts             # crxjs defineManifest
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/                        # assets que van al root de dist/
│   ├── piqui-logo.png             # 1254×1254, logo del header
│   ├── icon-16.png                # extension icon (transparente)
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── idle.mp4                   # 720×1280, 24fps, 8s
│   ├── angry.mp4
│   ├── tomar_mate.mp4
│   └── sacar_mate.mp4
├── docs/
│   └── piqui-manifest.md          # este archivo
└── src/
    ├── background/index.ts        # service worker (abre side panel)
    ├── content/index.ts           # content script (placeholder)
    └── sidepanel/
        ├── index.html
        ├── main.tsx               # React mount
        ├── App.tsx                # composition root
        ├── styles.css             # tokens + estilos globales
        ├── mood.ts                # bandas, labels, icons, isAngryMode
        ├── actions.ts             # HAPPY_ACTIONS / ANGRY_ACTIONS
        └── components/
            ├── Header.tsx
            ├── PiquiStage.tsx     # video + stats compactas
            ├── VideoPlayer.tsx
            ├── Tabs.tsx
            ├── ActionMenu.tsx
            ├── Chat.tsx
            ├── ChatMessage.tsx
            ├── TypingDots.tsx
            ├── ChatInput.tsx
            └── Footer.tsx
```

---

## 4. Sistema de tokens

Todos los tokens viven en `:root` dentro de `src/sidepanel/styles.css` como CSS custom properties.

### 4.1 Colores

```css
/* Neutrales */
--bg-canvas:  #FFF8EF   /* fondo de la app (cream cálido)        */
--bg-card:    #FFFFFF   /* superficies elevadas                  */
--bg-sunken:  #FBEEDD   /* tracks de bars, surcos                */
--ink:        #2C2218   /* texto principal (marrón oscuro)       */
--ink-muted:  #8A7A66   /* texto secundario                      */
--outline:    #F0DDC4   /* bordes sutiles 1px                    */

/* Mood (firma visual; usados en bordes/fills) */
--mood-happy: #58C97A   /* verde — feliz / satisfecho             */
--mood-calm:  #C9D964   /* lima — tranquilo                       */
--mood-warm:  #F4A65A   /* durazno — ansioso                      */
--mood-angry: #E25C5C   /* coral rojo — enojado                   */

/* Acentos para action card icon backgrounds */
--accent-mint:  #D2F2D9
--accent-peach: #FFE0CB
--accent-coral: #FFD3D3

/* Stage tints (definidos pero no usados — el stage es blanco) */
--stage-happy: #EAF8EE
--stage-calm:  #F4F7DA
--stage-warm:  #FFEBD8
--stage-angry: #FFE1E1
```

**Regla práctica:** el mood se comunica vía **border del stage** (3px, color = banda) y vía **fill de las bars** (verde si ≥50, rojo si <50). Nada de fills de fondo grandes.

### 4.2 Tipografía

```
Familia:    Plus Jakarta Sans (Google Fonts)
Pesos:      500 (regular), 600 (semibold), 700 (disponible, no usado)
Suavizado:  -webkit-font-smoothing: antialiased
Line-height: 1.4 (base)

Escala
  h1 / header logo (texto): n/a — el logo es imagen
  títulos en cards:  14px / 600
  body / UI:         14px / 500
  small / values:    11-12px / 600 con font-variant-numeric: tabular-nums
  micro (stat %):    10px / 600 tabular-nums
  chat bubbles:      13px / 500, line-height 1.45
  tab label:         13px / 600
  uppercase label:   11px / 600, letter-spacing 0.06em
```

### 4.3 Spacing (base 4pt)

```css
--s-1: 4px
--s-2: 8px
--s-3: 12px
--s-4: 16px
--s-5: 20px
--s-6: 24px
--s-8: 32px
```

Padding default del side panel: `0 var(--s-4) var(--s-4)` (sin top porque header tiene su propio padding). Gap entre secciones del main: `var(--s-4)`.

### 4.4 Radios

```css
--r-card: 20px   /* todas las cards (stage, chat) */
--r-btn:  18px   /* action buttons               */
--r-pill: 999px  /* tabs, bars, dots, send btn   */
```

Radios secundarios (no en tokens):
- Viewport del video: 16px
- Chat bubbles: 16px (con 6px en la esquina del "tail")

### 4.5 Sombras

```css
--shadow-soft:  0 2px 8px rgba(180, 130, 80, 0.08)
--shadow-press: inset 0 2px 0 rgba(255, 255, 255, 0.6)
```

Todas las cards usan `shadow-soft`. `shadow-press` se aplica en `:active` de action buttons (sensación táctil).

---

## 5. Iconografía

**Librería:** `@phosphor-icons/react`
**Weight default:** `duotone` (matchea la calidez visual)
**Weight para chevrons / arrows:** `bold`

| Icono | Uso | Tamaño |
|---|---|---|
| `Smiley`, `SmileyMelting`, `SmileyMeh`, `SmileyAngry` | Mood dinámico (banda) | 16 (stage stat), 24 (legacy mood card) |
| `BowlFood` | Hambre | 16 |
| `ForkKnife` | Action: Alimentar | 22 |
| `TennisBall` | Action: Jugar | 22 |
| `Moon` | Action: Descansar | 22 |
| `HandHeart` | Action: Mimar | 22 |
| `Wind` | Action: Calmar | 22 |
| `Sparkle` | Action: Distraer | 22 |
| `Lightning` | Action: Comida urgente | 22 |
| `Coffee` | Action: Ofrecer mate | 22 |
| `CaretRight` | Chevron action card | 16 (weight bold) |
| `PaperPlaneTilt` | Send button chat | 18 (weight fill) |

**Regla:** un icono por feature/acción; cuando hace falta semántica de estado (mood), se mapea desde un objeto `Record<Band, Icon>` (`MOOD_ICON` en `mood.ts`).

---

## 6. Layout del side panel

El side panel ocupa el ancho que Chrome le asigna (~340px típico) por la altura de la ventana.

```
┌──────────────────────────────────┐
│        [Piqui logo PNG]          │  HEADER  88px
│                                  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │   ┌──────────────────┐     │  │  STAGE   ~360px
│  │   │                  │     │  │  - card blanca
│  │   │   [Piqui video]  │     │  │  - border 3px color = mood
│  │   │   9:16 contained │     │  │  - viewport 9:16 max-h 280
│  │   │                  │     │  │  - stats compactas debajo
│  │   └──────────────────┘     │  │
│  │  😌 ▰▰▰▰▰▰▱▱▱▱  65%        │  │
│  │  🍽 ▰▰▰▰▱▱▱▱▱▱  40%        │  │
│  └────────────────────────────┘  │
│                                  │
│  ╭─ Acciones · Chat ───────╮     │  TABS    ~44px
│  ╰──────────────────────────╯    │
│                                  │
│  ╭──────────────────────────╮    │  CONTENT variable
│  │ [Action o Chat según tab]│    │
│  ╰──────────────────────────╯    │
│                                  │
├──────────────────────────────────┤
│  🟢 3 tabs · 12 hoy              │  FOOTER  44px
└──────────────────────────────────┘
```

**Gaps:** 16px entre las secciones del main (`.main { gap: var(--s-4) }`).
**Padding lateral del main:** 16px.

---

## 7. Componentes

### 7.1 Header (`Header.tsx`)

Solo el logo PNG centrado.

- Container: height 88px, flex center
- Logo: `<img src="/piqui-logo.png" />`, height 64px, width auto
- `-webkit-user-drag: none` para evitar drag accidental

### 7.2 PiquiStage (`PiquiStage.tsx`)

Card que contiene el video Y las stats compactas.

**Anatomía:**
```
.stage (card blanca, border 3px de color por mood band)
├── .stage__viewport (9:16, bg #FDFBF5, overflow hidden)
│   └── <video> (object-fit: contain, mix-blend-mode: multiply, scale 1.015)
└── .stage__stats
    ├── .stage-stat (felicidad)
    └── .stage-stat (hambre)
```

**Props:** `band: MoodBand`, `mood: number`, `hunger: number`

**Detalle stats compactas:**
- Row: icon (16px duotone) · bar (height 6px, flex 1) · value (10px / 600 tabular nums, min-width 28px right-aligned)
- Bar fill: `--mood-happy` si value ≥ 50, sino `--mood-angry`
- Gap entre rows: 8px

**Detalles video (críticos para que se vea bien):**
- `mix-blend-mode: multiply` — disuelve el fondo blanco del video mp4 contra el `#FDFBF5` del viewport
- `transform: scale(1.015)` — agranda 1.5% para que `overflow: hidden` cropee los 1-2px de artifact negro en los bordes del archivo
- `object-fit: contain` — preserva aspect ratio; deja letterbox lateral si la viewport no es 9:16

**Estados del border (por banda):**
- `.stage--happy { border-color: var(--mood-happy); }`
- `.stage--calm { ... --mood-calm; }`
- `.stage--warm { ... --mood-warm; }`
- `.stage--angry { ... --mood-angry; }`
- Transición: `border-color 0.8s ease`

### 7.3 Tabs (`Tabs.tsx`)

Pill switcher estilo iOS segmented control.

```
.tabs (bg sunken, padding 4px, gap 2px, radius pill)
├── .tabs__item (flex 1, padding 8/12, radius pill)
│     · activo: bg-card, color ink, shadow-soft
│     · inactivo: ink-muted, hover → ink
└── .tabs__item.tabs__item--active
```

**Props:** `value: 'actions' | 'chat'`, `onChange: (v) => void`
**ARIA:** `role="tablist"`, items con `role="tab"` y `aria-selected`

### 7.4 ActionMenu + ActionCard (`ActionMenu.tsx`)

Stack vertical de cards de acción. El set cambia según `isAngryMode(mood)`:
- `mood >= 50` → `HAPPY_ACTIONS` (mint icon bg)
- `mood < 50` → `ANGRY_ACTIONS` (coral icon bg)

**Anatomía card:**
```
.action (bg-card, radius r-btn, padding 12/16, shadow-soft, flex)
├── .action__icon (40×40, círculo, bg según tone, icon 22px duotone)
├── .action__body
│   ├── .action__title (14/600)
│   └── .action__desc  (12, ink-muted, truncate)
└── .action__chev (CaretRight bold 16, ink-muted)
```

**Tones:**
- `mint` → `--accent-mint` bg
- `peach` → `--accent-peach` bg
- `coral` → `--accent-coral` bg

**Interacciones:**
- `:hover` → `translateY(-1px)`
- `:active` → `translateY(0) + shadow-press inset`
- Transición: 120ms ease

### 7.5 Chat (`Chat.tsx`)

Card con log scrollable + input fijo abajo.

```
.chat (card blanca, padding 12, min-h 240)
├── .chat__log (flex column, gap 8, max-h 320, overflow-y auto)
│   ├── .chat__row.chat__row--piqui (justify start)
│   │   └── .bubble.bubble--piqui
│   ├── .chat__row.chat__row--user (justify end)
│   │   └── .bubble.bubble--user
│   └── .chat__row.chat__row--piqui
│       └── .bubble.bubble--piqui.typing  ← TypingDots
└── form.chat__input (border-top outline 1px, padding-top 12)
    ├── input.chat__input-field (border 1px, radius pill, focus → mood-happy border)
    └── button.chat__input-send (36×36 circle, bg mood-happy, PaperPlaneTilt fill 18)
```

#### 7.5.1 Bubble (`ChatMessage.tsx`)

- max-width 82%, padding 9/13, radius 16, font-size 13
- `.bubble--piqui`: bg `--bg-sunken`, color ink, `border-bottom-left-radius: 6px` (cola asimétrica)
- `.bubble--user`: bg `--mood-happy`, color white, `border-bottom-right-radius: 6px`

#### 7.5.2 TypingDots (`TypingDots.tsx`)

```
.bubble.bubble--piqui.typing (padding 12/14, inline-flex gap 5)
├── .typing__dot (6×6 circle, bg ink-muted, opacity 0.4)
├── .typing__dot (animation-delay 0.18s)
└── .typing__dot (animation-delay 0.36s)
```

**Animación:** `typing-bounce 1.2s ease-in-out infinite`
```css
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%          { transform: translateY(-4px); opacity: 1; }
}
```

#### 7.5.3 ChatInput (`ChatInput.tsx`)

Form con `onSubmit` que llama `e.preventDefault()` (placeholder). Input redondeado + botón send circular verde.

### 7.6 Footer (`Footer.tsx`)

Row delgado con border-top, font 12 ink-muted. Dot verde + stats placeholder ("3 tabs activas · 12 hoy").

### 7.7 VideoPlayer (`VideoPlayer.tsx`)

Componente mínimo: `<video>` con loop, muted, playsInline, preload="auto". `useEffect` setea `src` desde `chrome.runtime.getURL(src)` y llama `play()`.

**Importante:** los videos se referencian sin path porque viven en `public/` y crxjs los copia al root del bundle. URL: `chrome-extension://<id>/idle.mp4`.

---

## 8. Estado y lógica

### 8.1 Sistema de mood (`mood.ts`)

```ts
type MoodBand = 'happy' | 'calm' | 'warm' | 'angry'

moodBand(n):
  ≥80 → 'happy'
  ≥50 → 'calm'
  ≥25 → 'warm'
  <25 → 'angry'

isAngryMode(n) → n < 50   // umbral del switch de action menu

MOOD_LABEL: { happy: 'Feliz', calm: 'Tranquilo', warm: 'Ansioso', angry: 'Enojado' }
MOOD_ICON:  { happy: Smiley, calm: SmileyMelting, warm: SmileyMeh, angry: SmileyAngry }
```

### 8.2 Hambre

No tiene módulo propio. Es solo `number` 0-100. Misma regla de color que mood (≥50 verde, <50 rojo). Icono fijo `BowlFood`. Sin label dinámico.

**Semántica:** alto = lleno/satisfecho · bajo = hambriento.

### 8.3 Acciones (`actions.ts`)

```ts
interface ActionItem {
  id: string
  Icon: Icon       // phosphor component
  title: string
  desc: string
  tone: 'mint' | 'peach' | 'coral'
}

HAPPY_ACTIONS  (4 items, tone 'mint'):  feed, play, rest, pet
ANGRY_ACTIONS  (4 items, tone 'coral'): calm, distract, urgent, mate
```

Cuando se conecte lógica real: cada item tendría un handler que modifica mood/hunger.

### 8.4 Tabs y composition root (`App.tsx`)

```ts
mood:   useState(65)   // hardcoded placeholder
hunger: useState(40)
tab:    useState<TabId>('actions')

band = moodBand(mood)

<Header />
<PiquiStage band={band} mood={mood} hunger={hunger} />
<Tabs value={tab} onChange={setTab} />
{tab === 'actions' ? <ActionMenu mood={mood} /> : <Chat />}
<Footer />
```

---

## 9. Animaciones y transiciones

| Elemento | Propiedad | Duración / curva |
|---|---|---|
| Stage border-color | border-color | 0.8s ease |
| Stat bar fill width | width | 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) |
| Stat bar fill color | background-color | 0.4s ease |
| Tab item switch | bg + color | 0.2s ease |
| Action card hover | transform | 0.12s ease |
| Chat input focus | border-color | 0.15s ease |
| Send button hover | transform scale | 0.1s ease |
| Typing dots | typing-bounce | 1.2s infinite, delays 0/180/360ms |

---

## 10. Assets en `public/`

| Archivo | Dim. | Uso |
|---|---|---|
| `piqui-logo.png` | 1254×1254 | Header (renderiza a 64px de alto) |
| `icon-16.png` | 16×16 | Manifest icons (transparent alpha) |
| `icon-32.png` | 32×32 | Manifest icons + action |
| `icon-48.png` | 48×48 | Manifest icons + action |
| `icon-128.png` | 128×128 | Manifest icons (Chrome Web Store) |
| `idle.mp4` | 720×1280, 24fps, 8s | Stage loop default |
| `angry.mp4` | 720×1280, 24fps, 8s | Reservado (no usado aún) |
| `tomar_mate.mp4` | 720×1280, 24fps | Reservado |
| `sacar_mate.mp4` | 720×1280, 24fps | Reservado |

**Source files (no referenciados desde manifest):** `Piqui_icon.png`, `Piqui_icon.ico` (originales, los icon-N se derivan de estos con `sips` + `magick`).

**Cómo generar los icons desde un PNG fuente:**
```bash
# 1. Quitar fondo (floodfill desde las 4 esquinas con tolerancia 15%)
magick fuente.png -alpha set -fill none -fuzz 15% \
  -draw 'alpha 0,0 floodfill' \
  -draw 'alpha W,0 floodfill' \
  -draw 'alpha 0,H floodfill' \
  -draw 'alpha W,H floodfill' \
  fuente_alpha.png
# (reemplazar W y H por dim - 1)

# 2. Generar los 4 tamaños
for size in 16 32 48 128; do
  magick fuente_alpha.png -resize ${size}x${size} icon-$size.png
done
```

---

## 11. Chrome extension manifest (`manifest.config.ts`)

Generado por `@crxjs/vite-plugin` con `defineManifest`.

```ts
{
  manifest_version: 3,
  name: 'test ext',
  version: pkg.version,
  description: 'Test extension — Piqui',

  icons: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png', 128: 'icon-128.png' },

  action: {
    default_title: 'Abrir Piqui',
    default_icon: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png' },
    // NO default_popup — usamos side panel
  },

  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [{
    matches: ['<all_urls>'],
    js: ['src/content/index.ts'],
    run_at: 'document_idle',
  }],

  permissions: ['tabs', 'activeTab', 'scripting', 'storage', 'sidePanel'],
}
```

**Background script clave** (`src/background/index.ts`):
```ts
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)
```
→ click en el icon de la toolbar abre el side panel (en vez de popup).

---

## 12. Comandos

```bash
pnpm install           # primera vez
pnpm dev               # vite dev, HMR contra dist/
pnpm build             # genera dist/ producción
pnpm typecheck         # tsc --noEmit
```

**Cargar en Chrome:**
1. `chrome://extensions` → Modo desarrollador
2. "Cargar descomprimida" → seleccionar carpeta `dist/`
3. Click en icon de toolbar → abre side panel

---

## 13. Estado actual y placeholders

**Cableado y funcional:**
- Side panel se abre con click del icon
- Tabs (Acciones / Chat) funcional con `useState`
- Stage muestra video idle.mp4 en loop
- Mood band determina border color + icon + action set + bar color
- Hambre se renderiza pero es independiente
- Chat muestra placeholder messages + typing dots animados
- Input del chat funciona visualmente (no envía nada)

**Hardcoded, esperando lógica real:**
- `mood = 65` y `hunger = 40` en `App.tsx`
- Action handlers solo hacen `console.log`
- Mensajes del chat son un array constante
- Footer stats ("3 tabs · 12 hoy") es texto fijo
- No hay sync con el background ni con tabs reales

**Próximos pasos lógicos (orden sugerido):**
1. Conectar mood/hunger a `chrome.storage.local` para persistencia
2. Background: listener `chrome.tabs.onRemoved` → "alimentar" Piqui (subir hunger)
3. Animar smiley de mood + cambiar video por banda (idle / angry)
4. Wire del chat a un backend (Claude API, OpenAI, etc.) con streaming
5. Implementar acciones reales (cada una afecta mood/hunger con su propia curva)
6. Notificaciones cuando hambre/felicidad bajan crítico

---

## 14. Reglas de oro para mantener la coherencia

1. **Nunca uses `#000` puro.** Siempre `var(--ink)`.
2. **Nunca uses emojis en UI.** Phosphor Icons weight duotone.
3. **Solo dos pesos tipográficos** (500 y 600). Nada de 700+ excepto si está justificado.
4. **Toda card lleva `shadow-soft`.** No agregar borders + shadow, es uno o el otro.
5. **Mood color rule:** `≥50 = happy/verde`, `<50 = angry/rojo`. Punto. Las 4 bandas son para el icon dinámico y border del stage, no para el fill de bars.
6. **Animaciones discretas.** Nada arriba de 1s salvo el border del stage (0.8s) y el typing (1.2s infinito).
7. **Cuando agregás un asset al `public/`, va al root del bundle**, no se referencia con path relativo desde componentes — usar `/asset.png` o `chrome.runtime.getURL('asset.png')`.
