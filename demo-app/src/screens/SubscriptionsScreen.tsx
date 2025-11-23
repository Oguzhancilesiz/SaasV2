import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import { planService } from '../services/planService'
import { planPriceService } from '../services/planPriceService'
import type { Subscription } from '../types/subscription'
import type { Plan } from '../services/planService'
import PaymentModal from '../components/PaymentModal'
import SubscriptionHistoryScreen from './SubscriptionHistoryScreen'
import { API_CONFIG } from '../config/api'
import './SubscriptionsScreen.css'

export default function SubscriptionsScreen() {
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [showPlans, setShowPlans] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'history'>('subscriptions')

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    // Önce localStorage'dan kullanıcı bilgilerini al
    const { userStorage } = await import('../utils/userStorage')
    const user = userStorage.getUser()
    
    if (user && user.userId) {
      setUserId(user.userId)
      await loadData(user.userId)
    } else {
      setError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.')
      // Kullanıcı bilgileri yoksa logout event'i gönder
      window.dispatchEvent(new CustomEvent('logout'))
    }
  }

  const loadData = async (currentUserId: string) => {
    setLoading(true)
    setError('')
    
    try {
      const appId = API_CONFIG.APP_ID
      if (!appId) {
        setError('App ID bulunamadı')
        return
      }

      // Aktif aboneliği kontrol et
      const activeSubResponse = await subscriptionService.getActive(appId, currentUserId)
      if (activeSubResponse.data) {
        // Subscription items'ı yükle
        const itemsResponse = await subscriptionService.getItems(activeSubResponse.data.id)
        if (itemsResponse.data) {
          activeSubResponse.data.items = itemsResponse.data
        }
        setActiveSubscription(activeSubResponse.data)
        setShowPlans(false)
      } else {
        // Aktif abonelik yoksa planları yükle
        await loadPlans(appId)
        setShowPlans(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadPlans = async (appId: string) => {
    try {
      const response = await planService.getAll(appId)
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        let activePlans = response.data.filter(p => p.isPublic && p.status === 1)
        
        // Eğer aktif abonelik varsa, free planları filtrele
        if (activeSubscription) {
          // Free planları filtrele
          activePlans = activePlans.filter(p => !p.isFree)
        }
        
        // Her plan için fiyat bilgisini yükle
        const plansWithPrices = await Promise.all(
          activePlans.map(async (plan) => {
            if (plan.isFree) {
              return { ...plan, price: { amount: 0, currency: 'TRY' } }
            }
            
            const priceResponse = await planPriceService.getCurrentPrice(plan.id)
            if (priceResponse) {
              const currencyMap: Record<number, string> = {
                0: 'TRY',
                1: 'USD',
                2: 'EUR',
              }
              return {
                ...plan,
                price: {
                  amount: priceResponse.amount,
                  currency: currencyMap[priceResponse.currency] || 'TRY',
                },
              }
            }
            return plan
          })
        )
        
        // Aktif planı en başa ekle (eğer varsa)
        if (activeSubscription) {
          const activePlan = plansWithPrices.find(p => p.id === activeSubscription.planId)
          if (activePlan) {
            // Aktif plan zaten listede, sıralamayı değiştir
            const otherPlans = plansWithPrices.filter(p => p.id !== activeSubscription.planId)
            setPlans([activePlan, ...otherPlans])
          } else {
            // Aktif plan listede yoksa, ekle
            const allPlans = response.data.filter(p => p.id === activeSubscription.planId)
            if (allPlans.length > 0) {
              const activePlanData = allPlans[0]
              let activePlanWithPrice = { ...activePlanData }
              
              if (!activePlanData.isFree) {
                const priceResponse = await planPriceService.getCurrentPrice(activePlanData.id)
                if (priceResponse) {
                  const currencyMap: Record<number, string> = {
                    0: 'TRY',
                    1: 'USD',
                    2: 'EUR',
                  }
                  activePlanWithPrice = {
                    ...activePlanData,
                    price: {
                      amount: priceResponse.amount,
                      currency: currencyMap[priceResponse.currency] || 'TRY',
                    },
                  }
                }
              } else {
                activePlanWithPrice = { ...activePlanData, price: { amount: 0, currency: 'TRY' } }
              }
              
              setPlans([activePlanWithPrice, ...plansWithPrices])
            } else {
              setPlans(plansWithPrices)
            }
          }
        } else {
          setPlans(plansWithPrices)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planlar yüklenirken bir hata oluştu')
    }
  }

  const handleUpgrade = async () => {
    if (!API_CONFIG.APP_ID) {
      setError('App ID bulunamadı')
      return
    }
    await loadPlans(API_CONFIG.APP_ID)
    setShowPlans(true)
  }

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
  }

  const handlePurchaseClick = () => {
    if (!selectedPlan) {
      setError('Lütfen bir plan seçin')
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    if (!selectedPlan || !userId || !API_CONFIG.APP_ID) {
      setError('Eksik bilgi: Plan, kullanıcı veya App ID bulunamadı')
      return
    }

    setCreating(true)
    setError('')
    setShowPaymentModal(false)

    try {
      const startDate = new Date()
      const endDate = new Date()
      
      // Billing period'a göre bitiş tarihini hesapla
      // 0: Monthly, 1: Yearly, 2: Weekly, 3: Daily
      if (selectedPlan.billingPeriod === 0) { // Monthly
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (selectedPlan.billingPeriod === 1) { // Yearly
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else if (selectedPlan.billingPeriod === 2) { // Weekly
        endDate.setDate(endDate.getDate() + 7)
      } else if (selectedPlan.billingPeriod === 3) { // Daily
        endDate.setDate(endDate.getDate() + 1)
      }

      const response = await subscriptionService.create({
        appId: API_CONFIG.APP_ID,
        userId: userId,
        planId: selectedPlan.id,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        renewalPolicy: selectedPlan.renewalPolicy || 0, // Auto
        externalPaymentRef: `payment_${Date.now()}`, // Ödeme referansı
      })

      if (response.error) {
        setError(response.error)
        setShowPaymentModal(true) // Hata varsa modal'ı tekrar aç
      } else if (response.data) {
        alert('Abonelik başarıyla oluşturuldu!')
        // Verileri yenile
        await loadData(userId)
        setSelectedPlan(null)
        setShowPlans(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik oluşturulurken bir hata oluştu')
      setShowPaymentModal(true) // Hata varsa modal'ı tekrar aç
    } finally {
      setCreating(false)
    }
  }

  const calculateRemainingDays = (endDate?: string) => {
    if (!endDate) return null
    try {
      const end = new Date(endDate)
      const now = new Date()
      const diff = end.getTime() - now.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return days > 0 ? days : 0
    } catch {
      return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status?: number) => {
    // Status: 1 = Active, 2 = Canceled, etc.
    if (status === 1) {
      return <span className="status-badge status-active">Aktif</span>
    } else if (status === 2) {
      return <span className="status-badge status-canceled">İptal Edildi</span>
    }
    return <span className="status-badge status-unknown">Bilinmiyor</span>
  }

  const getBillingPeriodText = (period: number) => {
    const periodMap: Record<number, string> = {
      0: 'Aylık',
      1: 'Yıllık',
      2: 'Haftalık',
      3: 'Günlük',
    }
    return periodMap[period] || 'Bilinmiyor'
  }

  if (loading && !activeSubscription && plans.length === 0) {
    return (
      <div className="subscriptions-screen">
        <div className="subscriptions-header">
          <h1 className="subscriptions-title">Aboneliklerim</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const remainingDays = activeSubscription?.endAt 
    ? calculateRemainingDays(activeSubscription.endAt)
    : activeSubscription?.currentPeriodEnd
    ? calculateRemainingDays(activeSubscription.currentPeriodEnd)
    : null

  // Eğer history tab'ı seçiliyse, history screen'i göster
  if (activeTab === 'history') {
    return <SubscriptionHistoryScreen />
  }

  return (
    <div className="subscriptions-screen">
      {showPaymentModal && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => {
            setShowPaymentModal(false)
            if (!creating) {
              setSelectedPlan(null)
            }
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div className="subscriptions-header">
        <h1 className="subscriptions-title">Aboneliklerim</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!showPlans && (
            <button className="refresh-btn" onClick={() => loadData(userId)} disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="subscriptions-tabs">
        <button
          className={`subscription-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Abonelikler
        </button>
        <button
          className={`subscription-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Geçmiş
        </button>
      </div>

      <div className="subscriptions-content">
        {error && (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={() => loadData(userId)}>
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Aktif Abonelik Gösterimi */}
        {activeSubscription && !showPlans && (
          <div className="active-subscription-section">
            <div className="subscription-card active">
              <div className="subscription-header-card">
                <div>
                  <h2 className="subscription-name-large">
                    {activeSubscription.planName || 'Aktif Abonelik'}
                  </h2>
                  {getStatusBadge(activeSubscription.status)}
                </div>
              </div>

              {/* Kalan Süre ve Kullanım Bilgileri */}
              {remainingDays !== null && (
                <div className="subscription-remaining">
                  <div className="remaining-badge">
                    <span className="remaining-label">Kalan Süre:</span>
                    <span className="remaining-value">{remainingDays} gün</span>
                  </div>
                </div>
              )}

              <div className="subscription-details">
                <div className="detail-item">
                  <span className="detail-label">Başlangıç Tarihi:</span>
                  <span className="detail-value">{formatDate(activeSubscription.startAt)}</span>
                </div>
                {activeSubscription.currentPeriodStart && (
                  <div className="detail-item">
                    <span className="detail-label">Dönem Başlangıç:</span>
                    <span className="detail-value">{formatDate(activeSubscription.currentPeriodStart)}</span>
                  </div>
                )}
                {activeSubscription.currentPeriodEnd && (
                  <div className="detail-item">
                    <span className="detail-label">Dönem Bitiş:</span>
                    <span className="detail-value">{formatDate(activeSubscription.currentPeriodEnd)}</span>
                  </div>
                )}
                {activeSubscription.endAt && (
                  <div className="detail-item">
                    <span className="detail-label">Bitiş Tarihi:</span>
                    <span className="detail-value">{formatDate(activeSubscription.endAt)}</span>
                  </div>
                )}
                {activeSubscription.trialEndsAt && (
                  <div className="detail-item">
                    <span className="detail-label">Deneme Bitiş:</span>
                    <span className="detail-value">{formatDate(activeSubscription.trialEndsAt)}</span>
                  </div>
                )}
                {activeSubscription.renewAt && (
                  <div className="detail-item">
                    <span className="detail-label">Yenileme Tarihi:</span>
                    <span className="detail-value">{formatDate(activeSubscription.renewAt)}</span>
                  </div>
                )}
              </div>

              {activeSubscription.items && activeSubscription.items.length > 0 && (
                <div className="subscription-items">
                  <h4 className="items-title">Kullanım Hakları:</h4>
                  <div className="items-list">
                    {activeSubscription.items.map((item, index) => (
                      <div key={index} className="item-card">
                        <div className="item-header">
                          <span className="item-name">{item.featureName || `Özellik ${index + 1}`}</span>
                          <span className="item-quantity">{item.quantity > 0 ? item.quantity : 'Sınırsız'}</span>
                        </div>
                        {item.quantity > 0 && (
                          <div className="item-progress">
                            <div className="item-progress-bar">
                              <div 
                                className="item-progress-fill" 
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <span className="item-progress-text">
                              {item.quantity} kullanım hakkı
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="upgrade-btn" 
                onClick={handleUpgrade}
                disabled={loading}
              >
                🔼 Aboneliği Yükselt
              </button>
            </div>
          </div>
        )}

        {/* Plan Listesi */}
        {showPlans && (
          <div className="plans-section">
            <h2 className="plans-section-title">
              {activeSubscription ? 'Yeni Plan Seçin' : 'Mevcut Planlar'}
            </h2>
            
            {plans.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">📭</div>
                <p className="empty-text">
                  {activeSubscription 
                    ? 'Yükseltilebilecek başka plan bulunmuyor' 
                    : 'Henüz plan bulunmuyor'}
                </p>
              </div>
            ) : (
              <div className="plans-grid">
                {plans.map((plan) => {
                  const isActivePlan = activeSubscription && plan.id === activeSubscription.planId
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''} ${isActivePlan ? 'active-plan' : ''}`}
                      onClick={() => !isActivePlan && handleSelectPlan(plan)}
                    >
                      <div className="plan-header">
                        <h3 className="plan-name">{plan.name}</h3>
                        {isActivePlan ? (
                          <span className="plan-badge active">Aktif</span>
                        ) : plan.isFree ? (
                          <span className="plan-badge free">Ücretsiz</span>
                        ) : null}
                      </div>
                      
                      {plan.description && (
                        <p className="plan-description">{plan.description}</p>
                      )}

                      <div className="plan-price-section">
                        {plan.isFree ? (
                          <div className="plan-price-display free">
                            <span className="price-amount">Ücretsiz</span>
                          </div>
                        ) : plan.price ? (
                          <div className="plan-price-display">
                            <span className="price-amount">{plan.price.amount.toFixed(2)} {plan.price.currency}</span>
                            <span className="price-period">/ {getBillingPeriodText(plan.billingPeriod).toLowerCase()}</span>
                          </div>
                        ) : (
                          <div className="plan-price-display">
                            <span className="price-amount">Fiyat bilgisi yok</span>
                          </div>
                        )}
                      </div>

                      <div className="plan-features">
                        <div className="plan-feature">
                          <span className="feature-label">Faturalama:</span>
                          <span className="feature-value">{getBillingPeriodText(plan.billingPeriod)}</span>
                        </div>
                        {plan.trialDays > 0 && (
                          <div className="plan-feature">
                            <span className="feature-label">Deneme Süresi:</span>
                            <span className="feature-value">{plan.trialDays} gün</span>
                          </div>
                        )}
                      </div>

                      {isActivePlan ? (
                        <div className="active-plan-indicator">
                          <span className="active-text">Aktif</span>
                        </div>
                      ) : (
                        <button 
                          className="purchase-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectPlan(plan)
                            handlePurchaseClick()
                          }}
                          disabled={creating}
                        >
                          💳 Satın Al
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeSubscription && (
              <button 
                className="cancel-upgrade-btn"
                onClick={() => setShowPlans(false)}
              >
                İptal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
