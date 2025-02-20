export function ThemeScript() {
    return (
        <script
            id="theme-script"
            dangerouslySetInnerHTML={{
                __html: `
          (function() {
            try {
              const savedTheme = localStorage.getItem('theme');
              if (savedTheme) {
                document.documentElement.classList.toggle('dark', savedTheme === 'dark');
                return;
              }

              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.classList.toggle('dark', prefersDark);
              localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
            } catch (e) {}
          })();
        `,
            }}
        />
    );
}
