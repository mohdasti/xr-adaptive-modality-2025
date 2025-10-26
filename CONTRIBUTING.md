# Contributing to XR Adaptive Modality

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/xr-adaptive-modality-2025.git`
3. Install dependencies: `cd app && npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/add-user-auth`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/cleanup-utils`)
- `test/` - Test additions or updates (e.g., `test/add-unit-tests`)

## Development Workflow

1. Make your changes in your feature branch
2. Run linting: `npm run lint`
3. Run formatting: `npm run format`
4. Run tests: `npm run test`
5. Build the project: `npm run build`
6. Commit your changes with clear, descriptive messages
7. Push to your fork: `git push origin feature/your-feature-name`

## Pull Request Process

1. Ensure all tests pass and there are no linting errors
2. Update documentation if needed
3. Create a pull request with a clear title and description
4. Link any related issues
5. Wait for review and address any feedback

## PR Checks

All pull requests must pass the following automated checks:

- ✅ ESLint (no errors)
- ✅ Build succeeds
- ✅ Unit tests pass
- ✅ E2E tests pass

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Write unit tests for new features
- Update existing tests when modifying code
- Ensure E2E tests cover critical user flows
- Aim for meaningful test coverage

## Questions?

Feel free to open an issue for questions or discussions about contributing.

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). 
By participating in this project you agree to abide by its terms.

