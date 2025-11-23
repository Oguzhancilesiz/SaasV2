import { useState, useEffect } from 'react'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import SubscriptionsScreen from './screens/SubscriptionsScreen'
import UsageScreen from './screens/UsageScreen'
import ProfileScreen from './screens/ProfileScreen'
import BottomNavigation, { type Page } from './components/BottomNavigation'
import { userStorage } from './utils/userStorage'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('home')

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan authentication durumunu kontrol et
    checkAuthentication()

    // Logout event listener
    const handleLogout = () => {
      userStorage.clearUser()
      setIsAuthenticated(false)
      setCurrentPage('home')
    }

    // Login success listener
    const handleLoginSuccess = () => {
      setIsAuthenticated(true)
    }

    window.addEventListener('logout', handleLogout)
    window.addEventListener('login-success', handleLoginSuccess)
    
    return () => {
      window.removeEventListener('logout', handleLogout)
      window.removeEventListener('login-success', handleLoginSuccess)
    }
  }, [])

  const checkAuthentication = () => {
    // localStorage'dan kullanıcı bilgilerini kontrol et
    const user = userStorage.getUser()
    setIsAuthenticated(user !== null)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setCurrentPage('home')
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
  }

  // Authentication durumu kontrol ediliyor
  if (isAuthenticated === null) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    )
  }

  // Giriş yapılmamışsa AuthScreen göster
  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />
  }

  // Giriş yapılmışsa ana uygulama göster
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomeScreen />
      case 'subscriptions':
        return <SubscriptionsScreen />
      case 'usage':
        return <UsageScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <HomeScreen />
    }
  }

  return (
    <div className="app">
      {renderCurrentPage()}
      {isAuthenticated && <BottomNavigation currentPage={currentPage} onNavigate={handleNavigate} />}
    </div>
  )
}

export default App
