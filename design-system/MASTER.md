# MyHoa — Digital Clay

MyHoa is the unaccented, joined form of Mỹ Hòa: beauty and harmony. The personal name complements the calm, approachable learning experience.

Vue 3 Composition API, scoped CSS, and shared CSS custom properties. The user's High-Fidelity Claymorphism prompt is the visual source of truth. The ui-ux-pro-max Claymorphism and Vue guidelines inform interaction and component structure. Its Python search runner was unavailable; the bundled CSV guidance was read directly.

## Visual language

- Canvas `#F4F1FA`, primary text `#332F3A`, secondary text `#635F69`.
- Violet primary actions and Lesson 1; pink, blue and mint accent learning modes.
- Nunito 700–900 for headings and controls; DM Sans for body text. System fallbacks remain available.
- Shared card, button, pressed and icon shadows simulate matte clay with inset and outer layers.
- Cards use 28–40px radii; controls use 20px radii; circular indicators remain circular.
- CSS-built book and medical kit hero illustration. The brand logo `public/logo.svg` (blooming book & knowledge petals in digital clay style) serves as the desktop/mobile logo and browser favicon; the original `public/myhoa.webp` is preserved in the source. No new runtime dependency.
- Visible keyboard focus, 44px minimum control targets, reduced-motion support and decorative SVGs hidden from assistive technology.

## Learning flow

1. Overview recommends the first lesson with unmastered words.
2. Open Lesson 1, which contains all 52 current words. Show future lessons only when their vocabulary is added.
3. Choose all word types or focus on nouns, verbs, adjectives, adverbs or phrases. Each choice shows its count within the lesson and updates the vocabulary preview. Then choose flashcards and its direction (English → Vietnamese or Vietnamese → English), or configure quiz type and question count on the same preparation screen.
4. Start the session; return to preparation or choose another lesson from the results.

On mobile, study sessions hide the bottom navigation so it cannot cover the answer controls. The lesson back button remains available, and the full navigation returns when the learner leaves the session.

Flashcard direction uses the same labeled, keyboard-accessible two-button selector in preparation and practice. Reverse mode shows the Vietnamese meaning on the front and the English word with IPA on the back; the input and feedback follow the selected language. Switching direction restarts the current practice and clears pending answer timers, while retaining saved mastery. The selected direction is kept when returning to preparation within the app. English answers accept case/spacing/hyphen variations, listed slash alternatives and optional plural suffixes; spelling still needs to match the data.

All existing word IDs and the `medivocab_mastered` localStorage key remain unchanged. Lesson progress is calculated from those IDs, not fabricated activity. Hash navigation supports browser back/forward; in-progress answers are session-local, as before.

Word type selection uses the library's shared classification rules, including compound labels and phrases. Its six choices use a three-column grid on desktop and two columns on mobile, visible checks and keyboard focus. Counts always refer to the current lesson; the lesson progress remains for the whole lesson. The `?type=` parameter inside the hash preserves the group across refresh, browser navigation and changes to study mode. Flashcards, mastery filters, quiz answers and retries all use the selected group. Empty groups are disabled; groups with fewer than four entries explain the quiz limit and can still use flashcards. Question counts adjust to the available words. The Python search runner is still unavailable; the bundled Claymorphism, education, accessibility and Vue CSV guidance informed this addition.

The previous four topic groups are merged into `lesson-1`. With a single lesson, quick study links and legacy lesson URLs open that lesson. Future lessons use separate definitions and word IDs; a complete-deck shortcut is shown only when multiple lessons exist.

## Ownership

- `src/style.css`: global tokens, buttons, cards, motion and shared layout primitives.
- `Navbar.vue`: desktop sidebar and mobile navigation.
- `LearningDashboard.vue`, `LessonCard.vue`, `LessonDetail.vue`: discovery and entry flow.
- `QuizSettings.vue`: shared quiz settings used in lesson preparation and replay.
- `FlashcardDirection.vue`: shared flashcard direction selector; `src/utils/flashcardAnswers.js` handles answer matching in both directions.
- `WordTypeSelector.vue`: lesson-scoped word type choices; `src/utils/typeFilter.js` shares labels and classification with the library.
- `App.vue`: navigation, selected session settings and saved mastery.
- Backend `GET /api/learning`: source of truth for lesson definitions and vocabulary; EF migrations own the imported seed data.
- Existing learning mode components retain answer checking, audio, review, filters and scoring.
- `AuthPage.vue`: shared login/register flow using the same clay tokens, visible labels, inline validation, password visibility and responsive split layout.
- `src/services/api.js`: learning API, JWT session, token refresh and progress synchronization.
- `src/utils/lessons.js`: derives lesson progress from API records without owning content data.

## Verification

`npm run build` builds production assets. `npm test` runs Playwright on Chrome with isolated browser contexts and a test-only API fixture. Tests exercise authentication, API-backed lesson coverage, flashcard completion and repeated mistakes, saved mastery, all quiz types, retry scoring, library filters and responsive layouts. Speech is intercepted in tests to verify invocation without playing audio.
