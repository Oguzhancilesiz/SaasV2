// API Configuration
export const API_CONFIG = {
  // API base URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5019/api',
  
  // App ID - DEMO_APP için
  APP_ID: import.meta.env.VITE_APP_ID || '455234cf-f7bc-4c83-93ad-6f4da5d1f803',   // DEMO_APP ID
  
  // API Key - Environment variable'dan alınmalı, asla kod içinde hardcode edilmemeli
  // Production'da mutlaka environment variable kullanılmalı
  // Format: prefix_hash (son alt çizgiden sonrası hash kısmı)
  // Örnek format: prefix_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  API_KEY: import.meta.env.VITE_API_KEY || '',
};

// API Headers
export const getApiHeaders = () => {
  const apiKey = API_CONFIG.API_KEY
  
  if (!apiKey) {
    console.error('❌ API Key bulunamadı! Lütfen API Key girin.')
    console.log('💡 API\'yi başlattığınızda console\'da görünecek API Key\'i config/api.ts dosyasına ekleyin.')
  } else {
    // API Key formatını kontrol et ve parse et
    const lastUnderscoreIndex = apiKey.lastIndexOf('_')
    if (lastUnderscoreIndex < 0 || lastUnderscoreIndex === apiKey.length - 1) {
      console.warn('⚠️ API Key formatı hatalı. Format: prefix_hash (son alt çizgiden sonrası hash)')
    } else {
      const prefix = apiKey.substring(0, lastUnderscoreIndex)
      const hash = apiKey.substring(lastUnderscoreIndex + 1)
      console.log('✅ API Key parse edildi:', {
        prefix,
        hashLength: hash.length,
        fullKey: `${apiKey.substring(0, 30)}...`,
      })
    }
  }
  
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'X-App-Id': API_CONFIG.APP_ID,
  };
};

