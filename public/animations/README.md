# Animaciones de Piqui

Clips del personaje. El secuenciador (`entrypoints/sidepanel/piqui-anim.ts` +
`usePiquiAnimation.ts`) los reproduce enteros y encadena el próximo al terminar —
nunca corta un clip a la mitad.

| Archivo | Rol | Estado | Loopea |
|---|---|---|---|
| `idle.mp4` | idle base | happy | no (se cicla por onEnded) |
| `idle_mate_completo.mp4` | idle tomando mate | happy | no |
| `enojado_idle_1.mp4` | idle enojado | angry | no |
| `enojado_idle_2.mp4` | idle enojado (var.) | angry | no |
| `enojado_enter.mp4` | transición happy → angry | — | no |
| `enojado_exit.mp4` | transición angry → happy | — | no |

**Comportamiento:**
- Mientras no cambia la emoción, se ciclan al azar los idles del estado actual (sin
  repetir el anterior).
- Al cambiar la felicidad (cruza el umbral 50), al terminar el clip en curso se
  reproduce la transición correspondiente y luego se pasa a los idles del nuevo estado.
- Crossfade de ~120ms entre clips (ver `CROSSFADE_MS`) para suavizar el empalme.

**Sumar idles:** agregá el mp4 acá y su ruta al array correspondiente en
`IDLE_CLIPS` (`piqui-anim.ts`). Specs: 720×1280, 9:16, fondo blanco (se disuelve con
`mix-blend-mode: multiply`).
