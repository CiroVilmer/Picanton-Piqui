# Videos de Piqui

Dropeá acá los mp4 del personaje con estos nombres exactos. El sistema de animación
(`entrypoints/sidepanel/piqui-anim.ts` + `usePiquiAnimation.ts`) los toma automáticamente;
mientras falten, el Stage cae al placeholder SVG (`PiquiCharacter`).

| Archivo | Qué es | Loop |
|---|---|---|
| `idle-happy.mp4` | Piqui feliz, en idle | sí |
| `idle-angry.mp4` | Piqui enojado, en idle | sí |
| `to-angry.mp4` | transición happy → angry | no (una vez) |
| `to-happy.mp4` | transición angry → happy | no (una vez) |

**Specs sugeridas** (del manifest): 720×1280, 24fps, ~8s para los idle, vertical 9:16.
Fondo blanco (se disuelve con `mix-blend-mode: multiply` contra el viewport).

**Para que el crossfade sea invisible:** que el primer frame de cada transición matchee
el último frame del idle de origen, y el último frame matchee el primer frame del idle
destino. Así el fundido de ~120ms sólo suaviza el empalme.
