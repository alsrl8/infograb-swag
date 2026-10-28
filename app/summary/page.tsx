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
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const responses = await Promise.all(['/api/receipts', '/api/absences'].map(url => fetch(url, { cache: 'no-store' })));
        if (responses.some(response => !response.ok)) throw new Error('현황을 불러오지 못했습니다. 잠시 후 다시 확인합니다.');
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

  const ready = !!updated;
  function names(receipts: Receipt[]) {
    return receipts.length ? receipts.map(row => <li key={row.id}>{row.name}{row.note ? ` · ${row.note}` : ''}{absent.includes(row.name) ? ' · 부재 보류' : ''}</li>) : <li className="overview-empty">없음</li>;
  }

  return <main>
    <header className="app-header"><a className="overview-back" href="/">‹ 수령 체크</a><strong>스웩 정리</strong><a className="overview-source" href={wishSource} target="_blank" rel="noreferrer">Slack ↗</a></header>
    <section className="intro product-intro"><span className="eyebrow">DAISY & PENNY</span><h1>어떤 스웩이<br />남았나요?</h1><p>상품을 누르면 수령·미수령·희망한 사람을 볼 수 있어요.</p><div className="counts"><span>미수령으로 확보한 몫은 잔여 수량에서 제외</span></div></section>
    <div className="filters" aria-label="상품 분류">{['전체', '피규어', '가방', '모자', '의류', '기타', '초콜릿'].map(category => <button key={category} className={filter === category ? 'active' : ''} onClick={() => { setFilter(category); setOpened(null); }}>{category}</button>)}</div>
    <div role="status" className="message">{error || (ready ? `${updated} 갱신 · 10초마다 자동 갱신` : '현황을 불러오는 중…')}{error && ready ? ' · 마지막 확인 내역' : ''}</div>
    <section className="products overview-products" aria-label="상품별 남은 수량과 수령 현황">
      {products.filter(product => filter === '전체' || product.category === filter).map(product => {
        const summary = summarizeProduct(product.stock, rows.filter(row => row.product === product.id));
        const requests = wishes.filter(wish => wish.product === product.id);
        const expanded = opened === product.id;
        return <article className={`product-entry ${expanded ? 'overview-open' : ''}`} key={product.id}>
          <button type="button" className={`product ${expanded ? 'checked' : ''}`} disabled={!ready} aria-expanded={expanded} aria-controls={`details-${product.id}`} onClick={() => setOpened(expanded ? null : product.id)}>
            <div className="visual"><span>{product.icon}</span></div>
            <div className="product-info"><span className="stock">{!ready ? '수량 확인 중' : summary.available === null ? '잔여 수량 실물 확인' : `${summary.available}개 남음 / ${product.stock}개`}</span><h2>{product.name}</h2><span className="selection">{expanded ? '접기 ⌃' : '누가 골랐는지 보기 ›'}</span><span className="receivers">{ready ? `수령 ${summary.collected.length} · 미수령 ${summary.pending.length} · 희망 ${requests.length}` : '현황 확인 중'}</span></div>
          </button>
          {expanded && <div className="overview-details" id={`details-${product.id}`}>
            <section><h3>수령 완료</h3><ul>{names(summary.collected)}</ul></section>
            <section><h3>선택 · 미수령</h3><ul>{names(summary.pending)}</ul></section>
            <section><h3>희망</h3><ul>{requests.length ? requests.map(wish => <li key={wish.name}><b>{wish.name}</b><span>{wish.detail}</span><small>{wish.source}</small></li>) : <li className="overview-empty">별도 요청 없음</li>}</ul>{requests.length > 0 && <p>희망 표시는 재고를 확보하지 않아요.</p>}</section>
            {product.id === 'cap-space' && rows.some(row => row.name === 'Owen' && row.product === product.id) && <p>Owen의 모자 선택은 Slack 요청과 달라 확인이 필요해요.</p>}
            {product.id === 'cap-space' && absent.includes('Eva') && <p>Eva는 부재 해제 후 선택 저장이 필요해요.</p>}
          </div>}
        </article>;
      })}
    </section>
    <footer>희망 사항은 Slack과 Miles의 요청 기준입니다.<p>실제 전달 후 기존 수령 체크에서 반영해주세요.</p></footer>
  </main>;
}
