# SporeLink Mobile App

A React Native (Expo) mobile application for mushroom growing enthusiasts.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
- Create a new Firebase project at https://console.firebase.google.com/
- Enable Authentication and Firestore Database
- Copy your Firebase config values to `src/utils/firebaseConfig.js`

3. Start the development server:
```bash
npx expo start
```

4. Run the app:
- Install Expo Go on your mobile device
- Scan the QR code from the terminal with your device's camera
- Or use an iOS/Android emulator

## Features

- User Authentication
- Growth Tracking
- Community Features
- Educational Content
- Subscription Management

## Development

- Built with React Native and Expo
- Uses Firebase for backend services
- Implements React Navigation for routing

## Troubleshooting

If you encounter any issues:
1. Clear the Metro bundler cache:
```bash
npm start -- --clear-cache
```
2. Ensure all dependencies are properly installed
3. Check Firebase configuration 