import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import { invoiceService } from '../services/invoiceService'
import { planService } from '../services/planService'
import { planPriceService } from '../services/planPriceService'
import type { Subscription } from '../types/subscription'
import type { Invoice } from '../services/invoiceService'
import { API_CONFIG } from '../config/api'
import './SubscriptionHistoryScreen.css'

interface SubscriptionChangeLog {
  id: string
  subscriptionId: string
  changeType: number
  oldPlanId?: string
  newPlanId?: string
  effectiveDate: string
  oldAmount?: number
  newAmount?: number
  currency?: number
  reason?: string
  createdDate: string
}

export default function SubscriptionHistoryScreen() {
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null)
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceLines, setInvoiceLines] = useState<Record<string, any[]>>({})
  const [changeLogs, setChangeLogs] = useState<SubscriptionChangeLog[]>([])
  const [activeSubscriptionChangeLog, setActiveSubscriptionChangeLog] = useState<SubscriptionChangeLog | null>(null)
  const [oldPlanName, setOldPlanName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices' | 'changes'>('subscriptions')

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    const { userStorage } = await import('../utils/userStorage')
    const user = userStorage.getUser()
    
    console.log('👤 Kullanıcı bilgileri:', user)
    
    if (user && user.userId) {
      console.log('👤 UserId:', user.userId, 'Type:', typeof user.userId)
      setUserId(user.userId)
      await loadData(user.userId)
    } else {
      console.error('❌ Kullanıcı bilgileri bulunamadı')
      setError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.')
      window.dispatchEvent(new CustomEvent('logout'))
    }
  }

  const loadData = async (currentUserId: string) => {
    setLoading(true)
    setError('')
    
    console.log('🔄 loadData başlatıldı - UserId:', currentUserId)
    
    try {
      const appId = API_CONFIG.APP_ID
      if (!appId) {
        setError('App ID bulunamadı')
        console.error('❌ App ID bulunamadı')
        return
      }

      console.log('📦 App ID:', appId)

      // Aktif aboneliği yükle
      console.log('📋 Aktif abonelik yükleniyor...')
      const activeSubResponse = await subscriptionService.getActive(appId, currentUserId)
      if (activeSubResponse.data) {
        // Plan ismini yükle
        try {
          const planResponse = await planService.getById(activeSubResponse.data.planId)
          if (planResponse.data) {
            activeSubResponse.data.planName = planResponse.data.name
          }
        } catch (err) {
          console.error('Plan yüklenemedi:', err)
        }
        
        setActiveSubscription(activeSubResponse.data)
        
        // Aktif abonelik için change log'ları yükle
        try {
          const changesResponse = await subscriptionService.getChanges(activeSubResponse.data.id)
          if (changesResponse.data && changesResponse.data.length > 0) {
            // Plan değişikliği (changeType = 2) olan en son kaydı bul
            const planChange = changesResponse.data
              .filter((log: SubscriptionChangeLog) => log.changeType === 2) // PlanChanged
              .sort((a: SubscriptionChangeLog, b: SubscriptionChangeLog) => 
                new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
              )[0]
            
            if (planChange) {
              setActiveSubscriptionChangeLog(planChange)
              
              // Eski plan adını yükle
              if (planChange.oldPlanId) {
                try {
                  const oldPlanResponse = await planService.getById(planChange.oldPlanId)
                  if (oldPlanResponse.data) {
                    setOldPlanName(oldPlanResponse.data.name)
                  }
                } catch (err) {
                  console.error('Eski plan yüklenemedi:', err)
                }
              }
            }
          }
        } catch (err) {
          console.error('Change log yüklenemedi:', err)
        }
      }

      // Tüm abonelikleri yükle
      console.log('📋 Tüm abonelikler yükleniyor...')
      const allSubsResponse = await subscriptionService.getByUser(currentUserId)
      console.log('📋 Abonelikler yanıtı:', { hasData: !!allSubsResponse.data, count: allSubsResponse.data?.length || 0 })
      if (allSubsResponse.data) {
        // Plan isimlerini yükle
        const subscriptionsWithPlans = await Promise.all(
          allSubsResponse.data.map(async (sub) => {
            try {
              const planResponse = await planService.getById(sub.planId)
              if (planResponse.data) {
                return { ...sub, planName: planResponse.data.name }
              }
            } catch (err) {
              console.error('Plan yüklenemedi:', err)
            }
            return sub
          })
        )
        setAllSubscriptions(subscriptionsWithPlans)
        
        // Her abonelik için change log'ları yükle
        const allChangeLogs: SubscriptionChangeLog[] = []
        for (const sub of subscriptionsWithPlans) {
          try {
            const changesResponse = await subscriptionService.getChanges(sub.id)
            if (changesResponse.data) {
              allChangeLogs.push(...changesResponse.data)
            }
          } catch (err) {
            console.error('Change log yüklenemedi:', err)
          }
        }
        // Tarihe göre sırala (en yeni en üstte)
        allChangeLogs.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        setChangeLogs(allChangeLogs)
      }

      // Faturaları yükle - EN ÖNEMLİ KISIM
      console.log('📄 ========== FATURA YÜKLEME BAŞLIYOR ==========')
      console.log('📄 Faturalar yükleniyor - UserId:', currentUserId)
      console.log('📄 UserId tipi:', typeof currentUserId)
      console.log('📄 UserId uzunluğu:', currentUserId.length)
      console.log('📄 API URL:', `/invoices/by-user/${currentUserId}`)
      
      try {
        const invoicesResponse = await invoiceService.getByUser(currentUserId)
        console.log('📄 Fatura API yanıtı (tam):', invoicesResponse)
        console.log('📄 Fatura API yanıtı (özet):', {
          hasError: !!invoicesResponse.error,
          hasData: !!invoicesResponse.data,
          dataLength: invoicesResponse.data?.length || 0,
          dataType: Array.isArray(invoicesResponse.data) ? 'array' : typeof invoicesResponse.data,
          error: invoicesResponse.error,
          status: invoicesResponse.status,
          rawData: invoicesResponse.data
        })
        
        if (invoicesResponse.error) {
          console.error('❌ Fatura yükleme hatası:', invoicesResponse.error)
          setError(`Fatura yükleme hatası: ${invoicesResponse.error}`)
        } else if (invoicesResponse.data) {
          // Tarihe göre sırala (en yeni en üstte)
          const sortedInvoices = invoicesResponse.data.sort(
            (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          )
          setInvoices(sortedInvoices)
          console.log('✅ Faturalar yüklendi:', sortedInvoices.length, 'fatura')
          console.log('📋 Fatura detayları:', sortedInvoices.map(inv => ({
            id: inv.id.substring(0, 8),
            total: inv.total,
            currency: inv.currency,
            status: inv.paymentStatus,
            createdDate: inv.createdDate
          })))
          
          // Her fatura için satırları yükle
          const linesMap: Record<string, any[]> = {}
          for (const invoice of sortedInvoices) {
            try {
              const linesResponse = await invoiceService.getLines(invoice.id)
              if (linesResponse.data) {
                linesMap[invoice.id] = linesResponse.data
                console.log(`✅ Fatura satırları yüklendi - InvoiceId: ${invoice.id.substring(0, 8)}, Satır sayısı: ${linesResponse.data.length}`)
              }
            } catch (err) {
              console.error(`❌ Fatura satırları yüklenemedi (${invoice.id.substring(0, 8)}):`, err)
            }
          }
          setInvoiceLines(linesMap)
        } else {
          console.log('ℹ️ Fatura bulunamadı - API boş döndü veya data yok')
          console.log('📄 Response detayı:', invoicesResponse)
        }
      } catch (err) {
        console.error('❌ Fatura yükleme exception:', err)
        console.error('❌ Exception detayı:', {
          message: err instanceof Error ? err.message : 'Bilinmeyen hata',
          stack: err instanceof Error ? err.stack : undefined,
          name: err instanceof Error ? err.name : undefined
        })
        setError(`Fatura yükleme hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`)
      }
      
      console.log('📄 ========== FATURA YÜKLEME TAMAMLANDI ==========')
    } catch (err) {
      console.error('❌ loadData genel hata:', err)
      console.error('❌ Hata detayı:', {
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
      console.log('✅ loadData tamamlandı')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number, currency: number) => {
    const currencyMap: Record<number, string> = {
      0: 'TRY',
      1: 'USD',
      2: 'EUR',
    }
    const currencySymbol = currencyMap[currency] || 'TRY'
    return `${amount.toFixed(2)} ${currencySymbol}`
  }

  const getChangeTypeText = (changeType: number) => {
    const typeMap: Record<number, string> = {
      0: 'Oluşturuldu',
      1: 'Yenilendi',
      2: 'Plan Değiştirildi',
      3: 'İptal Edildi',
      4: 'Aktif Edildi',
      5: 'Fiyat Güncellendi',
      6: 'Manuel Düzenleme',
    }
    return typeMap[changeType] || 'Bilinmiyor'
  }

  const getPaymentStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: 'Beklemede',
      1: 'Ödendi',
      2: 'Başarısız',
      3: 'İptal Edildi',
      4: 'İade Edildi',
    }
    return statusMap[status] || 'Bilinmiyor'
  }

  const getPaymentStatusClass = (status: number) => {
    const classMap: Record<number, string> = {
      0: 'status-pending',
      1: 'status-paid',
      2: 'status-failed',
      3: 'status-canceled',
      4: 'status-refunded',
    }
    return classMap[status] || 'status-unknown'
  }

  const getRenewalPolicyText = (policy: number) => {
    const policyMap: Record<number, string> = {
      0: 'Otomatik Yenileme',
      1: 'Manuel Yenileme',
      2: 'Yenileme Yok',
    }
    return policyMap[policy] || 'Bilinmiyor'
  }

  if (loading && allSubscriptions.length === 0 && invoices.length === 0) {
    return (
      <div className="subscription-history-screen">
        <div className="history-header">
          <h1 className="history-title">Satın Alma Geçmişi</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="subscription-history-screen">
      <div className="history-header">
        <h1 className="history-title">Satın Alma Geçmişi</h1>
        <button className="refresh-btn" onClick={() => loadData(userId)} disabled={loading}>
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="history-content">
        {error && (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={() => loadData(userId)}>
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Aktif Abonelik Özeti */}
        {activeSubscription && (
          <div className="active-subscription-summary">
            <h2 className="summary-title">Aktif Abonelik</h2>
            <div className="summary-card">
              <div className="summary-row">
                <span className="summary-label">Plan:</span>
                <span className="summary-value">{activeSubscription.planName || 'Aktif Plan'}</span>
              </div>
              
              {/* Eski Plan Bilgisi (Eğer plan değiştirilmişse) */}
              {activeSubscriptionChangeLog && oldPlanName && (
                <>
                  <div className="summary-row highlight">
                    <span className="summary-label">Önceki Plan:</span>
                    <span className="summary-value">{oldPlanName}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="summary-label">Değişiklik Tarihi:</span>
                    <span className="summary-value">{formatDate(activeSubscriptionChangeLog.effectiveDate)}</span>
                  </div>
                  {activeSubscriptionChangeLog.oldAmount !== null && activeSubscriptionChangeLog.oldAmount !== undefined && (
                    <div className="summary-row highlight">
                      <span className="summary-label">Önceki Fiyat:</span>
                      <span className="summary-value">
                        {formatCurrency(
                          activeSubscriptionChangeLog.oldAmount,
                          activeSubscriptionChangeLog.currency || 0
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div className="summary-row">
                <span className="summary-label">Başlangıç:</span>
                <span className="summary-value">{formatDate(activeSubscription.startAt)}</span>
              </div>
              {activeSubscription.endAt && (
                <div className="summary-row">
                  <span className="summary-label">Bitiş:</span>
                  <span className="summary-value">{formatDate(activeSubscription.endAt)}</span>
                </div>
              )}
              {activeSubscription.renewAt && (
                <div className="summary-row">
                  <span className="summary-label">Yenileme:</span>
                  <span className="summary-value">{formatDate(activeSubscription.renewAt)}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label">Yenileme Politikası:</span>
                <span className="summary-value">
                  {getRenewalPolicyText(activeSubscription.renewalPolicy || 0)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Fiyat:</span>
                <span className="summary-value">
                  {formatCurrency(activeSubscription.unitPrice || 0, activeSubscription.currency || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="history-tabs">
          <button
            className={`history-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Abonelikler ({allSubscriptions.length})
          </button>
          <button
            className={`history-tab ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Faturalar ({invoices.length})
          </button>
          <button
            className={`history-tab ${activeTab === 'changes' ? 'active' : ''}`}
            onClick={() => setActiveTab('changes')}
          >
            Değişiklikler ({changeLogs.length})
          </button>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="history-section">
            {allSubscriptions.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">📭</div>
                <p className="empty-text">Henüz abonelik bulunmuyor</p>
              </div>
            ) : (
              <div className="history-list">
                {allSubscriptions.map((sub) => (
                  <div key={sub.id} className="history-item">
                    <div className="history-item-header">
                      <h3 className="history-item-title">
                        {sub.planName || 'Abonelik'}
                      </h3>
                      <span className={`status-badge ${sub.status === 1 ? 'status-active' : 'status-inactive'}`}>
                        {sub.status === 1 ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div className="history-item-details">
                      <div className="detail-row">
                        <span className="detail-label">Başlangıç:</span>
                        <span className="detail-value">{formatDate(sub.startAt)}</span>
                      </div>
                      {sub.endAt && (
                        <div className="detail-row">
                          <span className="detail-label">Bitiş:</span>
                          <span className="detail-value">{formatDate(sub.endAt)}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Fiyat:</span>
                        <span className="detail-value">
                          {formatCurrency(sub.unitPrice || 0, sub.currency || 0)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Yenileme:</span>
                        <span className="detail-value">
                          {getRenewalPolicyText(sub.renewalPolicy || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="history-section">
            {invoices.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">📄</div>
                <p className="empty-text">Henüz fatura bulunmuyor</p>
              </div>
            ) : (
              <div className="history-list">
                {invoices.map((invoice) => {
                  const lines = invoiceLines[invoice.id] || []
                  
                  return (
                    <div key={invoice.id} className="history-item invoice-item">
                      <div className="history-item-header">
                        <h3 className="history-item-title">
                          Fatura #{invoice.id.substring(0, 8).toUpperCase()}
                        </h3>
                        <span className={`status-badge ${getPaymentStatusClass(invoice.paymentStatus)}`}>
                          {getPaymentStatusText(invoice.paymentStatus)}
                        </span>
                      </div>
                      <div className="history-item-details">
                        <div className="detail-row">
                          <span className="detail-label">Fatura Tarihi:</span>
                          <span className="detail-value">{formatDate(invoice.createdDate)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Dönem:</span>
                          <span className="detail-value">
                            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Ara Toplam:</span>
                          <span className="detail-value">
                            {formatCurrency(invoice.subtotal, invoice.currency)}
                          </span>
                        </div>
                        {invoice.tax > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Vergi:</span>
                            <span className="detail-value">
                              {formatCurrency(invoice.tax, invoice.currency)}
                            </span>
                          </div>
                        )}
                        <div className="detail-row highlight">
                          <span className="detail-label">Toplam:</span>
                          <span className="detail-value amount">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                        </div>
                        {invoice.dueDate && (
                          <div className="detail-row">
                            <span className="detail-label">Vade Tarihi:</span>
                            <span className="detail-value">{formatDate(invoice.dueDate)}</span>
                          </div>
                        )}
                        {invoice.paidAt && (
                          <div className="detail-row">
                            <span className="detail-label">Ödeme Tarihi:</span>
                            <span className="detail-value">{formatDate(invoice.paidAt)}</span>
                          </div>
                        )}
                        {invoice.paymentReference && (
                          <div className="detail-row">
                            <span className="detail-label">Ödeme Referansı:</span>
                            <span className="detail-value">{invoice.paymentReference}</span>
                          </div>
                        )}
                        {invoice.paymentProvider && (
                          <div className="detail-row">
                            <span className="detail-label">Ödeme Sağlayıcı:</span>
                            <span className="detail-value">{invoice.paymentProvider}</span>
                          </div>
                        )}
                        {invoice.paymentAttemptCount > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Ödeme Denemesi:</span>
                            <span className="detail-value">{invoice.paymentAttemptCount} kez</span>
                          </div>
                        )}
                        {invoice.lastErrorMessage && (
                          <div className="detail-row error">
                            <span className="detail-label">Hata:</span>
                            <span className="detail-value">{invoice.lastErrorMessage}</span>
                          </div>
                        )}
                        
                        {/* Fatura Satırları */}
                        {lines.length > 0 && (
                          <div className="invoice-lines">
                            <h4 className="invoice-lines-title">Fatura Detayları</h4>
                            {lines.map((line, index) => (
                              <div key={line.id || index} className="invoice-line">
                                <div className="invoice-line-description">
                                  {line.description?.split('\n').map((desc: string, i: number) => (
                                    <div key={i}>{desc}</div>
                                  )) || line.description || 'Açıklama yok'}
                                </div>
                                <div className="invoice-line-amount">
                                  <div className="invoice-line-quantity">
                                    {line.quantity} x {formatCurrency(line.unitPrice, invoice.currency)}
                                  </div>
                                  <div className="invoice-line-total">
                                    {formatCurrency(line.amount, invoice.currency)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Changes Tab */}
        {activeTab === 'changes' && (
          <div className="history-section">
            {changeLogs.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">📋</div>
                <p className="empty-text">Henüz değişiklik kaydı bulunmuyor</p>
              </div>
            ) : (
              <div className="history-list">
                {changeLogs.map((log) => (
                  <div key={log.id} className="history-item">
                    <div className="history-item-header">
                      <h3 className="history-item-title">
                        {getChangeTypeText(log.changeType)}
                      </h3>
                      <span className="history-item-date">
                        {formatDate(log.effectiveDate)}
                      </span>
                    </div>
                    <div className="history-item-details">
                      {log.oldAmount !== null && log.oldAmount !== undefined && (
                        <div className="detail-row">
                          <span className="detail-label">Eski Fiyat:</span>
                          <span className="detail-value">
                            {formatCurrency(log.oldAmount, log.currency || 0)}
                          </span>
                        </div>
                      )}
                      {log.newAmount !== null && log.newAmount !== undefined && (
                        <div className="detail-row">
                          <span className="detail-label">Yeni Fiyat:</span>
                          <span className="detail-value">
                            {formatCurrency(log.newAmount, log.currency || 0)}
                          </span>
                        </div>
                      )}
                      {log.reason && (
                        <div className="detail-row">
                          <span className="detail-label">Sebep:</span>
                          <span className="detail-value">{log.reason}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Tarih:</span>
                        <span className="detail-value">{formatDate(log.createdDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

