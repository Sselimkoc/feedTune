import { useSettingsStore } from "@/store/useSettingsStore";

function getLang() {
  try {
    return useSettingsStore.getState().settings.language || "tr";
  } catch {
    return "tr";
  }
}

export async function resendVerificationEmail(email) {
  const res = await fetch("/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, lang: getLang() }),
  });

  if (!res.ok) {
    const data = await res.json();
    if (data.error === "already_confirmed") {
      throw new Error("already_confirmed");
    }
    throw new Error(data.error || "Failed to resend verification email");
  }

  return { success: true };
}
