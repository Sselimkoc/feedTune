"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebugTools } from "@/debug-hook";

export default function TestDataPage() {
  const {
    results,
    testRepository,
    testService,
    testDirect,
    isLoading,
    error,
    user,
  } = useDebugTools();

  const [activeTab, setActiveTab] = useState("repository");

  return (
    <div className="container py-10 max-w-5xl">
      <h1 className="text-3xl font-bold mb-4">Veri Testi Sayfası</h1>
      <p className="text-muted-foreground mb-8">
        Bu sayfa, veritabanı bağlantılarını ve veri alımını farklı katmanlar
        üzerinden test etmek için kullanılır.
      </p>

      {!user ? (
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-amber-500">Oturum Açınız</CardTitle>
            <CardDescription>
              Test işlemlerini gerçekleştirmek için lütfen önce oturum açın.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={testRepository} disabled={isLoading}>
              Repository Katmanını Test Et
            </Button>
            <Button
              onClick={testService}
              disabled={isLoading}
              variant="secondary"
            >
              Servis Katmanını Test Et
            </Button>
            <Button onClick={testDirect} disabled={isLoading} variant="outline">
              Doğrudan Sorgu Testi
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
              <h3 className="font-semibold">Hata Oluştu</h3>
              <p>{error}</p>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mb-6"
          >
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="repository">Repository Testi</TabsTrigger>
              <TabsTrigger value="service">Servis Testi</TabsTrigger>
              <TabsTrigger value="direct">Doğrudan Sorgu</TabsTrigger>
            </TabsList>

            <TabsContent value="repository">
              <Card>
                <CardHeader>
                  <CardTitle>Repository Testi Sonuçları</CardTitle>
                  <CardDescription>
                    EnhancedFeedRepository sınıfı üzerinden yapılan sorgu
                    sonuçları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Yükleniyor...</p>
                  ) : results.repository ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Özet</h3>
                        <p>{results.repository.message}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">
                            Feed'ler ({results.repository.feeds?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(results.repository.feeds, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            İçerikler ({results.repository.items?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(results.repository.items, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Henüz repository testi yapılmadı.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="service">
              <Card>
                <CardHeader>
                  <CardTitle>Servis Testi Sonuçları</CardTitle>
                  <CardDescription>
                    EnhancedFeedService sınıfı üzerinden yapılan sorgu sonuçları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Yükleniyor...</p>
                  ) : results.service ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Özet</h3>
                        <p>{results.service.message}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">
                            Feed'ler ({results.service.feeds?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(results.service.feeds, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            İçerikler ({results.service.items?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(results.service.items, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Henüz servis testi yapılmadı.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="direct">
              <Card>
                <CardHeader>
                  <CardTitle>Doğrudan Sorgu Sonuçları</CardTitle>
                  <CardDescription>
                    Supabase client'ı doğrudan kullanarak yapılan sorgu
                    sonuçları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Yükleniyor...</p>
                  ) : results.direct ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Özet</h3>
                        <p>{results.direct.message}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">
                            Feed'ler ({results.direct.feeds?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(results.direct.feeds, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            RSS İçerikler (
                            {results.direct.rssItems?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(results.direct.rssItems, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            YouTube İçerikler (
                            {results.direct.youtubeItems?.length || 0})
                          </h3>
                          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-60">
                            {JSON.stringify(
                              results.direct.youtubeItems,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Henüz doğrudan sorgu testi yapılmadı.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-md border">
        <h2 className="text-xl font-semibold mb-2">Konsol İpuçları</h2>
        <p className="mb-2">
          Bu sayfada tarayıcı konsolunda da test yapabilirsiniz:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
          <li>
            <code>debugTools.testRepository()</code>: Repository katmanını test
            et
          </li>
          <li>
            <code>debugTools.testService()</code>: Servis katmanını test et
          </li>
          <li>
            <code>debugTools.testDirect()</code>: Doğrudan Supabase sorgusu yap
          </li>
          <li>
            <code>debugTools.getResults()</code>: Tüm test sonuçlarını görüntüle
          </li>
        </ul>
      </div>
    </div>
  );
}
