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
    <div className="py-8 md:py-10">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            {getGreeting()}, {capitalizedName}
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-300">
            Here's what's happening with your feeds today.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            {capitalizedName[0].toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
