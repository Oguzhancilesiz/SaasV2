import type { AuthUserResponse } from '../services/authService'

const USER_STORAGE_KEY = 'saas_user_data'

export const userStorage = {
  // Kullanıcı bilgilerini kaydet
  saveUser: (user: AuthUserResponse) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save user data:', error)
    }
  },

  // Kullanıcı bilgilerini al
  getUser: (): AuthUserResponse | null => {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY)
      if (!data) return null
      return JSON.parse(data) as AuthUserResponse
    } catch (error) {
      console.error('Failed to read user data:', error)
      return null
    }
  },

  // Kullanıcı ID'sini al
  getUserId: (): string | null => {
    const user = userStorage.getUser()
    return user?.userId || null
  },

  // Kullanıcı bilgilerini temizle
  clearUser: () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear user data:', error)
    }
  },

  // Kullanıcı giriş yapmış mı kontrol et
  isAuthenticated: (): boolean => {
    return userStorage.getUser() !== null
  },
}

