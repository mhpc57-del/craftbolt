# CraftBolt - PRD (Product Requirements Document)

## Původní požadavek
Platforma craftbolt.cz - marketplace spojující zákazníky a dodavatele služeb (řemeslníky). Funguje podobně jako Bolt, ale pro řemeslníky.

## User Personas
1. **Zákazník** - poptává služby, vytváří zakázky
2. **Dodavatel (Nepodnikatel)** - fyzická osoba nepodnikající, přivýdělek
3. **Dodavatel (OSVČ/Firma)** - podnikatelé nabízející služby
4. **Admin** - správce platformy

## Core Requirements (Static)
- 14denní zkušební doba zdarma
- Cenové plány:
  - Zákazník: 190 Kč/měsíc
  - Nepodnikatel: 290 Kč/měsíc
  - OSVČ/Firmy: 490 Kč/měsíc
- 61 kategorií služeb
- Multi-step registrace
- Geolokace jako Bolt
- Real-time chat
- Hodnocení a recenze
- SMS/Email notifikace (Twilio)

## Co bylo implementováno (2026-04-01)

### Backend (FastAPI + MongoDB)
- ✅ User autentizace (registrace, přihlášení, JWT tokeny)
- ✅ 3 typy uživatelů (customer, supplier, admin)
- ✅ 3 typy dodavatelů (osvc, nepodnikatel, company)
- ✅ 61 kategorií služeb
- ✅ CRUD pro poptávky (demands)
- ✅ Chat/messaging systém
- ✅ Hodnocení a recenze
- ✅ Admin API (statistiky, správa uživatelů)
- ✅ 14denní trial automaticky při registraci
- ✅ Geolokace - ukládání a aktualizace polohy uživatelů

### Frontend (React + Tailwind + Leaflet)
- ✅ Homepage s hero, výhodami, procesem, ceníkem
- ✅ Přihlášení
- ✅ Registrace (multi-step wizard)
- ✅ Dashboard zákazníka (moje poptávky, nová poptávka)
- ✅ Dashboard dodavatele (dostupné, moje, statistiky, mapa s zakázkami)
- ✅ Admin panel (přehled, uživatelé, zakázky)
- ✅ Detail zakázky s chatem
- ✅ **Live mapa** - real-time sledování polohy (jako Bolt)
- ✅ Profil uživatele
- ✅ **Hero slider** - 10 fotek bez textového překryvu
- ✅ **"Jak to funguje" slider** - 5 fotek odpovídajících 5 krokům s hover interakcí

## Prioritizovaný backlog

### P0 (Kritické - další iterace)
- [x] Geocoding - našeptávač adres + interaktivní mapa s markerem
- [ ] SMS notifikace (Twilio integrace)
- [ ] Email notifikace
- [ ] Platební brána (Stripe) pro měsíční paušály

### P1 (Důležité)
- [ ] Nahrávání fotografií k poptávkám
- [ ] Galerie/portfolio dodavatelů
- [ ] Vyhledávání dodavatelů
- [ ] Filtrování podle lokace
- [ ] WebSocket pro real-time aktualizace mapy

### P2 (Nice to have)
- [ ] Mobilní aplikace (iOS, Android)
- [ ] Push notifikace
- [ ] Fakturace
- [ ] Export dat

## Next Tasks
1. Implementovat Twilio SMS notifikace
2. Přidat Stripe platební bránu
3. Implementovat geolokaci s mapou
4. Přidat nahrávání fotografií
