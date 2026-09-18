# Thalima · Crew

Onboard CRM for **SY Thalima**, Southern Wind 110 RS (33.65 m, Farr / Nauta, 2010 / refit 2024). Built for the five-person MCA LY2 crew: captain, engineer, chief stew, chef, lead deck.

## Seats

| Level | Seat | Sees |
| --- | --- | --- |
| 1 Command | Eddy Guzman, Captain | Everything, assigns anyone |
| 2 Head of department | Engineer, Chief Stew, Chef | Own house + assigned jobs |
| 3 Crew | Lead deckhand | Own jobs, all-crew + deck chat |

## What works

- Motherboard of live jobs (text, due time, urgency)
- Kanban with drag-and-drop assignment
- Crew messaging (houses, all-crew, DMs) — open two windows as two seats
- Chart with OpenSeaMap + live wind/sea from Open-Meteo at the AIS fix (Golfo di Marinella)
- Engineering tanks, interior cabins, watch bill, deck log
- Light / dark

Data stays in the browser (`localStorage`). The seat is per tab (`sessionStorage`), so two windows can talk.

```bash
npm install
npm run dev
```
