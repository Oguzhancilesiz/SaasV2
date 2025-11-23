import { useState, useEffect } from 'react'
import { userStorage } from '../utils/userStorage'
import type { AuthUserResponse } from '../services/authService'
import './HomeScreen.css'

export default function HomeScreen() {
  const [user, setUser] = useState<AuthUserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan yükle
    loadUser()
  }, [])

  const loadUser = () => {
    try {
      const userData = userStorage.getUser()
      if (userData) {
        setUser(userData)
      }
    } catch (error) {
      console.error('User load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Logout API çağrısı (opsiyonel - cookie temizleme için)
      const { authService } = await import('../services/authService')
      await authService.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Her durumda localStorage'ı temizle ve logout event'i gönder
      userStorage.clearUser()
      window.dispatchEvent(new CustomEvent('logout'))
    }
  }

  if (loading) {
    return (
      <div className="home-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-screen">
      <div className="home-header">
        <div className="home-header-content">
          <div>
            <h1 className="home-title">Hoş Geldiniz</h1>
            <p className="home-subtitle">
              {user ? `Merhaba, ${user.userName}!` : 'Merhaba!'}
            </p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Çıkış
          </button>
        </div>
      </div>

      <div className="home-content">
        <div className="home-cards">
          <div className="home-card">
            <div className="card-icon">📊</div>
            <h3 className="card-title">Aboneliklerim</h3>
            <p className="card-description">Aktif aboneliklerinizi görüntüleyin</p>
          </div>

          <div className="home-card">
            <div className="card-icon">📈</div>
            <h3 className="card-title">Kullanım İstatistikleri</h3>
            <p className="card-description">Kullanım kayıtlarınızı inceleyin</p>
          </div>

          <div className="home-card">
            <div className="card-icon">👤</div>
            <h3 className="card-title">Profil</h3>
            <p className="card-description">Hesap bilgilerinizi yönetin</p>
          </div>

          <div className="home-card">
            <div className="card-icon">⚙️</div>
            <h3 className="card-title">Ayarlar</h3>
            <p className="card-description">Uygulama ayarlarınızı düzenleyin</p>
          </div>
        </div>

        {user && (
          <div className="user-info">
            <h3 className="info-title">Hesap Bilgileri</h3>
            <div className="info-item">
              <span className="info-label">Kullanıcı Adı:</span>
              <span className="info-value">{user.userName}</span>
            </div>
            {user.email && (
              <div className="info-item">
                <span className="info-label">E-posta:</span>
                <span className="info-value">{user.email}</span>
              </div>
            )}
            {user.roles && user.roles.length > 0 && (
              <div className="info-item">
                <span className="info-label">Roller:</span>
                <span className="info-value">{user.roles.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
