import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">FeedTune</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>RSS Feed Ekle</CardTitle>
              <CardDescription>
                Takip etmek istediğiniz RSS feed URL'sini girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder="RSS feed URL'si" className="mb-4" />
              <Button>Feed Ekle</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hızlı Başlangıç</CardTitle>
              <CardDescription>
                Popüler RSS feedlerinden başlayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                🌐 Teknoloji Haberleri
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📚 Blog Yazıları
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🎮 Oyun Haberleri
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
              <CardDescription>Feed takip istatistikleriniz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Toplam Feed</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Okunmamış</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Kategoriler</span>
                  <span className="font-bold">0</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">
                Detaylı İstatistikler
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
