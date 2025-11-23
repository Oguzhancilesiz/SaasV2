import { useState, useEffect } from 'react'
import { userStorage } from '../utils/userStorage'
import type { AuthUserResponse } from '../services/authService'
import './ProfileScreen.css'

export default function ProfileScreen() {
  const [user, setUser] = useState<AuthUserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = () => {
    setLoading(true)
    setError('')
    
    try {
      const userData = userStorage.getUser()
      if (userData) {
        setUser(userData)
      } else {
        setError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.')
        window.dispatchEvent(new CustomEvent('logout'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı bilgileri yüklenirken bir hata oluştu')
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
      <div className="profile-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1 className="profile-title">Profil</h1>
      </div>

      <div className="profile-content">
        {error ? (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={loadUser}>
              Tekrar Dene
            </button>
          </div>
        ) : user ? (
          <>
            <div className="profile-card">
              <div className="profile-avatar">
                <span className="avatar-icon">👤</span>
              </div>
              <h2 className="profile-name">{user.userName}</h2>
              {user.email && (
                <p className="profile-email">{user.email}</p>
              )}
            </div>

            <div className="profile-info-card">
              <h3 className="info-title">Hesap Bilgileri</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Kullanıcı ID:</span>
                  <span className="info-value">{user.userId}</span>
                </div>
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
                    <div className="roles-list">
                      {user.roles.map((role, index) => (
                        <span key={index} className="role-badge">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-actions">
              <button className="action-btn primary" onClick={loadUser}>
                🔄 Bilgileri Yenile
              </button>
              <button className="action-btn danger" onClick={handleLogout}>
                🚪 Çıkış Yap
              </button>
            </div>
          </>
        ) : (
          <div className="empty-container">
            <div className="empty-icon">👤</div>
            <p className="empty-text">Kullanıcı bilgileri bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  )
}

