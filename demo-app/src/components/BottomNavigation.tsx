import './BottomNavigation.css'

type Page = 'home' | 'subscriptions' | 'usage' | 'profile'

type BottomNavigationProps = {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function BottomNavigation({ currentPage, onNavigate }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Ana Sayfa</span>
      </button>

      <button
        className={`nav-item ${currentPage === 'subscriptions' ? 'active' : ''}`}
        onClick={() => onNavigate('subscriptions')}
      >
        <span className="nav-icon">📋</span>
        <span className="nav-label">Abonelikler</span>
      </button>

      <button
        className={`nav-item ${currentPage === 'usage' ? 'active' : ''}`}
        onClick={() => onNavigate('usage')}
      >
        <span className="nav-icon">📊</span>
        <span className="nav-label">Kullanım</span>
      </button>

      <button
        className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profil</span>
      </button>
    </nav>
  )
}

export type { Page }

