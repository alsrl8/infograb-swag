export type Receipt = { id: string; product: string; name: string; received: number; note: string };

export function summarizeProduct(stock: number | null, rows: Receipt[]) {
  const collected = rows.filter(row => row.received === 1);
  const pending = rows.filter(row => row.received !== 1);
  return {
    collected, pending,
    available: stock === null ? null : stock - rows.length,
    uncollected: stock === null ? null : stock - collected.length,
  };
}

export const wishSource = 'https://infograb-lc.slack.com/archives/CA66K0YC8/p1793166265875829?thread_ts=1792761420.844329';

// Intentions from the shared thread; these never reserve stock or alter receipts.
export const wishes = [
  { name: 'Eva', product: 'cap-space', detail: '우주선 모자 1개 · 초콜릿도 함께 챙기기', source: 'Slack 요청' },
  { name: 'Owen', product: 'duck-ionos', detail: 'IONOS 오리 · 다음 주 사무실에서 수령 예정', source: 'Slack 요청' },
  { name: 'Eden', product: 'duck-n8n', detail: 'n8n 오리 추가 희망 · Penny가 오리 총 2마리 보관했다고 안내', source: 'Slack 요청·보관 안내' },
  { name: 'John', product: 'cap-n8n', detail: 'n8n 모자 1개 추가 희망', source: 'Slack 요청' },
  { name: 'Miles', product: 'cap-sendit', detail: 'send it 모자 1개 희망', source: 'Miles 확인' },
];
