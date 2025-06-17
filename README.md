# feedTune - Modern RSS & YouTube Feed Manager

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Zustand](https://img.shields.io/badge/Zustand-FFCC00?logo=zustand&logoColor=white)](https://zustand-bear.github.io/)

feedTune is a high-performance, user-centric subscription management application that lets you effortlessly manage RSS feeds from your favorite websites and YouTube channels all in one place. Built from the ground up with modern web technologies, it offers a seamless reading and viewing experience.

---

## Project Purpose

* To provide users with a centralized platform for managing their website and YouTube channel subscriptions.
* To organize and make RSS feeds and YouTube content easily accessible within a single stream.
* To deliver a superior user experience through high performance, responsive design, and multi-language support.
* To build a performance-oriented, scalable, and easily maintainable architecture.

---

## Features

* **RSS Feed Management:** Easily add, categorize, and follow RSS feeds from various websites.
* **YouTube RSS Support:** Track YouTube channels via RSS and integrate their content into your feed.
* **Favorite Content:** Mark and save preferred articles or videos for quick access.
* **Read Later:** Save content to revisit at a more convenient time.
* **User Management:** Secure registration and login functionalities for a personalized experience.
* **Theme Support:** Customize the interface with light and dark theme options.
* **Multi-Language Support:** Enjoy the application in multiple languages.
* **Responsive Design:** A flawless experience across both desktop and mobile devices.
* **Performance-Oriented Architecture:** Optimized for speed with a multi-layered architecture, caching, and parallel data processing.

---

## Technologies Used

* **Frontend:**
    * **Next.js 14 (App Router):** The framework for modern React applications.
    * **Radix UI & Shadcn:** Accessible and highly customizable UI components.
    * **Tailwind CSS:** A utility-first CSS framework for rapid and flexible styling.
    * **Zustand:** A light and flexible state management solution.
    * **TanStack Query (React Query):** Manages data fetching, caching, and synchronization.
    * **react-i18next:** Comprehensive internationalization (i18n) support.
    * **react-hook-form:** Simple and powerful form management.
    * **Zod:** A TypeScript-first schema validation library.
    * **Lucide React:** An extensive icon library.
* **Backend & Database:**
    * **Supabase:** Provides real-time database, authentication, and storage services.

---

## Setup and Running

Here's how to set up and run the project on your local machine.

### Prerequisites

* Node.js (LTS version recommended)
* npm or Yarn
* A Supabase project and its associated API keys

### Steps

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Sselimkoc/feedTune.git](https://github.com/Sselimkoc/feedTune.git)
    cd feedTune
    ```
2.  **Install Dependencies:**
    ```bash
    npm install # or yarn install
    ```
3.  **Set Up Environment Variables:**
    Create a `.env.local` file in the project root directory and add your Supabase and other necessary keys:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Run the Application:**
    ```bash
    npm run dev # or yarn dev
    ```
    The application will typically run at `http://localhost:3000`.

---

## Usage

Once the application is running, you can register, log in, and start adding your RSS or YouTube feeds. The interface is designed to be highly intuitive.

---

## Contributing

Feel free to contribute to this project! We welcome any improvements, bug fixes, or new feature suggestions. Please open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---
