# Jak uruchomić rozszerzenie w Chrome lub Firefox w trybie developerskim
Nie trzeba ręcznie ładować rozszerzenia do przeglądarki.
Wystarczy uruchomić jeden ze skryptów w `package.json`;
Dla firefox
```sh
npm run start:firefox 
```
Dla chrome
```sh
npm run start:chrome 
```
Wcześniej oczywiście uruchamiając `npm install` aby zainstalować zależności.

# Jak uruchomić manualnie rozszerzenie w Chrome w trybie developerskim

1. Otwórz Chrome i przejdź do: `chrome://extensions/`
2. Włącz **Developer mode** (prawy górny róg strony rozszerzeń).
3. Kliknij **Load unpacked** / **Wczytaj rozpakowane**.
4. Wskaż folder z projektem, który zawiera plik `manifest.json`.
5. Rozszerzenie pojawi się na liście — (opcjonalnie) przypnij je do paska narzędzi (🧩 → pinezka).

> Aktualizacja podczas pracy: po zmianach w plikach wróć do `chrome://extensions/` i kliknij **Reload** przy rozszerzeniu, a stronę testową odśwież (F5).
