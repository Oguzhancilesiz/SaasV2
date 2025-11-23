import { useState } from 'react'
import { authService } from '../services/authService'
import './AuthScreen.css'

type AuthMode = 'choice' | 'login' | 'register' | 'verify'

type AuthScreenProps = {
  onLoginSuccess?: () => void
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('choice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Login form state
  const [loginData, setLoginData] = useState({
    userName: '',
    password: '',
    rememberMe: false,
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    userName: '',
    password: '',
    passwordConfirm: '',
    email: '',
  })

  // Verification code state
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingRegistration, setPendingRegistration] = useState<{
    userName: string;
    email: string;
    password: string;
  } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authService.login({
        userName: loginData.userName,
        password: loginData.password,
        rememberMe: loginData.rememberMe,
      })

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        // Başarılı giriş - kullanıcı bilgilerini kaydet
        const { userStorage } = await import('../utils/userStorage')
        userStorage.saveUser(response.data)
        console.log('Login successful:', response.data)
        
        // Login success event'i gönder
        window.dispatchEvent(new CustomEvent('login-success'))
        
        // Login success callback'i çağır
        if (onLoginSuccess) {
          onLoginSuccess()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Şifre kontrolü
    if (registerData.password !== registerData.passwordConfirm) {
      setError('Şifreler eşleşmiyor')
      return
    }

    if (registerData.password.length < 3) {
      setError('Şifre en az 3 karakter olmalıdır')
      return
    }

    setLoading(true)

    try {
      const response = await authService.sendVerificationCode({
        userName: registerData.userName,
        email: registerData.email,
        password: registerData.password,
      })

      if (response.error) {
        setError(response.error)
      } else {
        // Doğrulama kodu gönderildi, doğrulama ekranına geç
        setPendingRegistration({
          userName: registerData.userName,
          email: registerData.email,
          password: registerData.password,
        })
        setMode('verify')
        setVerificationCode('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğrulama kodu gönderilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!pendingRegistration) {
      setError('Kayıt bilgileri bulunamadı')
      setLoading(false)
      return
    }

    if (verificationCode.length !== 6) {
      setError('Doğrulama kodu 6 haneli olmalıdır')
      setLoading(false)
      return
    }

    try {
      const response = await authService.verifyCode({
        email: pendingRegistration.email,
        code: verificationCode,
        userName: pendingRegistration.userName,
        password: pendingRegistration.password,
      })

      if (response.error) {
        setError(response.error)
      } else {
        // Başarılı kayıt
        alert('Kayıt başarılı! Giriş yapabilirsiniz.')
        // Giriş ekranına geçiş
        setMode('login')
        // Form verilerini temizle
        setRegisterData({
          userName: '',
          password: '',
          passwordConfirm: '',
          email: '',
        })
        setVerificationCode('')
        setPendingRegistration(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğrulama yapılırken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choice') {
    return (
      <div className="auth-screen">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Hoş Geldiniz</h1>
            <p className="auth-subtitle">Devam etmek için seçim yapın</p>
          </div>

          <div className="auth-buttons">
            <button
              className="auth-btn auth-btn-primary"
              onClick={() => setMode('login')}
            >
              Giriş Yap
            </button>
            <button
              className="auth-btn auth-btn-secondary"
              onClick={() => setMode('register')}
            >
              Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'login') {
    return (
      <div className="auth-screen">
        <div className="auth-container">
          <div className="auth-header">
            <button
              className="auth-back-btn"
              onClick={() => setMode('choice')}
            >
              ← Geri
            </button>
            <h1 className="auth-title">Giriş Yap</h1>
            <p className="auth-subtitle">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="login-username">Kullanıcı Adı veya E-posta</label>
              <input
                id="login-username"
                type="text"
                value={loginData.userName}
                onChange={(e) => setLoginData({ ...loginData, userName: e.target.value })}
                placeholder="Kullanıcı adı veya e-posta"
                required
                disabled={loading}
                className="auth-input"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="login-password">Şifre</label>
              <input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Şifrenizi girin"
                required
                disabled={loading}
                className="auth-input"
              />
            </div>

            <div className="auth-form-group auth-checkbox-group">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                  disabled={loading}
                  className="auth-checkbox"
                />
                <span>Beni hatırla</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn auth-btn-primary auth-btn-submit"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Hesabınız yok mu?{' '}
              <button
                className="auth-link-btn"
                onClick={() => setMode('register')}
                disabled={loading}
              >
                Kayıt Ol
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <button
            className="auth-back-btn"
            onClick={() => setMode('choice')}
          >
            ← Geri
          </button>
          <h1 className="auth-title">Kayıt Ol</h1>
          <p className="auth-subtitle">Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="auth-form-group">
            <label htmlFor="register-username">Kullanıcı Adı</label>
            <input
              id="register-username"
              type="text"
              value={registerData.userName}
              onChange={(e) => setRegisterData({ ...registerData, userName: e.target.value })}
              placeholder="Kullanıcı adı"
              required
              disabled={loading}
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="register-email">E-posta</label>
            <input
              id="register-email"
              type="email"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              placeholder="E-posta adresiniz"
              required
              disabled={loading}
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="register-password">Şifre</label>
            <input
              id="register-password"
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              placeholder="Şifrenizi oluşturun"
              required
              disabled={loading}
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="register-password-confirm">Şifre Tekrar</label>
            <input
              id="register-password-confirm"
              type="password"
              value={registerData.passwordConfirm}
              onChange={(e) => setRegisterData({ ...registerData, passwordConfirm: e.target.value })}
              placeholder="Şifrenizi tekrar girin"
              required
              disabled={loading}
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn auth-btn-primary auth-btn-submit"
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Zaten hesabınız var mı?{' '}
            <button
              className="auth-link-btn"
              onClick={() => setMode('login')}
              disabled={loading}
            >
              Giriş Yap
            </button>
          </p>
        </div>
      </div>
    </div>
  )

  if (mode === 'verify') {
    return (
      <div className="auth-screen">
        <div className="auth-container">
          <div className="auth-header">
            <button
              className="auth-back-btn"
              onClick={() => {
                setMode('register')
                setPendingRegistration(null)
                setVerificationCode('')
              }}
            >
              ← Geri
            </button>
            <h1 className="auth-title">E-posta Doğrulama</h1>
            <p className="auth-subtitle">
              {pendingRegistration?.email} adresine gönderilen doğrulama kodunu girin
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="auth-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="verification-code">Doğrulama Kodu</label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setVerificationCode(value)
                }}
                placeholder="6 haneli kod"
                required
                disabled={loading}
                className="auth-input"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="auth-btn auth-btn-primary auth-btn-submit"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Kayıt Ol'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Kod gelmedi mi?{' '}
              <button
                className="auth-link-btn"
                onClick={async () => {
                  if (pendingRegistration) {
                    setLoading(true)
                    try {
                      await authService.sendVerificationCode({
                        userName: pendingRegistration.userName,
                        email: pendingRegistration.email,
                        password: pendingRegistration.password,
                      })
                      alert('Doğrulama kodu tekrar gönderildi!')
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Kod gönderilemedi')
                    } finally {
                      setLoading(false)
                    }
                  }
                }}
                disabled={loading}
              >
                Tekrar Gönder
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }
}

