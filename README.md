# SporeLink Mobile App

A React Native (Expo) mobile application for mushroom growing enthusiasts.

## Project Structure

```
sporelink-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── context/         # React Context providers
│   ├── utils/           # Helper functions
│   └── services/        # API and service integrations
```

## Branch Strategy

- `main` - Production branch
- `staging` - Pre-production testing
- `develop` - Development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`

## Development Workflow

1. Create a new branch from `develop`:
```bash
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: your descriptive commit message"
```

3. Push your changes:
```bash
git push -u origin feature/your-feature-name
```

4. Create a Pull Request to `develop`

## Environment Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure Firebase:
- Create a Firebase project
- Enable Authentication and Firestore
- Update `.env` with your Firebase config

## Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch
```

## Deployment

- Merges to `staging` trigger deployment to staging environment
- Merges to `main` trigger deployment to production

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Code Style

- Follow the project's ESLint configuration
- Use Prettier for code formatting
- Follow React Native best practices

## Commit Message Format

```
type(scope): subject

body

footer
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc)
- refactor: Code refactoring
- test: Adding or modifying tests
- chore: Build process or auxiliary tool changes

## Contact

For questions or support, contact the development team. 