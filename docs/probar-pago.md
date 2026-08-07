# Probar el flujo de pago sin credenciales de Flow

`scripts/flow-stub.mjs` levanta un Flow falso que implementa `payment/create` y
`payment/getStatus`, y **verifica la firma HMAC igual que Flow**, así que un error
al firmar también se detecta acá. Sirve para ejercitar todo el pipeline de pedidos
antes de tener credenciales del comercio, y para repetir la prueba después.

## Correrlo

```bash
npm run build

# Terminal 1: el Flow falso (STUB_STATUS: 2 pagada, 3 rechazada, 4 anulada)
STUB_STATUS=2 node scripts/flow-stub.mjs

# Terminal 2: la tienda apuntando al Flow falso
FLOW_API_KEY=test-key FLOW_SECRET=test-secret \
FLOW_BASE_URL=http://localhost:4599/api \
SITE_URL=http://localhost:3210 \
npx next start -p 3210
```

## Qué verificar

```bash
# 1. Crear el pago (devuelve la URL de redirección)
curl -s -X POST http://localhost:3210/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productSlug":"macetero-redondo","variantId":489,"qty":2}],
       "customer":{"email":"prueba@ejemplo.cl","name":"Prueba","phone":"+56900000000",
                   "address":"Calle 123","city":"Maipú","region":"Metropolitana de Santiago"},
       "entrega":"despacho","codigo":"MACETERO10"}'

# 2. El pedido ya debe existir como 'pending' en la tabla orders, con el subtotal,
#    el descuento y el envío calculados en el servidor.

# 3. Confirmación servidor a servidor (lo que llama Flow)
curl -s -X POST http://localhost:3210/api/checkout/confirm \
  -H "Content-Type: application/x-www-form-urlencoded" -d "token=tok_1"
# → {"ok":true,"status":"paid"} y el pedido queda 'paid' con paid_at

# 4. Reintento del mismo callback: debe responder igual y no duplicar nada.

# 5. Retorno del navegador (Flow hace POST, no GET)
curl -s -o /dev/null -X POST http://localhost:3210/api/checkout/return \
  -H "Content-Type: application/x-www-form-urlencoded" -d "token=tok_1" -w "%{redirect_url}\n"
# → 303 a /confirmacion?pedido=MM-...&estado=paid
```

## Resultados de la corrida del 6 de agosto de 2026

| Caso | Resultado |
|---|---|
| Pedido de $91.158 × 2, despacho a Maipú, código MACETERO10 | Cobra $177.074 (182.316 − 18.232 + 12.990) |
| Pedido guardado antes de ir a Flow | `pending` con líneas, dirección y totales |
| Confirmación con status 2 | Queda `paid`, con `paid_at` y `flow_order` |
| Callback repetido | Idempotente, sigue `paid` |
| Confirmación con status 3 | Queda `rejected`; la página dice "Tu pago fue rechazado", no "gracias por tu compra" |
| Sin token | 400 |
| Token desconocido | 500, para que Flow reintente en vez de dar por confirmado algo que no existe |
| Variante inexistente / cantidad negativa / producto inexistente | 400 |
| Código de descuento inventado | Se ignora: cobra el precio completo |
| Despacho sin comuna | 400 |
