# Study Planner

Enter a subject, the exam date and the hours you can study each week. Study Planner proposes a week-by-week plan, and you colour in a square of exercise-book paper for everything you finish.

- A dated plan in three phases: learn, practise, review
- Mark activities as complete and add an optional note
- Several exams side by side
- Light mode (squared paper) and dark mode (chalkboard)
- Everything stays on your device

## Install on Android

Download the APK from the [latest release](https://github.com/mrak-gg/study-planner/releases/latest) and open it on your phone. Android will ask you to allow installs from your browser or file manager.

## Run from source

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `w` for the browser.

```sh
npm test           # planning logic
npm run typecheck
npx expo lint
```

Built with Expo SDK 58, Expo Router and Reanimated.
