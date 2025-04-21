"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState("store");
  const [storeSnapshot, setStoreSnapshot] = useState({});
  const [envInfo, setEnvInfo] = useState({});
  const [userData, setUserData] = useState(null);
  const supabase = createClientComponentClient();

  // Debug panelini göster/gizle
  const toggleVisibility = () => setIsVisible(!isVisible);

  // Kullanıcı verisini kontrol et
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Kimlik doğrulama hatası:", error);
      }
    };

    checkUser();
  }, []);

  // Yerel depolamadan store verilerini al
  const takeStoreSnapshot = () => {
    try {
      // Local storage'dan feed verilerini al
      const feedCache = localStorage.getItem("feed-cache");
      let feedData = { feeds: [], items: [] };

      if (feedCache) {
        try {
          feedData = JSON.parse(feedCache);
        } catch (e) {
          console.error("Cache parse hatası:", e);
        }
      }

      setStoreSnapshot({
        feeds: feedData.feeds?.length || 0,
        items: feedData.items?.length || 0,
        favorites:
          feedData.items?.filter((item) => item.isFavorite)?.length || 0,
        readLater:
          feedData.items?.filter((item) => item.isReadLater)?.length || 0,
        unread: feedData.items?.filter((item) => !item.isRead)?.length || 0,
        cacheDatetime: feedData.timestamp || "Bilinmiyor",
        cacheSize: feedCache
          ? Math.round(feedCache.length / 1024) + "KB"
          : "0KB",
      });
      toast.success("Store snapshot alındı");
    } catch (error) {
      console.error("Store snapshot alınırken hata:", error);
      toast.error("Store verileri alınamadı");
    }
  };

  // Ortam bilgilerini topla
  const collectEnvInfo = () => {
    setEnvInfo({
      nodeEnv: process.env.NODE_ENV || "unknown",
      buildTime: new Date().toISOString(),
      clientTime: new Date().toLocaleString(),
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      user: userData
        ? {
            id: userData.id,
            email: userData.email,
            lastSignIn: userData.last_sign_in_at,
          }
        : "Giriş yapılmamış",
    });
    toast.success("Ortam bilgileri toplandı");
  };

  // Feed store'daki tüm verileri temizle (debug işlemi)
  const clearStoreData = () => {
    if (
      confirm(
        "Bu işlem tüm yerel feed verilerini silecek. Devam etmek istiyor musunuz?"
      )
    ) {
      localStorage.removeItem("feed-cache");
      toast.success("Store verisi temizlendi");
      setStoreSnapshot({});
    }
  };

  // Kullanıcı etkileşimlerini temizle
  const clearUserData = async () => {
    if (
      !userData?.id ||
      !confirm(
        "Bu işlem tüm kullanıcı etkileşimlerini sıfırlayacak. Devam etmek istiyor musunuz?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_item_interactions")
        .delete()
        .eq("user_id", userData.id);

      if (error) throw error;

      toast.success("Kullanıcı etkileşimleri temizlendi");
    } catch (error) {
      console.error("Kullanıcı verisi temizleme hatası:", error);
      toast.error("Kullanıcı verileri temizlenemedi: " + error.message);
    }
  };

  // Paneli sayfanın en altına sabitleyip stil uygula
  const panelStyle = {
    position: "fixed",
    bottom: 0,
    right: 0,
    width: "350px",
    maxHeight: isVisible ? "500px" : "30px",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    color: "white",
    borderTopLeftRadius: "8px",
    zIndex: 9999,
    transition: "max-height 0.3s ease-in-out",
    overflow: "hidden",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
    fontFamily: "monospace",
    fontSize: "12px",
  };

  // Tab stillerini tanımla
  const tabStyle = {
    display: "inline-block",
    padding: "5px 10px",
    cursor: "pointer",
    backgroundColor: "rgba(50, 50, 50, 0.5)",
    marginRight: "2px",
    borderTopLeftRadius: "4px",
    borderTopRightRadius: "4px",
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: "rgba(100, 100, 100, 0.8)",
    fontWeight: "bold",
  };

  // Debug bilgilerini JSON formatında göster
  const renderJson = (data) => {
    return (
      <pre style={{ overflow: "auto", maxHeight: "300px", padding: "10px" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Komponent yüklendiğinde başlangıç işlemlerini yap
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+D tuş kombinasyonu ile paneli aç/kapat
      if (e.altKey && e.key === "d") {
        toggleVisibility();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  return (
    <div style={panelStyle}>
      <div
        style={{
          padding: "5px 10px",
          backgroundColor: "#333",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onClick={toggleVisibility}
      >
        <span>🐞 FeedTune Debug Panel (Alt+D)</span>
        <span>{isVisible ? "▼" : "▲"}</span>
      </div>

      {isVisible && (
        <div style={{ padding: "10px" }}>
          <div style={{ marginBottom: "10px" }}>
            <div
              style={currentTab === "store" ? activeTabStyle : tabStyle}
              onClick={() => setCurrentTab("store")}
            >
              Store
            </div>
            <div
              style={currentTab === "env" ? activeTabStyle : tabStyle}
              onClick={() => setCurrentTab("env")}
            >
              Ortam
            </div>
            <div
              style={currentTab === "actions" ? activeTabStyle : tabStyle}
              onClick={() => setCurrentTab("actions")}
            >
              İşlemler
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            {currentTab === "store" && (
              <div>
                <button
                  style={{
                    marginBottom: "10px",
                    padding: "5px 10px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  onClick={takeStoreSnapshot}
                >
                  Store Snapshot Al
                </button>
                {renderJson(storeSnapshot)}
              </div>
            )}

            {currentTab === "env" && (
              <div>
                <button
                  style={{
                    marginBottom: "10px",
                    padding: "5px 10px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  onClick={collectEnvInfo}
                >
                  Ortam Bilgilerini Topla
                </button>
                {renderJson(envInfo)}
              </div>
            )}

            {currentTab === "actions" && (
              <div>
                <div style={{ marginBottom: "10px" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "8px" }}>
                    Veri Temizleme
                  </h4>

                  <button
                    style={{
                      margin: "5px",
                      padding: "5px 10px",
                      backgroundColor: "#444",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    onClick={clearStoreData}
                  >
                    Yerel Önbelleği Temizle
                  </button>

                  <button
                    style={{
                      margin: "5px",
                      padding: "5px 10px",
                      backgroundColor: "#d63031",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    onClick={clearUserData}
                    disabled={!userData?.id}
                  >
                    Etkileşimleri Temizle
                  </button>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "8px" }}>
                    Tanı İşlemleri
                  </h4>

                  <button
                    style={{
                      margin: "5px",
                      padding: "5px 10px",
                      backgroundColor: "#444",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    onClick={() => {
                      console.log("Konsola tanılama bilgileri yazdırılıyor...");
                      console.log("Oturum bilgisi:", userData);
                      console.log("Yerel önbellek:", storeSnapshot);
                      console.log("Ortam bilgileri:", envInfo);
                      toast.success(
                        "Bilgiler konsola yazdırıldı (F12 ile açın)"
                      );
                    }}
                  >
                    Tanılama Bilgilerini Konsola Yaz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
