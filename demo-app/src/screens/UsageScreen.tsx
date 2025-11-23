import { useState, useEffect } from 'react'
import { usageRecordService } from '../services/usageRecordService'
import type { UsageRecord } from '../types/usageRecord'
import { API_CONFIG } from '../config/api'
import './UsageScreen.css'

export default function UsageScreen() {
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadUsageRecords()
  }, [])

  const loadUsageRecords = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Kullanıcı ID'sini localStorage'dan al
      const { userStorage } = await import('../utils/userStorage')
      const userId = userStorage.getUserId()
      
      if (!userId) {
        setError('Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.')
        window.dispatchEvent(new CustomEvent('logout'))
        return
      }
      
      const response = await usageRecordService.getAll(
        API_CONFIG.APP_ID || undefined,
        userId
      )

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setUsageRecords(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanım kayıtları yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
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

  return (
    <div className="usage-screen">
      <div className="usage-header">
        <h1 className="usage-title">Kullanım Kayıtları</h1>
        <button className="refresh-btn" onClick={loadUsageRecords} disabled={loading}>
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="usage-content">
        {loading && usageRecords.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={loadUsageRecords}>
              Tekrar Dene
            </button>
          </div>
        ) : usageRecords.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">📊</div>
            <p className="empty-text">Henüz kullanım kaydı bulunmuyor</p>
          </div>
        ) : (
          <div className="usage-list">
            {usageRecords.map((record) => (
              <div key={record.id} className="usage-card">
                <div className="usage-header-card">
                  <h3 className="usage-feature-name">
                    {record.featureName || 'Özellik'}
                  </h3>
                  <span className="usage-quantity">{record.quantity || 0}</span>
                </div>

                <div className="usage-details">
                  <div className="detail-item">
                    <span className="detail-label">Tarih:</span>
                    <span className="detail-value">{formatDate(record.recordedAt)}</span>
                  </div>
                  {record.correlationId && (
                    <div className="detail-item">
                      <span className="detail-label">İşlem ID:</span>
                      <span className="detail-value">{record.correlationId}</span>
                    </div>
                  )}
                  {record.metadataJson && (
                    <div className="detail-item">
                      <span className="detail-label">Metadata:</span>
                      <span className="detail-value metadata-value">
                        {record.metadataJson.length > 50 
                          ? record.metadataJson.substring(0, 50) + '...'
                          : record.metadataJson}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

