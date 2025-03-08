export default function Head() {
  return (
    <>
      <title>FeedTune - RSS Feed Reader</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta
        name="description"
        content="Modern and user-friendly RSS feed reader"
      />
      <link rel="icon" href="/favicon.ico" />

      {/* Kritik CSS'leri inline olarak ekleyebiliriz */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Kritik CSS'ler */
        body {
          margin: 0;
          padding: 0;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        @media (prefers-color-scheme: dark) {
          .glass {
            background: rgba(15, 23, 42, 0.7);
          }
        }
      `,
        }}
      />
    </>
  );
}
