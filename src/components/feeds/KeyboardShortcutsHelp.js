import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Tab"], description: "Feedler arası geçiş" },
  { keys: ["Shift", "Tab"], description: "Önceki feed'e geçiş" },
  { keys: ["↑"], description: "Önceki feed'e geçiş" },
  { keys: ["↓"], description: "Sonraki feed'e geçiş" },
  {
    keys: ["←"],
    description: "Önceki item'a geçiş (ilk itemde önceki sayfaya geçer)",
  },
  {
    keys: ["→"],
    description: "Sonraki item'a geçiş (son itemde sonraki sayfaya geçer)",
  },
  { keys: ["Enter"], description: "Seçili item'ı yeni sekmede aç" },
];

export function KeyboardShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Klavye Kısayolları
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Klavye Kısayolları</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded border"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
