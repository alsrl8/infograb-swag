'use client';

import { useEffect, useState } from 'react';
import { products } from '../../lib/products';
import { summarizeProduct, wishes, wishSource, type Receipt } from '../../lib/summary';
import './summary.css';

export default function Summary() {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [absent, setAbsent] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');
  const [filter, setFilter] = useState('전체');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const responses = await Promise.all(['/api/receipts', '/api/absences'].map(url => fetch(url, { cache: 'no-store' })));
        if (responses.some(response => !response.ok)) throw new Error('현황을 불러오지 못했습니다. 잠시 후 자동으로 다시 확인합니다.');
        const [receipts, absences] = await Promise.all([
          responses[0].json() as Promise<Receipt[]>,
          responses[1].json() as Promise<string[]>,
        ]);
        if (!active) return;
        setRows(receipts); setAbsent(absences); setError('');
        setUpdated(new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' }));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : '현황을 불러오지 못했습니다.');
      }
    }
    void refresh();
    const timer = setInterval(refresh, 10000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const items = products.map(product => ({ ...product, ...summarizeProduct(product.stock, rows.filter(row => row.product === product.id)) }));
  const ready = !!updated;
  const available = items.reduce((sum, item) => sum + (item.available ?? 0), 0);
  const pending = rows.filter(row => row.received !== 1);
  const shown = items.filter(item => {
    const matchesFilter = filter === '전체' || (filter === '남은 상품' && (item.available === null || item.available > 0)) || (filter === '미수령' && item.pending.length > 0) || (filter === '희망 있음' && wishes.some(wish => wish.product === item.id));
    const text = [item.name, ...item.collected.map(row => row.name), ...item.pending.map(row => row.name), ...wishes.filter(wish => wish.product === item.id).map(wish => wish.name)].join(' ');
    return matchesFilter && text.toLowerCase().includes(query.trim().toLowerCase());
  });
  function names(receipts: Receipt[]) {
    return receipts.length ? receipts.map(row => <span className="summary-name" key={row.id}>{row.name}{row.note && <small>{row.note}</small>}</span>) : <span className="summary-empty">없음</span>;
  }

  return <main className="summary-page">
    <header className="summary-header"><a href="/">← 수령 체크</a><strong>스웩 정리</strong><a href={wishSource} target="_blank" rel="noreferrer">Slack 원문 ↗</a></header>
    <section className="summary-intro"><span className="eyebrow">DAISY & PENNY</span><h1>남은 스웩과<br />챙겨줄 사람, 한눈에.</h1><p>선택 내역은 10초마다 갱신됩니다. 희망 사항은 Slack과 Miles의 요청을 정리한 내용입니다.</p><p className="summary-updated" role="status">{error || (ready ? `${updated} (한국 시간) 갱신` : '현황을 불러오는 중…')}{error && ready ? ' · 아래는 마지막으로 확인한 현황입니다.' : ''}</p></section>
    <section className="summary-totals" aria-label="전체 현황"><div><b>{ready ? available : '—'}</b><span>추가 선택 가능</span></div><div><b>{ready ? pending.length : '—'}</b><span>미수령 상품</span></div><div><b>{ready ? new Set(pending.map(row => row.name)).size : '—'}</b><span>챙겨줄 사람</span></div></section>
    <p className="summary-help">추가 선택 가능 수량은 미수령으로 확보한 몫까지 제외한 수량입니다. 초콜릿·스티커는 총수량이 등록되지 않아 합계에서 제외합니다.</p>
    <section className="summary-wishes" aria-labelledby="wish-title"><h2 id="wish-title">전달 전에 확인할 희망 사항</h2><p>희망 표시는 재고를 확보하지 않습니다. 아래 선택·수령 내역과 대조해주세요.</p><ul>{wishes.map(wish => <li key={`${wish.name}-${wish.product}`}><strong>{wish.name}</strong><span>{wish.detail}<small>{wish.source}</small></span></li>)}</ul>{ready && rows.some(row => row.name === 'Owen' && row.product === 'cap-space') && <p>Owen의 우주선 모자 선택은 Slack 요청과 달라 확인이 필요합니다.</p>}{ready && absent.includes('Eva') && <p>Eva는 부재 해제 후 선택 저장이 필요합니다.</p>}</section>
    <section className="summary-controls" aria-label="현황 검색"><label htmlFor="summary-search">상품 또는 이름 찾기</label><input id="summary-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: 모자, Eva" /><div className="summary-filters">{['전체', '남은 상품', '미수령', '희망 있음'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div></section>
    {ready && <section className="summary-grid" aria-label="상품별 남은 수량과 수령 현황">{shown.map(item => <article className="summary-item" key={item.id}><div className="summary-item-title"><h2>{item.icon} {item.name}</h2><span className={item.available === 0 ? 'summary-stock empty' : 'summary-stock'}>{item.available === null ? '총수량 미등록' : `선택 가능 ${item.available}개`}</span></div><p className="summary-breakdown">{item.stock === null ? '잔여 수량은 실물 확인이 필요해요.' : `전체 ${item.stock}개 · 수령 ${item.collected.length}개 · 미수령 ${item.pending.length}개 · 아직 전달 전 ${item.uncollected}개`}</p><dl><div><dt>가져간 사람</dt><dd>{names(item.collected)}</dd></div><div><dt>선택 · 미수령</dt><dd>{names(item.pending)}</dd></div><div><dt>희망한 사람</dt><dd>{wishes.filter(wish => wish.product === item.id).length ? wishes.filter(wish => wish.product === item.id).map(wish => <span className="summary-wish-name" key={wish.name}>{wish.name}{wish.name === 'Miles' ? ' (조건부)' : ''}</span>) : <span className="summary-empty">별도 요청 없음</span>}</dd></div></dl></article>)}{shown.length === 0 && <p>검색 조건에 맞는 상품이 없습니다.</p>}</section>}
    {ready && <section className="summary-absence"><h2>부재로 보류 중</h2><p>{absent.length ? absent.join(', ') : '없음'}</p></section>}
    <footer>수령 여부는 저장된 체크 기준입니다. 실제 전달 후 수령 체크를 반영해주세요.</footer>
  </main>;
}
