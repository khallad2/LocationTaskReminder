
> Initialize and build a new React Native mobile application named "Location Task Reminder" using Firebase as the backend. Please execute this build applying strict Clean Architecture principles (maintaining clear boundaries between Presentation, Domain, and Data layers) and following standard SDLC practices.
> **Core Requirements & Agent Tasks:**
> 1. **Project Scaffolding:** Set up a new React Native project with TypeScript. Configure the directory structure to reflect Clean Architecture.
> 2. **Backend & Database:** Set up Firebase Auth for user management and Cloud Firestore for the database. Implement secure data access patterns and repository interfaces.
> 3. **Location Logic:** Implement a geo-querying system in Firestore (e.g., utilizing Geohashes) to efficiently filter and retrieve tasks based on the device's current GPS coordinates.
> 4. **UI Implementation:** Translate the provided design system into reusable React Native components. Ensure the home screen proactively checks the user's location upon launch, rendering specific visual highlights for tasks matching the current location. Handle background location permissions gracefully.
> 5. **MCP Integration:** Configure a Model Context Protocol (MCP) server integration within the architecture to securely pull in any necessary external geographic context or mapping API resources required for location validation.
> 
> 
> **Execution Protocol:**
> Please spawn dedicated sub-agents for the UI development, the Firebase backend logic, and the MCP integration. Generate verifiable Artifacts (implementation plans, code diffs, and simulator testing recordings) for each major feature layer before proceeding to the next.