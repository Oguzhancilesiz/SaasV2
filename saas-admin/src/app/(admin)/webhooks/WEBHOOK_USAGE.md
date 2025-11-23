# Webhook Kullanım Kılavuzu

## Webhook Nedir?

Webhook'lar, SaaS sisteminizde önemli olaylar (events) gerçekleştiğinde, bu olayları dış sistemlere HTTP POST isteği ile bildiren mekanizmalardır.

## Nasıl Çalışır?

1. **Webhook Endpoint Oluşturma**: Admin panelinden bir webhook endpoint oluşturursunuz
2. **Event Tetikleme**: Sistemde bir olay gerçekleşir (örn: yeni abonelik oluşturuldu)
3. **Otomatik Gönderim**: Sistem bu olayı ilgili webhook endpoint'lerine otomatik gönderir
4. **Dış Sistem İşleme**: Dış sisteminiz webhook'u alır ve işler

## Event Tipleri

Sistemde şu event'ler tetiklenebilir:

- `subscription.created` - Yeni abonelik oluşturulduğunda
- `subscription.updated` - Abonelik güncellendiğinde
- `subscription.renewed` - Abonelik yenilendiğinde
- `subscription.cancelled` - Abonelik iptal edildiğinde
- `invoice.created` - Yeni fatura oluşturulduğunda
- `invoice.paid` - Fatura ödendiğinde
- `invoice.updated` - Fatura güncellendiğinde
- `usage.recorded` - Kullanım kaydedildiğinde
- `user.registered` - Yeni kullanıcı kaydolduğunda
- `webhook.ping` - Test ping için

## Webhook Endpoint Oluşturma

1. Admin panelinde **Webhooks** sayfasına gidin
2. **Yeni Webhook Endpoint** butonuna tıklayın
3. Formu doldurun:
   - **Uygulama**: Webhook'un hangi uygulama için olduğunu seçin
   - **URL**: Webhook'ların gönderileceği endpoint URL'i (örn: `https://example.com/webhook`)
   - **Secret**: Webhook isteklerini doğrulamak için secret key (opsiyonel - boş bırakılırsa otomatik oluşturulur)
   - **Event Types**: Hangi event'leri dinlemek istediğinizi virgülle ayırarak belirtin (örn: `subscription.created,invoice.paid`)
   - **Aktif**: Webhook'ların hemen gönderilmeye başlanması için işaretleyin

## Webhook İsteği Formatı

Webhook'lar şu formatta gönderilir:

### HTTP Headers
```
Content-Type: application/json
X-Webhook-Event: subscription.created
X-Webhook-Timestamp: 1234567890
X-Webhook-Signature: v1=abc123...
Idempotency-Key: unique-key-here
```

### Request Body (JSON)
```json
{
  "id": "event-id",
  "type": "subscription.created",
  "data": {
    "subscription": {
      "id": "...",
      "appId": "...",
      "userId": "...",
      "planId": "...",
      ...
    }
  },
  "occurredAt": "2024-01-01T00:00:00Z"
}
```

## Güvenlik - Signature Doğrulama

Webhook isteklerinin gerçekten sisteminizden geldiğini doğrulamak için signature kontrolü yapmalısınız:

### Node.js Örneği
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(secret, payload, timestamp, signature) {
  const data = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'base64'));
  const computed = `v1=${hmac.update(data).digest('hex')}`;
  return computed === signature;
}

// Kullanım
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = JSON.stringify(req.body);
  
  if (verifyWebhookSignature(process.env.WEBHOOK_SECRET, payload, timestamp, signature)) {
    // Webhook doğrulandı, işle
    console.log('Event:', req.headers['x-webhook-event']);
    console.log('Data:', req.body);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});
```

### Python Örneği
```python
import hmac
import hashlib
import base64

def verify_webhook_signature(secret, payload, timestamp, signature):
    data = f"{timestamp}.{payload}"
    hmac_obj = hmac.new(
        base64.b64decode(secret),
        data.encode('utf-8'),
        hashlib.sha256
    )
    computed = f"v1={hmac_obj.hexdigest()}"
    return computed == signature

# Flask örneği
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    timestamp = request.headers.get('X-Webhook-Timestamp')
    payload = json.dumps(request.json)
    
    if verify_webhook_signature(SECRET, payload, timestamp, signature):
        event_type = request.headers.get('X-Webhook-Event')
        data = request.json
        # İşle
        return 'OK', 200
    else:
        return 'Invalid signature', 401
```

## Backend'de Webhook Gönderme

Sisteminizde bir event olduğunda webhook göndermek için:

```csharp
// Örnek: Yeni abonelik oluşturulduğunda
var payload = JsonSerializer.Serialize(new {
    id = subscription.Id,
    type = "subscription.created",
    data = new {
        subscription = subscriptionDto
    },
    occurredAt = DateTime.UtcNow
});

// Tüm aktif endpoint'lere gönder
await _webhookDeliveryService.BroadcastAsync(
    appId: app.Id,
    eventType: "subscription.created",
    payloadJson: payload
);
```

## Test Etme

1. **Test Ping**: Admin panelinde webhook endpoint'inin yanındaki **Test** butonuna tıklayın
   - Bu, endpoint'inize bir test ping gönderir
   - Endpoint'iniz `200 OK` dönerse başarılı
   - `422` gibi hatalar normal olabilir (endpoint çalışıyor ama test payload'ını kabul etmiyor)

2. **Manuel Test**: Gerçek bir event tetikleyin (örn: yeni abonelik oluşturun)

## Webhook Delivery Takibi

Her webhook gönderimi `WebhookDelivery` tablosunda loglanır:
- Gönderim zamanı
- Response status
- Response body
- Retry sayısı

Başarısız gönderimler otomatik olarak yeniden denenir.

## Örnek Kullanım Senaryoları

### 1. CRM Entegrasyonu
```
Event: subscription.created
Action: CRM sisteminize yeni müşteri kaydı oluştur
```

### 2. E-posta Bildirimleri
```
Event: invoice.paid
Action: Müşteriye ödeme onay e-postası gönder
```

### 3. Analytics
```
Event: usage.recorded
Action: Analytics sisteminize kullanım verisi gönder
```

### 4. Muhasebe Entegrasyonu
```
Event: invoice.created
Action: Muhasebe sisteminize fatura kaydı oluştur
```

## Best Practices

1. **Secret Key Kullanın**: Webhook isteklerini mutlaka doğrulayın
2. **Idempotency**: Aynı event'i birden fazla işlememek için `Idempotency-Key` header'ını kullanın
3. **Hızlı Response**: Webhook endpoint'iniz 200 OK döndürmeli (uzun işlemler için async yapın)
4. **Error Handling**: Hataları loglayın ve retry mekanizması kullanın
5. **Event Filtering**: Sadece ihtiyacınız olan event'leri dinleyin

## Sorun Giderme

- **422 Hatası**: Endpoint çalışıyor ama payload formatını kabul etmiyor - normal olabilir
- **404 Hatası**: URL yanlış veya endpoint erişilemiyor
- **500 Hatası**: Endpoint'te sunucu hatası var
- **Timeout**: Endpoint çok yavaş yanıt veriyor

