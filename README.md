# LocationTaskReminder

LocationTaskReminder is a React Native (Expo) mobile application designed to provide location-based task reminders. Never forget to do a task when you arrive at or leave a specific place again!

## Features

- **Location-Based Reminders**: Set reminders that trigger when you enter or exit a designated geographical area.
- **Geofencing**: Utilizes Expo Location and Task Manager to monitor your position in the background.
- **Push Notifications**: Receive timely alerts through Expo Notifications when your location matches a task's criteria.
- **Firebase Integration**: Leverages Firebase for secure authentication and cloud data storage, synchronized with `geofire-common` for spatial queries.
- **State Management**: Uses Zustand for seamless and efficient application state management.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npx expo start
   ```

## Design and Prompts

This project was developed with the assistance of AI tools. You can view the prompts used during the development process in the `.used-prompts` directory:

- [Antigravity Build Prompt](.used-prompts/antigravity-build.md)
- [Stitch Design Prompt](.used-prompts/stitch-design.md)

## Technologies Used

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/)
- [Zustand](https://github.com/pmndrs/zustand)
