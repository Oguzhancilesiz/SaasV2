import { useState, useEffect } from 'react'
import { userStorage } from '../utils/userStorage'
import type { Plan } from '../services/planService'
import './PaymentModal.css'

const getBillingPeriodText = (period: number) => {
  const periodMap: Record<number, string> = {
    0: 'Aylık',
    1: 'Yıllık',
    2: 'Haftalık',
    3: 'Günlük',
  }
  return periodMap[period] || 'Bilinmiyor'
}

type PaymentModalProps = {
  plan: Plan | null
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ plan, onClose, onSuccess }: PaymentModalProps) {
  const [user, setUser] = useState<{ userName: string; email?: string } | null>(null)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '4242 4242 4242 4242',
    cardHolder: '',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    address: 'Demo Caddesi No:123',
    city: 'İstanbul',
    zipCode: '34000',
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Kullanıcı bilgilerini yükle ve demo bilgilerle doldur
    const userData = userStorage.getUser()
    if (userData) {
      setUser(userData)
      // Kullanıcı adını büyük harfe çevir ve demo bilgilerle doldur
      const cardHolderName = userData.userName 
        ? userData.userName.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1).toUpperCase()).join(' ')
        : 'DEMO KULLANICI'
      
      setPaymentData(prev => ({
        ...prev,
        cardHolder: cardHolderName,
        address: userData.email 
          ? `${userData.email.split('@')[0].charAt(0).toUpperCase() + userData.email.split('@')[0].slice(1)} Mahallesi, Demo Sokak No:123, Kadıköy` 
          : 'Demo Caddesi No:123, Kadıköy',
      }))
    } else {
      // Kullanıcı yoksa tam demo bilgiler
      setPaymentData(prev => ({
        ...prev,
        cardHolder: 'DEMO KULLANICI',
        address: 'Demo Caddesi No:123, Kadıköy',
      }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return

    setProcessing(true)
    setError('')

    try {
      // Simüle edilmiş ödeme işlemi
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Başarılı - callback'i çağır
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme işlemi başarısız')
    } finally {
      setProcessing(false)
    }
  }

  if (!plan) return null

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2 className="payment-modal-title">Ödeme</h2>
          <button className="payment-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payment-modal-content">
          <div className="payment-plan-info">
            <h3 className="payment-plan-name">{plan.name}</h3>
            {plan.description && (
              <p className="payment-plan-desc">{plan.description}</p>
            )}
            {plan.isFree ? (
              <div className="payment-price">
                <span className="price-amount">Ücretsiz</span>
              </div>
            ) : plan.price ? (
              <div className="payment-price">
                <span className="price-label">Fiyat:</span>
                <span className="price-amount">{plan.price.amount.toFixed(2)} {plan.price.currency}</span>
                <span className="price-period">/ {getBillingPeriodText(plan.billingPeriod).toLowerCase()}</span>
              </div>
            ) : (
              <div className="payment-price">
                <span className="price-label">Fiyat:</span>
                <span className="price-amount">Fiyat bilgisi yok</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="payment-form-section">
              <h4 className="payment-section-title">Kart Bilgileri</h4>
              
              <div className="payment-form-group">
                <label htmlFor="cardNumber">Kart Numarası</label>
                <input
                  id="cardNumber"
                  type="text"
                  value={paymentData.cardNumber}
                  onChange={(e) => {
                    // Sadece rakamları al
                    const numbers = e.target.value.replace(/\D/g, '')
                    // 4'erli gruplara ayır
                    const formatted = numbers.match(/.{1,4}/g)?.join(' ') || numbers
                    setPaymentData({ ...paymentData, cardNumber: formatted.substring(0, 19) })
                  }}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                  disabled={processing}
                  className="payment-input"
                />
              </div>

              <div className="payment-form-group">
                <label htmlFor="cardHolder">Kart Sahibi</label>
                <input
                  id="cardHolder"
                  type="text"
                  value={paymentData.cardHolder}
                  onChange={(e) => setPaymentData({ ...paymentData, cardHolder: e.target.value })}
                  placeholder="Ad Soyad"
                  required
                  disabled={processing}
                  className="payment-input"
                />
              </div>

              <div className="payment-form-row">
                <div className="payment-form-group">
                  <label htmlFor="expiryMonth">Ay</label>
                  <select
                    id="expiryMonth"
                    value={paymentData.expiryMonth}
                    onChange={(e) => setPaymentData({ ...paymentData, expiryMonth: e.target.value })}
                    required
                    disabled={processing}
                    className="payment-input"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={String(month).padStart(2, '0')}>
                        {String(month).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="payment-form-group">
                  <label htmlFor="expiryYear">Yıl</label>
                  <select
                    id="expiryYear"
                    value={paymentData.expiryYear}
                    onChange={(e) => setPaymentData({ ...paymentData, expiryYear: e.target.value })}
                    required
                    disabled={processing}
                    className="payment-input"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="payment-form-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    id="cvv"
                    type="text"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, '') })}
                    placeholder="123"
                    maxLength={4}
                    required
                    disabled={processing}
                    className="payment-input"
                  />
                </div>
              </div>
            </div>

            <div className="payment-form-section">
              <h4 className="payment-section-title">Fatura Bilgileri</h4>
              
              <div className="payment-form-group">
                <label htmlFor="address">Adres</label>
                <input
                  id="address"
                  type="text"
                  value={paymentData.address}
                  onChange={(e) => setPaymentData({ ...paymentData, address: e.target.value })}
                  placeholder="Adres"
                  required
                  disabled={processing}
                  className="payment-input"
                />
              </div>

              <div className="payment-form-row">
                <div className="payment-form-group">
                  <label htmlFor="city">Şehir</label>
                  <input
                    id="city"
                    type="text"
                    value={paymentData.city}
                    onChange={(e) => setPaymentData({ ...paymentData, city: e.target.value })}
                    placeholder="Şehir"
                    required
                    disabled={processing}
                    className="payment-input"
                  />
                </div>

                <div className="payment-form-group">
                  <label htmlFor="zipCode">Posta Kodu</label>
                  <input
                    id="zipCode"
                    type="text"
                    value={paymentData.zipCode}
                    onChange={(e) => setPaymentData({ ...paymentData, zipCode: e.target.value })}
                    placeholder="34000"
                    required
                    disabled={processing}
                    className="payment-input"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="payment-error">
                {error}
              </div>
            )}

            <div className="payment-modal-actions">
              <button
                type="button"
                className="payment-cancel-btn"
                onClick={onClose}
                disabled={processing}
              >
                İptal
              </button>
              <button
                type="submit"
                className="payment-submit-btn"
                disabled={processing}
              >
                {processing ? 'İşleniyor...' : 'Satın Al'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

