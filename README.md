# FeedTune - Modern RSS Feed Reader

FeedTune is a modern, user-friendly RSS feed reader built with Next.js, React, and Tailwind CSS. It provides a clean and intuitive interface for managing and reading your favorite RSS feeds.

## Features

- 📱 Responsive design that works on all devices
- 🌓 Light/Dark theme support
- 📊 Feed statistics and tracking
- ⚡ Fast and efficient feed parsing
- 🔍 Advanced search capabilities
- 📂 Feed categorization
- ⭐ Favorite feeds management
- 🔔 Read/Unread tracking

## Tech Stack

- **Framework:** Next.js 14
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Icons:** Lucide Icons
- **State Management:** React Hooks
- **Feed Parsing:** RSS Parser (coming soon)

## Project Structure

```
src/
├── app/
│   ├── layout.js       # Root layout with navigation
│   └── page.js         # Home page
├── components/
│   ├── layout/
│   │   └── navigation.js   # Main navigation component
│   └── ui/
│       ├── button.js       # Button component
│       ├── card.js         # Card component
│       └── input.js        # Input component
└── styles/
    └── globals.css     # Global styles and Tailwind config
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/sselimkoc/feedtune.git
   ```

2. Install dependencies:
   ```bash
   cd feedtune
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Current Progress

- ✅ Project setup with Next.js and Tailwind CSS
- ✅ Basic UI components implementation
- ✅ Responsive layout with navigation
- ✅ Home page with feed management cards
- 🚧 Theme implementation (in progress)
- 🚧 Feed management functionality (planned)
- 🚧 User authentication (planned)
- 🚧 Feed parsing and storage (planned)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
