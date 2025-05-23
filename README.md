# Shrink Chat

A Next.js application that provides AI-based chat functionality with various features including tone inference and memory systems.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-api-key
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## API Key Configuration

This application uses the OpenAI API for various features. To ensure your API key is properly configured, please refer to [API Key Troubleshooting Guide](./docs/API_KEY_FIX.md).

### Checking API Key Configuration

You can check if your API key is correctly configured by running:

```bash
node check-openai-key.mjs
```

### Testing API Access

To test direct access to the OpenAI API, run:

```bash
node test-openai-key.mjs
```

### Resetting Environment Variables

If you encounter issues with environment variables, you can reset them with:

```bash
./reset-env.sh
```

### Cleanup Temporary Files

To clean up temporary debug files created during troubleshooting:

```bash
./cleanup.sh
```

## Testing

Run comprehensive tests with:

```bash
./run-all-tests.sh
```

## Features

- AI-based chat functionality
- Tone inference system
- Memory system for contextual conversations
- User profile integration
- Environment-aware API key handling

## Documentation

- [API Key Troubleshooting](./docs/API_KEY_FIX.md) - Detailed guide for resolving API key issues

## License

[MIT License](LICENSE)
