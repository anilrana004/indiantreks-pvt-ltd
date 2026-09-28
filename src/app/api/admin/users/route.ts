import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse, requireAdmin, unauthorizedResponse } from '@/lib/admin/auth';
import { isDbConfigured } from '@/lib/db';
import { listSiteUsers, siteUsersToCsv } from '@/lib/operations/service';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  try {
    const search = req.nextUrl.searchParams.get('q') || '';
    const format = (req.nextUrl.searchParams.get('format') || 'json').toLowerCase();
    const users = await listSiteUsers({ search });

    if (format === 'csv') {
      const csv = siteUsersToCsv(users);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="customer-logins-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (format === 'json-download') {
      const body = JSON.stringify(
        { exportedAt: new Date().toISOString(), count: users.length, users },
        null,
        2,
      );
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="customer-logins-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load users.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
