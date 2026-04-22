# MCAT Prep — iOS

SwiftUI client that consumes the same REST API as the web app.

Not scaffolded yet. When we start:

- Xcode 16+, iOS 17+, SwiftUI, Swift Concurrency
- Auth: Sign in with Apple (native) against the shared Auth.js backend
- Networking: `URLSession` + async/await; codegen Swift types from the
  web's OpenAPI spec
- Offline: SwiftData mirror of flashcards, today's study plan, and recently
  viewed lessons
- Push: APNs for daily study reminders and counselor nudges

## Planned screens

1. Today — daily plan, streak, "Ask Counselor" shortcut
2. Lessons browser (by section → category → topic)
3. Flashcards review (FSRS due queue)
4. Exam simulator (section + full-length, realistic timer)
5. Progress — scaled score estimate, content heatmap
6. Counselor chat — streaming responses from Claude
7. Settings — target score, test date, hours/week, notifications
