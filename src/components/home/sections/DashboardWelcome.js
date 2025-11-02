import { Calendar, Clock } from "lucide-react";

export function DashboardWelcome({ user }) {
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = user.email?.split("@")[0] || "User";
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative py-8 md:py-12 overflow-hidden">
      {/* Background decoration - subtle gradient lines */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/20 dark:bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-green-100/20 dark:bg-green-900/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-between gap-8">
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                {getGreeting()}
              </h1>
              <h2 className="text-3xl md:text-4xl font-light text-gray-600 dark:text-gray-300 leading-tight">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {capitalizedName}
                </span>{" "}
                👋
              </h2>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-xl mt-6">
            Here's what's happening with your feeds today
          </p>
        </div>

        {/* Avatar - Right side */}
        <div className="hidden lg:flex items-center justify-center flex-shrink-0">
          <div className="relative w-32 h-32">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800 opacity-30 animate-pulse" />
            {/* Avatar circle */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-5xl font-bold text-white">
                {capitalizedName[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
