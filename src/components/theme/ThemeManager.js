"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { colorAnalysis, generatePalette } from "@/lib/colorAnalysis";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Paintbrush, Undo, Save } from "lucide-react";

export function ThemeManager() {
  const {
    theme,
    setThemeMode,
    setPrimaryColor,
    setAccentColor,
    saveTheme,
    resetTheme,
    themeHistory,
  } = useThemeStore();

  // CSS değişkenlerini güncelle
  useEffect(() => {
    if (theme.primaryColor) {
      const palette = generatePalette(theme.primaryColor);
      Object.entries(palette).forEach(([key, value]) => {
        document.documentElement.style.setProperty(
          `--primary-${key}`,
          value.replace("#", "")
        );
      });
    }

    if (theme.accentColor) {
      const accentPalette = generatePalette(theme.accentColor);
      Object.entries(accentPalette).forEach(([key, value]) => {
        document.documentElement.style.setProperty(
          `--accent-${key}`,
          value.replace("#", "")
        );
      });
    }
  }, [theme.primaryColor, theme.accentColor]);

  const handleColorInput = (color, type) => {
    try {
      const harmony = colorAnalysis.generateColorHarmony(color);
      if (type === "primary") {
        setPrimaryColor(harmony.primary);
        setAccentColor(harmony.accent);
      } else {
        setAccentColor(color);
      }
    } catch (error) {
      console.error("Invalid color value:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Tema Ayarları</CardTitle>
        <CardDescription>Uygulamanın görünümünü özelleştirin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tema Modu</Label>
          <Select value={theme.mode} onValueChange={setThemeMode}>
            <SelectTrigger>
              <SelectValue placeholder="Tema modu seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Sistem</SelectItem>
              <SelectItem value="light">Açık</SelectItem>
              <SelectItem value="dark">Koyu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ana Renk</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.primaryColor || "#000000"}
              onChange={(e) => handleColorInput(e.target.value, "primary")}
              className="w-12 h-12 p-1 rounded-lg"
            />
            <Input
              type="text"
              value={theme.primaryColor || ""}
              onChange={(e) => handleColorInput(e.target.value, "primary")}
              placeholder="#HEX kodu"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Vurgu Rengi</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.accentColor || "#000000"}
              onChange={(e) => handleColorInput(e.target.value, "accent")}
              className="w-12 h-12 p-1 rounded-lg"
            />
            <Input
              type="text"
              value={theme.accentColor || ""}
              onChange={(e) => handleColorInput(e.target.value, "accent")}
              placeholder="#HEX kodu"
              className="flex-1"
            />
          </div>
        </div>

        {themeHistory.length > 0 && (
          <div className="space-y-2">
            <Label>Önceki Temalar</Label>
            <div className="grid grid-cols-5 gap-2">
              {themeHistory.map((historicTheme, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full h-12 p-1"
                  style={{
                    backgroundColor: historicTheme.primaryColor,
                  }}
                  onClick={() => {
                    setPrimaryColor(historicTheme.primaryColor);
                    setAccentColor(historicTheme.accentColor);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={resetTheme}>
            <Undo className="w-4 h-4 mr-2" />
            Sıfırla
          </Button>
          <Button variant="default" className="flex-1" onClick={saveTheme}>
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
