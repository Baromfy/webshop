# Square Payment Backend Server

Ez a szerver kezeli a Square Sandbox API-val való kommunikációt, kiküszöbölve a CORS problémákat, és lehetővé téve, hogy a fizetési API hívások megjelenjenek a Square Developer Dashboard-on.

## Telepítés

A szerver telepítéséhez kövesse az alábbi lépéseket:

```bash
# Navigálj a server mappába
cd server

# Telepítsd a függőségeket
npm install
```

## Konfigurálás

A szerver a `.env` fájlban található környezeti változókat használja a Square API hitelesítéshez és egyéb beállításokhoz.

```
# Square API Credentials
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_APPLICATION_ID=your_application_id

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Indítás

A szerver elindításához használja az alábbi parancsot:

```bash
# Fejlesztői módban futtatás (nodemon-nal automatikus újratöltéssel)
npm run dev

# VAGY

# Normál módban futtatás
npm start
```

A szerver alapértelmezetten a 3000-es porton fut, ez a `.env` fájlban módosítható.

## API Végpontok

### POST /api/payments

Ez a végpont kezeli a Square fizetéseket.

**Kérés:**

```json
{
  "sourceId": "cnon:card-nonce-ok",
  "amount": 25000,
  "currency": "HUF",
  "idempotencyKey": "optional-idempotency-key"
}
```

**Sikeres válasz (200 OK):**

```json
{
  "success": true,
  "payment": {
    "id": "GQTFp1ZlXdpoW4o6eGiZhMWwwpJ7P",
    "amount_money": {
      "amount": 25000,
      "currency": "HUF"
    },
    "status": "COMPLETED",
    "source_type": "CARD",
    "card_details": {
      "card": {
        "card_brand": "VISA",
        "last_4": "1111"
      },
      "status": "CAPTURED"
    }
  }
}
```

**Hiba válasz (400/500):**

```json
{
  "success": false,
  "message": "Hibaüzenet",
  "errors": [
    {
      "category": "PAYMENT_METHOD_ERROR",
      "code": "GENERIC_DECLINE",
      "detail": "Kártya elutasítva"
    }
  ]
}
```

### GET /api/health

Az API szerver állapotának ellenőrzésére szolgáló végpont.

**Válasz:**

```json
{
  "status": "ok",
  "message": "Square Payment Server működik",
  "environment": "development",
  "squareEnvironment": "sandbox"
}
```

## Frontend Integráció

A frontend az alábbi módon kapcsolódik a szerverhez:

1. A Square Web Payments SDK segítségével tokenizálja a kártyaadatokat
2. A tokent elküldi a backend szervernek
3. A backend szerver elküldi a kérést a Square API-nak
4. A válasz visszakerül a frontendhex

Ez a megközelítés kiküszöböli a CORS problémákat, és lehetővé teszi, hogy a fizetési API hívások megjelenjenek a Square Developer Dashboard-on.

## Tesztelés

A szervert az angular alkalmazás fizetési oldaláról lehet tesztelni. Győződjön meg róla, hogy a szerver fut, mielőtt próbál fizetni az alkalmazásban.

A teszteléshez használhatja a Square Sandbox teszt kártyaszámokat:
- Visa: 4111 1111 1111 1111
- Bármilyen jövőbeli lejárati dátum
- CVV: 111
- Irányítószám: 12345
