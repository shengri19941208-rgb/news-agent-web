import { XMLParser } from 'fast-xml-parser';

export type NewsCategory = '今日必看' | '科技AI' | '政治国际' | 'A股经济' | '影视AI行业' | '生活风险';

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  importance: number;
  summary: string;
  why: string;
  impact: string;
  action: string;
};

type FeedConfig = {
  category: NewsCategory;
  query: string;
};

const feeds: FeedConfig[] = [
  { category: '今日必看', query: '中国 OR 美国 OR 国际 OR 政策 OR 突发 OR 重大 when:1d' },
  { category: '科技AI', query: '人工智能 OR OpenAI OR Gemini OR Sora OR Runway OR 英伟达 OR 华为 AI when:1d' },
  { category: '政治国际', query: '美国 中国 外交 OR 中东 冲突 OR 俄乌 OR 台湾 OR 关税 when:1d' },
  { category: 'A股经济', query: 'A股 OR 上证指数 OR 人民币 OR 央行 OR 美联储 OR 财报 OR 板块 when:1d' },
  { category: '影视AI行业', query: '短视频 OR AI视频 OR 数字人 OR 影视行业 OR 剪辑 OR 广告营销 when:1d' },
  { category: '生活风险', query: '南京 OR 新加坡 OR 天气 OR 交通 OR 食品安全 OR 消费提醒 when:1d' }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true
});

function rssUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
}

function cleanText(input = '') {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeItem(raw: any, category: NewsCategory): NewsItem | null {
  if (!raw?.title || !raw?.link) return null;
  const source = typeof raw.source === 'object' ? raw.source['#text'] : raw.source || 'Google News';
  const title = cleanText(String(raw.title));
  const link = String(raw.link);
  const publishedAt = raw.pubDate ? new Date(raw.pubDate).toISOString() : new Date().toISOString();
  const summary = cleanText(String(raw.description || '')).slice(0, 160);
  const id = Buffer.from(`${title}-${link}`).toString('base64url').slice(0, 22);
  return {
    id,
    title,
    link,
    source: cleanText(source),
    publishedAt,
    category,
    importance: scoreNews(title, summary, category),
    summary: summary || '暂无摘要，建议点开原文查看完整信息。',
    why: getWhy(title, category),
    impact: getImpact(title, category),
    action: getAction(title, category)
  };
}

function scoreNews(title: string, summary: string, category: NewsCategory) {
  const text = `${title} ${summary}`;
  let score = 50;
  const high = ['突发', '重磅', '重大', '宣布', '监管', '政策', '利率', '央行', '美联储', '关税', '战争', '冲突', '制裁', '暴跌', '大涨', '财报', 'AI', '人工智能', '英伟达', 'OpenAI', '华为', 'A股', '人民币'];
  const medium = ['发布', '上线', '合作', '收购', '投资', '预警', '风险', '调整', '会议', '指数', '票房', '影视', '短视频', '数字人'];
  for (const key of high) if (text.includes(key)) score += 7;
  for (const key of medium) if (text.includes(key)) score += 4;
  if (category === '今日必看') score += 8;
  if (category === 'A股经济') score += 6;
  if (category === '科技AI') score += 5;
  return Math.max(1, Math.min(100, score));
}

function hasAny(text: string, keys: string[]) {
  return keys.some((k) => text.includes(k));
}

function getWhy(title: string, category: NewsCategory) {
  const text = title;
  if (hasAny(text, ['A股', '上证', '央行', '美联储', '人民币', '财报'])) return '可能影响市场情绪、板块轮动和你的盘中判断。';
  if (hasAny(text, ['AI', '人工智能', 'OpenAI', 'Gemini', 'Sora', 'Runway', '英伟达'])) return '可能影响你的视频创作、AI工具选择和商业服务升级方向。';
  if (hasAny(text, ['关税', '制裁', '中东', '俄乌', '台湾', '美国', '外交'])) return '属于外部变量，可能传导到汇率、能源、军工、出口和资本市场。';
  if (category === '影视AI行业') return '与你的影视、短视频、AI漫剧、数字人业务相关，可能形成新产品或获客话术。';
  if (category === '生活风险') return '涉及出行、安全、天气、消费或本地风险，适合提前避坑。';
  return '属于今日信息环境中的高相关消息，值得知道但不必过度反应。';
}

function getImpact(title: string, category: NewsCategory) {
  const text = title;
  if (hasAny(text, ['美联储', '利率', '美元', '人民币'])) return '重点观察人民币、北向资金、黄金、银行、地产和高股息方向。';
  if (hasAny(text, ['AI', '英伟达', 'OpenAI', '华为'])) return '重点关注算力、模型应用、AI视频、端侧AI和内容生产效率。';
  if (hasAny(text, ['中东', '战争', '冲突', '制裁'])) return '重点关注油气、航运、军工、黄金和避险情绪。';
  if (category === '影视AI行业') return '可能影响你的报价体系、作品集包装、BOSS获客话术和AI视频服务组合。';
  if (category === '生活风险') return '主要影响当天行程安排、拍摄执行、交通和个人安全。';
  return '短期影响取决于后续发酵程度，先纳入观察清单。';
}

function getAction(title: string, category: NewsCategory) {
  const text = title;
  if (category === 'A股经济') return '开盘前看相关板块是否高开；只把它作为题材线索，不直接追高。';
  if (category === '科技AI') return '记录是否能变成新服务：AI视频、数字人、自动剪辑、客户汇报素材。';
  if (category === '政治国际') return '观察是否影响能源、黄金、军工、出口链；避免只看标题做交易。';
  if (category === '影视AI行业') return '可提炼成朋友圈/BOSS直聘获客内容，包装成“行业变化+解决方案”。';
  if (category === '生活风险') return '今天外出、拍摄、通勤前再确认一次本地天气和交通。';
  return '先收藏，晚间复盘是否有持续发酵。';
}

async function fetchFeed(feed: FeedConfig): Promise<NewsItem[]> {
  const res = await fetch(rssUrl(feed.query), {
    next: { revalidate: 600 },
    headers: {
      'User-Agent': 'DailyNewsAgent/1.0'
    }
  });
  if (!res.ok) throw new Error(`RSS 请求失败：${res.status}`);
  const xml = await res.text();
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return list.slice(0, 8).map((item) => normalizeItem(item, feed.category)).filter(Boolean) as NewsItem[];
}

export async function getDailyNews() {
  const settled = await Promise.allSettled(feeds.map(fetchFeed));
  const all = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const deduped = new Map<string, NewsItem>();
  for (const item of all) {
    const key = item.title.replace(/\s+/g, '').slice(0, 42);
    if (!deduped.has(key) || deduped.get(key)!.importance < item.importance) deduped.set(key, item);
  }
  const items = Array.from(deduped.values())
    .sort((a, b) => b.importance - a.importance || +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 30);

  const top = items.slice(0, 5);
  const briefing = top.length
    ? `今日优先看 ${top.length} 条：${top.map((item) => item.title.replace(/ - .+$/, '')).join('；')}`
    : '暂时没有抓取到新闻，请稍后刷新。';

  return {
    refreshedAt: new Date().toISOString(),
    briefing,
    items
  };
}
