# Copper Ladle Kitchen 3D

A cozy 3D cooking game built with Three.js. You are the chef of the Copper Ladle Kitchen: pick ingredients, chop them on the board, stack them on the plate, and serve hungry customers before their tickets run out. A 3-minute shift, combo multipliers, and rush hours with 1.5x coins.

[![Copper Ladle Kitchen 3D](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Copper Ladle Kitchen 3D rank](https://make.fun/badge/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Copper Ladle Kitchen 3D reward](https://make.fun/badge/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Bounty: https://make.fun/bounty/best-cooking-game-20261125-0137

## How to play

- **1–6** pick an ingredient (Tomato, Lettuce, Cheese, Mushroom, Pasta, Onion), or click its bin.
- Ingredients marked "chop first" must go on the chopping board: click the board to place them, then click it **3 times** to chop.
- Click the **plate** (or press **Space**) to add the held / chopped ingredient.
- When the plate exactly matches an order, the ticket glows green — click **SERVE** on the ticket or press **Space**.
- Serve fast for a **PERFECT** bonus (+50% coins). Serving in a row builds your **combo** multiplier. **Rush hours** at 1:00 and 2:00 give 1.5x coins for 12 seconds.
- **X** throws away the plate, held item and board item. **P** pauses, **M** mutes, **R** restarts after the shift ends.

## Recipes

| Recipe | Ingredients | Coins |
| --- | --- | --- |
| Garden Salad | chopped lettuce + chopped tomato + cheese | 60 |
| Tomato Pasta | pasta + chopped tomato + cheese | 80 |
| Mushroom Soup | chopped mushroom + chopped onion (in a bowl) | 70 |
| Cheesy Melt | cheese + chopped tomato + chopped mushroom | 90 |

## Run locally

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser (Chrome). The game runs fully offline — no network requests, no CDN. Three.js is vendored under `game/vendor/`.
