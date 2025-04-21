/**
 * YouTube içeriklerini Supabase'e eklemek için yardımcı fonksiyon
 */

/**
 * YouTube öğelerini API kullanarak eklemek için fonksiyon
 * Bu fonksiyon sadece standart API'yi kullanır
 * @param {string} feedId - Besleme ID'si
 * @param {Array} items - Formatlanmış YouTube öğeleri
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export async function addYoutubeItems(feedId, items) {
  try {
    console.log(`addYoutubeItems: ${items?.length || 0} YouTube öğesi işleniyor, feedId: ${feedId}`);
    
    if (!feedId) {
      return { success: false, error: "Feed ID gerekli", count: 0 };
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { success: true, count: 0, message: "Eklenecek YouTube öğesi yok" };
    }

    // Elementleri API'a gönder
    const response = await fetch("/api/youtube-items/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedId, items }),
    });

    console.log(`YouTube API yanıtı - status: ${response.status}`);

    if (!response.ok) {
      console.error(`YouTube öğeleri eklenirken hata: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Hata detayı: ${errorText}`);
      return {
        success: false,
        error: `YouTube öğeleri eklenirken hata: ${response.status} ${response.statusText}`,
        count: 0,
      };
    }

    const result = await response.json();
    console.log(`YouTube öğeleri ekleme sonucu:`, result);

    return {
      success: result.success || false,
      count: result.insertedCount || 0,
      message: result.message || "YouTube videoları eklendi",
      error: result.error || null,
    };
  } catch (error) {
    console.error("YouTube öğeleri eklenirken beklenmeyen hata:", error);
    return {
      success: false,
      error: `YouTube öğeleri eklenirken beklenmeyen hata: ${error.message}`,
      count: 0,
    };
  }
}
