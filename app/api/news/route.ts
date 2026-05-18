import { NextResponse } from 'next/server';
import { getDailyNews } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDailyNews();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        refreshedAt: new Date().toISOString(),
        briefing: '新闻抓取失败，请检查网络或稍后重试。',
        error: error?.message || 'unknown error',
        items: []
      },
      { status: 500 }
    );
  }
}
