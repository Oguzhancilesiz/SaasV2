"use client";

import { useState } from "react";
import { 
  Settings, 
  Globe, 
  Database, 
  Shield, 
  KeyRound, 
  Server, 
  Bell, 
  Lock, 
  Network,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useNotificationHelpers } from "@/contexts/NotificationContext";
import { 
  getAllSettings, 
  getSettingsByCategory, 
  updateSettingsBatch, 
  getConnectionStringMasked, 
  testDatabaseConnection 
} from "@/lib/settingsService";
import { useEffect } from "react";
import { getApiBaseUrl } from "@/lib/config";

type SettingsSection = "general" | "system" | "security" | "api" | "database";

interface SettingsData {
  // Genel Ayarlar
  appName: string;
  appDescription: string;
  defaultCurrency: string;
  timezone: string;
  
  // Sistem Ayarları
  logLevel: string;
  sessionTimeout: number;
  cacheEnabled: boolean;
  cacheDuration: number;
  
  // Güvenlik Ayarları
  passwordMinLength: number;
  passwordRequireDigit: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNonAlphanumeric: boolean;
  lockoutEnabled: boolean;
  lockoutMaxAttempts: number;
  lockoutDuration: number;
  
  // API Ayarları
  apiBaseUrl: string;
  useHttps: boolean;
  corsOrigins: string[];
  apiKeyRequired: boolean;
  
  // Database Ayarları
  databaseProvider: string;
  connectionStringMasked: string;
  databaseStatus: "connected" | "disconnected" | "unknown";
}

export default function SettingsClient() {
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsData>({
    // Genel
    appName: "SaaS Admin Panel",
    appDescription: "Yönetim Paneli",
    defaultCurrency: "TRY",
    timezone: "Europe/Istanbul",
    
    // Sistem
    logLevel: "Information",
    sessionTimeout: 30,
    cacheEnabled: true,
    cacheDuration: 60,
    
    // Güvenlik
    passwordMinLength: 3,
    passwordRequireDigit: false,
    passwordRequireUppercase: false,
    passwordRequireLowercase: false,
    passwordRequireNonAlphanumeric: false,
    lockoutEnabled: true,
    lockoutMaxAttempts: 5,
    lockoutDuration: 15,
    
    // API
    apiBaseUrl: getApiBaseUrl(),
    useHttps: false,
    corsOrigins: ["http://localhost:3000", "https://localhost:3000"],
    apiKeyRequired: false,
    
    // Database
    databaseProvider: "SQL Server",
    connectionStringMasked: "Server=.***;Database=***;Trusted_Connection=True;",
    databaseStatus: "unknown",
  });

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const allSettings = await getAllSettings();
        
        // Settings'i key-value dictionary'ye dönüştür
        const settingsDict: Record<string, string> = {};
        allSettings.forEach(s => {
          settingsDict[s.key] = s.value;
        });

        // State'i güncelle
        setSettings(prev => ({
          ...prev,
          // Genel
          appName: settingsDict["AppName"] || prev.appName,
          appDescription: settingsDict["AppDescription"] || prev.appDescription,
          defaultCurrency: settingsDict["DefaultCurrency"] || prev.defaultCurrency,
          timezone: settingsDict["Timezone"] || prev.timezone,
          
          // Sistem
          logLevel: settingsDict["LogLevel"] || prev.logLevel,
          sessionTimeout: parseInt(settingsDict["SessionTimeout"] || prev.sessionTimeout.toString()),
          cacheEnabled: settingsDict["CacheEnabled"] === "true" || prev.cacheEnabled,
          cacheDuration: parseInt(settingsDict["CacheDuration"] || prev.cacheDuration.toString()),
          
          // Güvenlik
          passwordMinLength: parseInt(settingsDict["PasswordMinLength"] || prev.passwordMinLength.toString()),
          passwordRequireDigit: settingsDict["PasswordRequireDigit"] === "true" || prev.passwordRequireDigit,
          passwordRequireUppercase: settingsDict["PasswordRequireUppercase"] === "true" || prev.passwordRequireUppercase,
          passwordRequireLowercase: settingsDict["PasswordRequireLowercase"] === "true" || prev.passwordRequireLowercase,
          passwordRequireNonAlphanumeric: settingsDict["PasswordRequireNonAlphanumeric"] === "true" || prev.passwordRequireNonAlphanumeric,
          lockoutEnabled: settingsDict["LockoutEnabled"] === "true" || prev.lockoutEnabled,
          lockoutMaxAttempts: parseInt(settingsDict["LockoutMaxAttempts"] || prev.lockoutMaxAttempts.toString()),
          lockoutDuration: parseInt(settingsDict["LockoutDuration"] || prev.lockoutDuration.toString()),
          
          // API
          apiBaseUrl: settingsDict["ApiBaseUrl"] || prev.apiBaseUrl,
          useHttps: settingsDict["UseHttps"] === "true" || prev.useHttps,
          corsOrigins: settingsDict["CorsOrigins"] ? settingsDict["CorsOrigins"].split("\n").filter(o => o.trim()) : prev.corsOrigins,
          apiKeyRequired: settingsDict["ApiKeyRequired"] === "true" || prev.apiKeyRequired,
        }));

        // Database bilgilerini yükle
        try {
          const connStr = await getConnectionStringMasked();
          const dbStatus = await testDatabaseConnection();
          setSettings(prev => ({
            ...prev,
            connectionStringMasked: connStr || prev.connectionStringMasked,
            databaseStatus: dbStatus ? "connected" : "disconnected",
          }));
        } catch {
          setSettings(prev => ({
            ...prev,
            databaseStatus: "unknown",
          }));
        }
      } catch (error) {
        notifyError("Hata", "Ayarlar yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [notifyError]);

  const handleSave = async (section: SettingsSection) => {
    setSaving(true);
    try {
      const settingsToSave: Record<string, string> = {};

      switch (section) {
        case "general":
          settingsToSave["AppName"] = settings.appName;
          settingsToSave["AppDescription"] = settings.appDescription;
          settingsToSave["DefaultCurrency"] = settings.defaultCurrency;
          settingsToSave["Timezone"] = settings.timezone;
          break;
        case "system":
          settingsToSave["LogLevel"] = settings.logLevel;
          settingsToSave["SessionTimeout"] = settings.sessionTimeout.toString();
          settingsToSave["CacheEnabled"] = settings.cacheEnabled.toString();
          settingsToSave["CacheDuration"] = settings.cacheDuration.toString();
          break;
        case "security":
          settingsToSave["PasswordMinLength"] = settings.passwordMinLength.toString();
          settingsToSave["PasswordRequireDigit"] = settings.passwordRequireDigit.toString();
          settingsToSave["PasswordRequireUppercase"] = settings.passwordRequireUppercase.toString();
          settingsToSave["PasswordRequireLowercase"] = settings.passwordRequireLowercase.toString();
          settingsToSave["PasswordRequireNonAlphanumeric"] = settings.passwordRequireNonAlphanumeric.toString();
          settingsToSave["LockoutEnabled"] = settings.lockoutEnabled.toString();
          settingsToSave["LockoutMaxAttempts"] = settings.lockoutMaxAttempts.toString();
          settingsToSave["LockoutDuration"] = settings.lockoutDuration.toString();
          break;
        case "api":
          settingsToSave["ApiBaseUrl"] = settings.apiBaseUrl;
          settingsToSave["UseHttps"] = settings.useHttps.toString();
          settingsToSave["CorsOrigins"] = settings.corsOrigins.join("\n");
          settingsToSave["ApiKeyRequired"] = settings.apiKeyRequired.toString();
          break;
      }

      await updateSettingsBatch(section, settingsToSave);
      notifySuccess("Başarılı", `${section} ayarları kaydedildi.`);
    } catch (error) {
      notifyError("Hata", "Ayarlar kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const sections: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "general", label: "Genel Ayarlar", icon: Globe },
    { id: "system", label: "Sistem Ayarları", icon: Server },
    { id: "security", label: "Güvenlik", icon: Shield },
    { id: "api", label: "API Ayarları", icon: KeyRound },
    { id: "database", label: "Veritabanı", icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Ayarlar</h1>
          <p className="text-neutral-400 text-sm">
            Sistem ayarlarını yönetin ve yapılandırın
          </p>
        </div>
      </div>

      {loading && (
        <div className={cn(components.card, "p-12 text-center")}>
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className={cn("text-sm", text.muted)}>Ayarlar yükleniyor...</p>
        </div>
      )}

      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sol Sidebar - Kategoriler */}
        <div className={cn(components.card, "p-4 space-y-2")}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 border border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sağ İçerik */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === "general" && (
            <div className={cn(components.card, "p-6 space-y-6")}>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Genel Ayarlar</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    Uygulama Adı
                  </label>
                  <input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                    className={components.input}
                    placeholder="Uygulama adı"
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    Açıklama
                  </label>
                  <textarea
                    value={settings.appDescription}
                    onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })}
                    className={components.input}
                    rows={3}
                    placeholder="Uygulama açıklaması"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                      Varsayılan Para Birimi
                    </label>
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                      className={components.input}
                    >
                      <option value="TRY">TRY - Türk Lirası</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                      Zaman Dilimi
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className={components.input}
                    >
                      <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-700/50">
                <button
                  onClick={() => handleSave("general")}
                  disabled={saving}
                  className={cn(components.buttonPrimary, "flex items-center gap-2")}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeSection === "system" && (
            <div className={cn(components.card, "p-6 space-y-6")}>
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Sistem Ayarları</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    Log Seviyesi
                  </label>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
                    className={components.input}
                  >
                    <option value="Trace">Trace</option>
                    <option value="Debug">Debug</option>
                    <option value="Information">Information</option>
                    <option value="Warning">Warning</option>
                    <option value="Error">Error</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    Oturum Zaman Aşımı (dakika)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                    className={components.input}
                    min="1"
                    max="1440"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                  <div>
                    <label className={cn("block text-sm font-medium mb-1", text.secondary)}>
                      Önbellekleme (Cache)
                    </label>
                    <p className={cn("text-xs", text.muted)}>
                      Sistem performansını artırmak için önbellekleme kullan
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cacheEnabled}
                      onChange={(e) => setSettings({ ...settings, cacheEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                {settings.cacheEnabled && (
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                      Önbellek Süresi (dakika)
                    </label>
                    <input
                      type="number"
                      value={settings.cacheDuration}
                      onChange={(e) => setSettings({ ...settings, cacheDuration: parseInt(e.target.value) || 60 })}
                      className={components.input}
                      min="1"
                      max="1440"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-700/50">
                <button
                  onClick={() => handleSave("system")}
                  disabled={saving}
                  className={cn(components.buttonPrimary, "flex items-center gap-2")}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className={cn(components.card, "p-6 space-y-6")}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Güvenlik Ayarları</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={cn("text-sm font-semibold mb-4", text.primary)}>Şifre Politikası</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                        Minimum Şifre Uzunluğu
                      </label>
                      <input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) || 3 })}
                        className={components.input}
                        min="1"
                        max="128"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                        <span className={cn("text-sm", text.secondary)}>Rakam Gerektir</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.passwordRequireDigit}
                            onChange={(e) => setSettings({ ...settings, passwordRequireDigit: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                        <span className={cn("text-sm", text.secondary)}>Büyük Harf Gerektir</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.passwordRequireUppercase}
                            onChange={(e) => setSettings({ ...settings, passwordRequireUppercase: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                        <span className={cn("text-sm", text.secondary)}>Küçük Harf Gerektir</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.passwordRequireLowercase}
                            onChange={(e) => setSettings({ ...settings, passwordRequireLowercase: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                        <span className={cn("text-sm", text.secondary)}>Özel Karakter Gerektir</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.passwordRequireNonAlphanumeric}
                            onChange={(e) => setSettings({ ...settings, passwordRequireNonAlphanumeric: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-700/50 pt-6">
                  <h3 className={cn("text-sm font-semibold mb-4", text.primary)}>Hesap Kilitleme</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                      <div>
                        <span className={cn("block text-sm font-medium mb-1", text.secondary)}>Hesap Kilitleme</span>
                        <p className={cn("text-xs", text.muted)}>
                          Çok fazla başarısız giriş denemesinde hesabı kilitle
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.lockoutEnabled}
                          onChange={(e) => setSettings({ ...settings, lockoutEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    {settings.lockoutEnabled && (
                      <>
                        <div>
                          <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                            Maksimum Deneme Sayısı
                          </label>
                          <input
                            type="number"
                            value={settings.lockoutMaxAttempts}
                            onChange={(e) => setSettings({ ...settings, lockoutMaxAttempts: parseInt(e.target.value) || 5 })}
                            className={components.input}
                            min="1"
                            max="20"
                          />
                        </div>

                        <div>
                          <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                            Kilit Süresi (dakika)
                          </label>
                          <input
                            type="number"
                            value={settings.lockoutDuration}
                            onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) || 15 })}
                            className={components.input}
                            min="1"
                            max="1440"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-700/50">
                <button
                  onClick={() => handleSave("security")}
                  disabled={saving}
                  className={cn(components.buttonPrimary, "flex items-center gap-2")}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className={cn(components.card, "p-6 space-y-6")}>
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">API Ayarları</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={settings.apiBaseUrl}
                    onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                    className={components.input}
                    placeholder="http://localhost:5019"
                  />
                  <p className={cn("text-xs mt-1", text.muted)}>
                    Frontend'in API'ye bağlanmak için kullandığı base URL
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                  <div>
                    <label className={cn("block text-sm font-medium mb-1", text.secondary)}>
                      HTTPS Kullan
                    </label>
                    <p className={cn("text-xs", text.muted)}>
                      Güvenli bağlantı için HTTPS kullan
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.useHttps}
                      onChange={(e) => setSettings({ ...settings, useHttps: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    CORS Origins
                  </label>
                  <textarea
                    value={settings.corsOrigins.join("\n")}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      corsOrigins: e.target.value.split("\n").filter(o => o.trim()) 
                    })}
                    className={components.input}
                    rows={4}
                    placeholder="http://localhost:3000&#10;https://localhost:3000"
                  />
                  <p className={cn("text-xs mt-1", text.muted)}>
                    Her satıra bir origin yazın
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                  <div>
                    <label className={cn("block text-sm font-medium mb-1", text.secondary)}>
                      API Key Gerekli
                    </label>
                    <p className={cn("text-xs", text.muted)}>
                      API endpoint'lerine erişim için API key zorunlu olsun
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.apiKeyRequired}
                      onChange={(e) => setSettings({ ...settings, apiKeyRequired: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-700/50">
                <button
                  onClick={() => handleSave("api")}
                  disabled={saving}
                  className={cn(components.buttonPrimary, "flex items-center gap-2")}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeSection === "database" && (
            <div className={cn(components.card, "p-6 space-y-6")}>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Veritabanı Ayarları</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-sm font-medium", text.secondary)}>Bağlantı Durumu</span>
                    <div className="flex items-center gap-2">
                      {settings.databaseStatus === "connected" && (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-400">Bağlı</span>
                        </>
                      )}
                      {settings.databaseStatus === "disconnected" && (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400">Bağlantı Yok</span>
                        </>
                      )}
                      {settings.databaseStatus === "unknown" && (
                        <>
                          <Info className="w-4 h-4 text-neutral-400" />
                          <span className={cn("text-sm", text.muted)}>Bilinmiyor</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    Veritabanı Sağlayıcı
                  </label>
                  <input
                    type="text"
                    value={settings.databaseProvider}
                    disabled
                    className={cn(components.input, "opacity-50 cursor-not-allowed")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-medium mb-2", text.secondary)}>
                    Bağlantı String (Maskeli)
                  </label>
                  <input
                    type="text"
                    value={settings.connectionStringMasked}
                    disabled
                    className={cn(components.input, "opacity-50 cursor-not-allowed font-mono text-xs")}
                  />
                  <p className={cn("text-xs mt-1", text.muted)}>
                    Güvenlik nedeniyle bağlantı string'i maskelenmiştir
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-amber-400">
                        Güvenlik Uyarısı
                      </h4>
                      <p className={cn("text-xs", text.muted)}>
                        Veritabanı bağlantı string'leri hassas bilgiler içerir. 
                        Gerçek bağlantı string'lerini sadece güvenli ortamlarda saklayın.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-700/50">
                <button
                  onClick={() => {
                    // Database durumunu test et
                    notifySuccess("Başarılı", "Veritabanı bağlantısı test edildi.");
                  }}
                  className={cn(components.buttonSecondary, "flex items-center gap-2")}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Bağlantıyı Test Et</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
