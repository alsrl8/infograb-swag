'use client';

import { useEffect, useState } from 'react';
import { products, totalStock } from '../lib/products';
import { participants } from '../lib/participants';

type Receipt = { id: string; product: string; name: string; created_at: string; received: number; note: string };

export default function Home() {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [passedNames, setPassedNames] = useState<string[]>([]);
  const [absentNames, setAbsentNames] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [device, setDevice] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [receivedIds, setReceivedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState('전체');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  async function refresh() {
    const [response, passResponse, absenceResponse] = await Promise.all([
      fetch('/api/receipts', { cache: 'no-store' }),
      fetch('/api/passes', { cache: 'no-store' }),
      fetch('/api/absences', { cache: 'no-store' }),
    ]);
    if (!response.ok || !passResponse.ok || !absenceResponse.ok) throw new Error('현황을 불러오지 못했습니다. 다시 시도해주세요.');
    const receipts = await response.json() as Receipt[];
    setRows(receipts);
    setPassedNames(await passResponse.json() as string[]);
    setAbsentNames(await absenceResponse.json() as string[]);
    setReady(true);
    return receipts;
  }

  useEffect(() => {
    let key = localStorage.getItem('swag-device');
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem('swag-device', key);
    }
    setDevice(key);
    const update = () => refresh().catch(error => setMessage(error.message));
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  function chooseName(person: string) {
    const own = rows.filter(row => row.name === person);
    setReceivedIds(own.filter(row => row.received === 1).map(row => row.product));
    setName(person);
    setSelected(rows.filter(row => row.name === person).map(row => row.product));
    setMessage('');
    setFilter('전체');
    window.scrollTo(0, 0);
  }

  function back() {
    const saved = rows.filter(row => row.name === name).map(row => row.product);
    const savedReceived = rows.filter(row => row.name === name && row.received === 1).map(row => row.product);
    const dirty = receivedIds.length !== savedReceived.length || receivedIds.some(id => !savedReceived.includes(id)) || selected.length !== saved.length || selected.some(id => !saved.includes(id));
    if (dirty && !window.confirm('저장하지 않은 선택이 있습니다. 이름 선택으로 돌아갈까요?')) return;
    setName('');
    setMessage('');
    window.scrollTo(0, 0);
  }

  function toggle(id: string) {
    setReceivedIds(current => current.filter(product => product !== id));
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setMessage('');
  }

  async function save(pass = false, absent = false) {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(absent ? '/api/absences' : '/api/receipts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(absent ? { name, device } : { name, device, products: pass ? [] : selected, pass, receivedProducts: pass ? [] : receivedIds.filter(id => selected.includes(id)) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '저장하지 못했습니다. 다시 시도해주세요.');
      await refresh();
      setName('');
      setSelected([]);
      setMessage(absent ? '부재로 보류했습니다. 기존 상품 선택은 유지됩니다.' : pass ? '양보했습니다. 완료로 표시됩니다.' : '저장했습니다. 상품별 수령 상태에 반영되었어요.');
      window.scrollTo(0, 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const pendingNames = new Set(rows.filter(row => row.received === 0).map(row => row.name));
  const completed = new Set([...rows.map(row => row.name), ...passedNames].filter(person => !pendingNames.has(person) && !absentNames.includes(person)));
  const taken = rows.filter(row => products.some(product => product.id === row.product && product.stock !== null)).length;

  return <main>
    <header className="app-header">
      {name ? <button className="back" onClick={back} disabled={saving} aria-label="이름 선택으로 돌아가기">‹</button> : <span className="brand">infograb<span>®</span></span>}
      <strong>{name ? `${name}의 스웩` : 'n8n 스웩 나눔'}</strong>
      {name ? <div className="header-actions"><button className="pass" onClick={() => save(true)} disabled={saving || !ready}>양보</button><button className="pass absent" onClick={() => save(false, true)} disabled={saving || !ready}>부재</button><button className="save" onClick={() => save()} disabled={saving || !ready}>{saving ? '저장 중…' : '저장'}</button></div> : <span className="header-mark">🎁</span>}
    </header>

    {!name ? <>
      <section className="intro">
        <span className="eyebrow">STEP 01 · 내 이름 선택</span>
        <h1>반가워요!<br/>내 이름을 찾아주세요.</h1>
        <p>사다리 결과 순서대로 나열했어요.<br/>본인 이름을 누르면 상품 선택으로 넘어갑니다.</p>
        <div className="legend"><span>● 완료 · 🟡 미수령 · 부재는 보류</span><span>{completed.size} / {participants.length}명</span></div>
      </section>
      <div role="status" className="message">{message || (!ready ? '수령 현황을 불러오는 중…' : '')}</div>
      <section className="participants" aria-label="사다리 순서별 이름 선택">
        {participants.map((person, index) => <button key={person} className={`person ${absentNames.includes(person) ? 'absent-person' : completed.has(person) ? 'complete' : rows.some(row => row.name === person) ? 'pending' : ''}`} onClick={() => chooseName(person)} disabled={!ready}>
          <span className="rank">{String(index + 1).padStart(2, '0')}</span>
          <span className="person-name">{person}</span>
          <span className="person-status">{absentNames.includes(person) ? '부재 · 보류' : pendingNames.has(person) ? (passedNames.includes(person) ? '양보 · 초콜릿 미수령' : '선택 완료 · 미수령') : passedNames.includes(person) ? '✓ 양보 완료' : completed.has(person) ? '✓ 수령 완료' : '선택 ›'}</span>
        </button>)}
      </section>
      <footer>THANK YOU, PENNY & APRIL ♥<p>저장한 수령 현황은 모두에게 공유됩니다.</p></footer>
    </> : <>
      <section className="intro product-intro">
        <span className="eyebrow">STEP 02 · 상품 선택 및 수령 확인</span>
        <h1>어떤 스웩을<br/>골랐나요?</h1>
        <p>카드를 눌러 체크하고, 위의 <b>저장</b>을 눌러주세요.</p>
        <div className="counts"><span><b>{selected.length}</b>개 선택</span><span>선택 가능 <b>{totalStock - taken}</b> / {totalStock}개</span></div>
      </section>
      {absentNames.includes(name) && <aside className="absence-notice">부재로 보류 중이에요. 선택을 확인하고 저장하면 보류가 해제됩니다.</aside>}
      <section className="receipt-status" aria-label="수령 상태">
        <strong>상품별 수령 확인</strong>
        <p>골라만 뒀다면 미수령으로 두세요. 카드 오른쪽 위의 미수령 버튼을 눌러 수령 상태를 바꾼 뒤 저장해주세요.</p>
      </section>
      <aside>🎁 스웩 1개 + 스티커 · 초콜릿은 박스형, Ritter 각각 1개씩</aside>
      <div className="filters" aria-label="상품 분류">{['전체', '피규어', '가방', '모자', '의류', '기타', '초콜릿'].map(category => <button key={category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>
      <div role="status" className="message">{message || '선택 후 헤더의 저장 버튼을 눌러야 반영됩니다.'}</div>
      <section className="products" aria-label="상품 선택">
        {products.filter(product => filter === '전체' || product.category === filter).map(product => {
          const checked = selected.includes(product.id);
          const receipts = rows.filter(row => row.product === product.id);
          const saved = receipts.some(row => row.name === name);
          const remaining = product.stock === null ? null : product.stock - receipts.length;
          const soldOut = remaining === 0 && !saved;
          return <article key={product.id} className="product-entry">
            <button type="button" className={`receipt-corner ${receivedIds.includes(product.id) && checked ? 'collected' : ''}`} disabled={saving || !checked} aria-label={`${product.name} ${checked && receivedIds.includes(product.id) ? '수령 완료, 미수령으로 변경' : '미수령, 수령 완료로 변경'}`} aria-pressed={checked && receivedIds.includes(product.id)} onClick={() => {
              setReceivedIds(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id]);
              setMessage('');
            }}>{checked && receivedIds.includes(product.id) ? '✓ 수령 완료' : '미수령'}</button>
            <button type="button" className={`product ${checked ? 'checked' : ''}`} aria-pressed={checked} disabled={saving || (soldOut && !checked)} onClick={() => toggle(product.id)}>
            <div className="visual"><span>{product.icon}</span><span className="check">{checked ? '✓' : ''}</span></div>
            <div className="product-info">
              <span className="stock">{remaining === null ? (product.id === 'sticker' ? '선착순 소진' : '1인 1개') : `${remaining}개 남음 / ${product.stock}개`}</span>
              <h2>{product.name}</h2>
              <span className="selection">{checked ? '선택했어요' : soldOut ? '모두 가져갔어요' : '눌러서 체크'}</span>
              <span className="receivers">{receipts.length ? receipts.map(row => `${row.name} (${row.received ? '수령' : '미수령'}${row.note ? ' · ' + row.note : ''})`).join(', ') : '아직 수령한 사람이 없어요'}</span>
            </div>
          </button>

          </article>;
        })}
      </section>
      <footer>선택한 기기에서 수령 내역을 수정할 수 있어요.</footer>
    </>}
  </main>;
}
