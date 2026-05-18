'use client';

import { useEffect, useMemo, useState } from 'react';

type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: string;
  importance: number;
  summary: string;
  why: string;
  impact: string;
  action: string;
};

type NewsResponse = {
  refreshedAt: string;
  briefing: string;
  items: NewsItem[];
  error?: string;
};

const categories = ['全部', '今日必看', '科技AI', '政治国际', 'A股经济', '影视AI行业', '生活风险'];

function formatTime(value?: string) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function importanceLabel(score: number) {
  if (score >= 85) return '必须看';
  if (score >= 70) return '重点看';
  if (score >= 55) return '可关注';
  return '一般';
}

export default function Home() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [lastError, setLastError] = useState('');

  async function loadNews() {
    try {
      setLoading(true);
      setLastError('');
      const res = await fetch(`/api/news?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '请求失败');
      setData(json);
    } catch (error: any) {
      setLastError(error?.message || '刷新失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
    const timer = window.setInterval(loadNews, 10 * 60 * 1000);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const list = data?.items || [];
    return list.filter((item) => {
      const categoryOk = category === '全部' || item.category === category;
      const queryOk = !query || `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(query.toLowerCase());
      return categoryOk && queryOk;
    });
  }, [data, category, query]);

  const topItems = (data?.items || []).slice(0, 3);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">升日 · 每日消息 Agent</p>
          <h1>打开就有消息，自动更新。</h1>
          <p className="subtitle">按“重要性 + 对你是否有用”排序，不只是新闻标题。</p>
        </div>
        <button className="refresh" onClick={loadNews} disabled={loading}>
          {loading ? '刷新中...' : '立即刷新'}
        </button>
      </section>

      <section className="briefing card">
        <div className="briefingTop">
          <span>今日一句话</span>
          <span>北京时间 {formatTime(data?.refreshedAt)}</span>
        </div>
        <p>{data?.briefing || '正在获取最新消息...'}</p>
        {lastError && <p className="error">{lastError}</p>}
      </section>

      <section className="grid3">
        {topItems.map((item, index) => (
          <a className="topCard" href={item.link} target="_blank" rel="noreferrer" key={item.id}>
            <span>TOP {index + 1}</span>
            <strong>{item.title}</strong>
            <em>{item.category} · {importanceLabel(item.importance)}</em>
          </a>
        ))}
      </section>

      <section className="toolbar">
        <div className="chips">
          {categories.map((cat) => (
            <button key={cat} className={cat === category ? 'active' : ''} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索关键词：AI、A股、美国、影视..." />
      </section>

      <section className="newsList">
        {filtered.map((item) => (
          <article className="newsCard" key={item.id}>
            <div className="newsHead">
              <div>
                <span className="category">{item.category}</span>
                <span className="time">{formatTime(item.publishedAt)} · {item.source}</span>
              </div>
              <div className="score">
                <b>{item.importance}</b>
                <small>{importanceLabel(item.importance)}</small>
              </div>
            </div>
            <h2>{item.title}</h2>
            <p className="summary">{item.summary}</p>
            <div className="analysis">
              <div><b>为什么重要</b><p>{item.why}</p></div>
              <div><b>可能影响</b><p>{item.impact}</p></div>
              <div><b>你该怎么做</b><p>{item.action}</p></div>
            </div>
            <a className="read" href={item.link} target="_blank" rel="noreferrer">打开原文</a>
          </article>
        ))}
        {!loading && filtered.length === 0 && <div className="empty">当前筛选没有结果，换个分类或关键词。</div>}
      </section>
    </main>
  );
}
