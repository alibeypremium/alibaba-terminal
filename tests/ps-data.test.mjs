// .github/scripts/ps.mjs içindeki saf fonksiyonların birim testleri (ağ yok).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRow, pct } from '../.github/scripts/ps.mjs';

const prod = (over = {}) => ({
  id: 'EP1-X', name: '  Test   Oyunu  ', platforms: ['PS5', 'PS4'],
  price: { basePrice: '1.079,00 TL', discountedPrice: '755,30 TL' },
  media: [{ role: 'MASTER', type: 'IMAGE', url: 'https://image.api.playstation.com/vulcan/img/a.png?w=100' }, { role: 'PORTRAIT_BANNER', type: 'IMAGE', url: 'https://image.api.playstation.com/vulcan/img/p.png' }],
  skus: [], ...over,
});

test('toRow: TL fiyatlarını sayıya çevirir, boşlukları temizler, dikey görseli seçer', () => {
  const r = toRow(prod());
  assert.equal(r.n, 'Test Oyunu');
  assert.equal(r.base, 1079);
  assert.equal(r.now, 755);                       // 755,30 yuvarlanır
  assert.equal(r.im, 'vulcan/img/p.png');         // PORTRAIT_BANNER öncelikli, sorgu dizesi atılır
  assert.equal(r.pl, '54');
  assert.equal(pct(r), 30);                       // (1 - 755/1079) ≈ %30
});

test('toRow: indirimsiz, ön siparişli ve eksik verili ürünler', () => {
  const r = toRow(prod({ price: { basePrice: '300,00 TL', discountedPrice: '300,00 TL' }, skus: [{ type: 'PREORDER' }] }));
  assert.equal(pct(r), 0);
  assert.equal(r.pre, true);
  assert.equal(toRow({ name: 'x' }), null);        // id yok
  assert.equal(toRow({ id: '1', name: 'Ücretsiz', price: {} }).base, 0);
});
