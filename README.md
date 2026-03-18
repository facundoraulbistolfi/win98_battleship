```
 ____        _   _   _           _     _         ___  ___
| __ )  __ _| |_| |_| | ___  ___| |__ (_)_ __   / _ \( _ )
|  _ \ / _` | __| __| |/ _ \/ __| '_ \| | '_ \ | (_) / _ \
| |_) | (_| | |_| |_| |  __/\__ \ | | | | |_) | \__, | (_) |
|____/ \__,_|\__|\__|_|\___||___/_| |_|_| .__/    /_/ \___/
                                        |_|
```

# Batalla Naval 98

> El clásico juego de Batalla Naval con estética **Windows 98**, power-ups, efectos de sonido retro y mucho más.

## [Jugar ahora](https://facundoraulbistolfi.github.io/win98_battleship/)

---

## Capturas

```
 ┌──────────────────────────────────────────┐
 │ Batalla Naval                    _ □ ×   │
 ├──────────────────────────────────────────┤
 │  Juego  Ayuda                            │
 ├──────────────────────────────────────────┤
 │  [05]    😀    [05]                      │
 ├──────────────────────────────────────────┤
 │                                          │
 │   TU FLOTA          FLOTA ENEMIGA        │
 │  ┌──────────┐      ┌──────────┐         │
 │  │ A B C D  │      │ A B C D  │         │
 │  │██░░██░░  │      │░░░░░░░░  │         │
 │  │░░░░██░░  │      │░░💥░░░░  │         │
 │  │░░██████  │      │░░░░🌊░░  │         │
 │  └──────────┘      └──────────┘         │
 │                                          │
 │  🚩1 ✛0 💣0                    ⏱ 42s 🔊│
 └──────────────────────────────────────────┘
```

---

## Características

- **Grilla 12x12** para partidas más estratégicas
- **vs Computadora** con IA inteligente (modo caza + patrón ajedrezado)
- **2 Jugadores local** en el mismo dispositivo
- **Power-Ups** ganados al hundir barcos:
  - **Radar** — Escanea un área 3x3 y marca barcos con banderas. No gasta turno
  - **Bomba** — Ataque en área 3x3
  - **Cruz** — Ataque en forma de + (9 celdas)
- **Turno extra** al impactar un barco enemigo
- **Efectos de sonido** retro generados con Web Audio API (explosiones, agua, sonar, fanfarria)
- **Interfaz Windows 98** fiel: bordes biselados, contadores LED, cara estilo Buscaminas, menús desplegables
- **Responsive** — Funciona en desktop y mobile con tabs adaptativos
- **Sin dependencias** — Vanilla HTML/CSS/JS puro

---

## Flota

| Barco         | Tamaño | Recompensa al hundirlo |
|---------------|:------:|:----------------------:|
| Portaaviones  |   5    | Bomba 3x3              |
| Acorazado     |   4    | Cruz +                 |
| Crucero       |   3    | Radar                  |
| Submarino     |   3    | Radar                  |
| Destructor    |   2    | Radar                  |

Empezás con **1 Radar** gratis.

---

## Controles

| Acción                | Desktop             | Mobile              |
|-----------------------|----------------------|---------------------|
| Colocar barco         | Click en la grilla   | Tap en la grilla    |
| Rotar barco           | Botón o tecla `R`    | Botón               |
| Colocar al azar       | Botón "Al azar"      | Botón "Al azar"     |
| Disparar              | Click en grilla enemiga | Tap en grilla enemiga |
| Usar power-up         | Click en barra de PU | Tap en barra de PU  |
| Mutear sonido         | Click en el icono    | Tap en el icono     |

---

## Estructura del proyecto

```
win98_battleship/
├── index.html   ← Punto de entrada
├── style.css    ← Estilos Windows 98
├── game.js      ← Lógica del juego, IA, sonido, renderizado
└── README.md
```

---

## Desarrollo local

No se requiere build ni dependencias. Simplemente servir los archivos estáticos:

```bash
# Con Python
python3 -m http.server 8080

# Con Node.js
npx serve .
```

Luego abrir `http://localhost:8080` en el navegador.

---

## Deploy

El juego se publica automáticamente con **GitHub Pages** desde la rama principal.

**Link:** [https://facundoraulbistolfi.github.io/win98_battleship/](https://facundoraulbistolfi.github.io/win98_battleship/)

---

## Licencia

MIT
