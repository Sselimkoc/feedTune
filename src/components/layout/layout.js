export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#0F1116]">
      <Navigation />
      <main className="min-h-screen pb-16 pt-16 md:pb-0 md:pl-72">
        <div className="container space-y-8 p-8">{children}</div>
      </main>
    </div>
  );
}
