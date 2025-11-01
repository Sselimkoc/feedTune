export function DashboardWelcome({ user }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.email?.split("@")[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening with your feeds today
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
