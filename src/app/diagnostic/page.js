"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty } from "@/components/ui/empty";
import { CodeBlock } from "@/components/ui/code-block";
import { DatabaseIcon } from "lucide-react";

export default function DiagnosticPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    feeds: true,
    rssItems: true,
    youtubeItems: true,
    interactions: true,
  });

  const runDiagnostic = async () => {
    if (!user?.id) {
      setError("Lütfen önce giriş yapın");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // API URL parametrelerini oluştur
      const params = new URLSearchParams({
        userId: user.id,
        feeds: options.feeds,
        rssItems: options.rssItems,
        youtubeItems: options.youtubeItems,
        interactions: options.interactions,
      });

      const response = await fetch(`/api/diagnostic?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Tanılama sırasında bir hata oluştu"
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Tanılama hatası:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = (option) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">FeedTune Veritabanı Tanılama</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kontrol Seçenekleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="feeds"
                checked={options.feeds}
                onCheckedChange={() => handleOptionChange("feeds")}
              />
              <Label htmlFor="feeds">Feed Tablosu</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rssItems"
                checked={options.rssItems}
                onCheckedChange={() => handleOptionChange("rssItems")}
              />
              <Label htmlFor="rssItems">RSS İçerikleri</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="youtubeItems"
                checked={options.youtubeItems}
                onCheckedChange={() => handleOptionChange("youtubeItems")}
              />
              <Label htmlFor="youtubeItems">YouTube İçerikleri</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="interactions"
                checked={options.interactions}
                onCheckedChange={() => handleOptionChange("interactions")}
              />
              <Label htmlFor="interactions">Kullanıcı Etkileşimleri</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={runDiagnostic}
            disabled={isLoading || !user?.id}
          >
            {isLoading ? "Tanılama Yapılıyor..." : "Tanılama Başlat"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
          <p className="font-medium">Hata: {error}</p>
        </div>
      )}

      {!user?.id && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg mb-6">
          <p className="font-medium">Tanılama için lütfen önce giriş yapın</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <p className="font-medium text-green-600 dark:text-green-400">
              Tanılama tamamlandı: {new Date(result.timestamp).toLocaleString()}
            </p>
            <p className="text-sm text-green-600/70 dark:text-green-400/70">
              Kullanıcı ID: {result.userId}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Tablo Kontrolü</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.tablesExist).map(([table, exists]) => (
                <div
                  key={table}
                  className={`p-3 rounded-lg text-center ${
                    exists
                      ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  <p className="font-medium">{table}</p>
                  <p className="text-sm">{exists ? "Mevcut" : "Bulunamadı"}</p>
                </div>
              ))}
            </div>
          </div>

          {result.tables && Object.keys(result.tables).length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3">Tablo İçerikleri</h2>

              {result.tables.feeds && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                      Feed Tablosu
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({result.tables.feeds.count} kayıt)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.tables.feeds.error ? (
                      <p className="text-red-500">
                        {result.tables.feeds.error}
                      </p>
                    ) : result.tables.feeds.count === 0 ? (
                      <p className="text-yellow-500">Hiç feed bulunamadı</p>
                    ) : (
                      <pre className="bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-x-auto text-xs">
                        {JSON.stringify(result.tables.feeds.sample, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.tables.rss_items && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                      RSS İçerikleri
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({result.tables.rss_items.count} kayıt)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.tables.rss_items.error ? (
                      <p className="text-red-500">
                        {result.tables.rss_items.error}
                      </p>
                    ) : result.tables.rss_items.count === 0 ? (
                      <div>
                        <p className="text-yellow-500 mb-2">
                          Hiç RSS öğesi bulunamadı
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aranan feed IDs:{" "}
                          {result.tables.rss_items.feedIds?.join(", ") || "N/A"}
                        </p>
                      </div>
                    ) : (
                      <pre className="bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-x-auto text-xs">
                        {JSON.stringify(
                          result.tables.rss_items.sample,
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.tables.youtube_items && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                      YouTube İçerikleri
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({result.tables.youtube_items.count} kayıt)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.tables.youtube_items.error ? (
                      <p className="text-red-500">
                        {result.tables.youtube_items.error}
                      </p>
                    ) : result.tables.youtube_items.count === 0 ? (
                      <div>
                        <p className="text-yellow-500 mb-2">
                          Hiç YouTube öğesi bulunamadı
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aranan feed IDs:{" "}
                          {result.tables.youtube_items.feedIds?.join(", ") ||
                            "N/A"}
                        </p>
                      </div>
                    ) : (
                      <pre className="bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-x-auto text-xs">
                        {JSON.stringify(
                          result.tables.youtube_items.sample,
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.tables.user_interaction && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <DatabaseIcon className="w-5 h-5 mr-2" />
                    Kullanıcı Etkileşimleri
                    <Chip className="ml-2 text-xs">
                      ({result.tables.user_interaction.count} kayıt)
                    </Chip>
                  </h3>

                  {result.tables.user_interaction.error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Hata</AlertTitle>
                      <AlertDescription>
                        {result.tables.user_interaction.error}
                      </AlertDescription>
                    </Alert>
                  ) : result.tables.user_interaction.count === 0 ? (
                    <Empty message="Henüz etkileşim kaydı bulunmuyor" />
                  ) : (
                    <CodeBlock
                      code={JSON.stringify(
                        result.tables.user_interaction.sample,
                        null,
                        2
                      )}
                      language="json"
                      className="max-h-64"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
