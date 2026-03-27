import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_API = process.env.ADMIN_API_URL || 'https://admin.showunited.com';

async function getSessionCookie(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('admin_session')?.value || '';
  let decoded = raw;
  try {
    let prev = '';
    while (prev !== decoded) {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    // stop on decode error
  }
  return decoded;
}

/**
 * Parse an HTML table response from the .NET MVC admin into JSON rows.
 * The .NET app renders <table> with <thead> headers and <tbody> rows.
 */
function parseHtmlTable(html: string): { headers: string[]; rows: Record<string, string>[]; totalCount: number } {
  const headers: string[] = [];
  const rows: Record<string, string>[] = [];
  let totalCount = 0;

  // Extract record count
  const countMatch = html.match(/Record Count:\s*(\d+)/);
  if (countMatch) {
    totalCount = parseInt(countMatch[1], 10);
  }

  // Extract headers from <thead>
  const theadMatch = html.match(/<thead>([\s\S]*?)<\/thead>/);
  if (theadMatch) {
    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
    let thMatch;
    while ((thMatch = thRegex.exec(theadMatch[1])) !== null) {
      const text = thMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text) headers.push(text);
    }
  }

  // Extract rows from <tbody>
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (tbodyMatch) {
    const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
    let trMatch;
    while ((trMatch = trRegex.exec(tbodyMatch[1])) !== null) {
      const row: Record<string, string> = {};
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
      let tdMatch;
      let colIdx = 0;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        // Extract text content, stripping HTML tags
        let cellContent = tdMatch[1].replace(/<[^>]+>/g, '').trim();
        // Clean up whitespace
        cellContent = cellContent.replace(/\s+/g, ' ').trim();

        if (colIdx < headers.length) {
          // Normalize header to camelCase key
          const key = headers[colIdx]
            .replace(/\?/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
          row[key] = cellContent || '---';
        }
        colIdx++;
      }

      // Also extract IDs from edit/delete links
      const editMatch = trMatch[1].match(/href="\/[^/]+\/Save\/(\d+)"/);
      if (editMatch) {
        row['id'] = editMatch[1];
      }
      const deleteMatch = trMatch[1].match(/DeleteConfirmation[^']*\('(\d+)'\)/);
      if (deleteMatch && !row['id']) {
        row['id'] = deleteMatch[1];
      }

      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }
  }

  return { headers, rows, totalCount };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, data } = body;
    const sessionCookie = await getSessionCookie();

    if (!sessionCookie) {
      return NextResponse.json(
        { responseCode: 'unauthorized', responseMessage: 'Not logged in', responseData: null },
        { status: 401 }
      );
    }

    // The .NET admin uses form-urlencoded POST, not JSON
    const formData = new URLSearchParams();
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const res = await fetch(`${ADMIN_API}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: sessionCookie,
        'User-Agent': 'ShowUnited-Admin-Dashboard/1.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData.toString(),
    });

    const text = await res.text();

    // Check if we got redirected to login
    if (text.includes('home.UserName') || text.includes('SignIn')) {
      return NextResponse.json(
        { responseCode: 'unauthorized', responseMessage: 'Session expired', responseData: null },
        { status: 401 }
      );
    }

    // Try JSON first (DataTables server-side returns JSON with XHR header)
    try {
      const json = JSON.parse(text);
      // DataTables format: { draw, recordsTotal, recordsFiltered, data: [...] }
      if (json.data && Array.isArray(json.data)) {
        const dtRows = json.data.map((row: any) => {
          if (Array.isArray(row)) {
            // Array-format DataTable rows — map to header-based keys
            const obj: Record<string, string> = {};
            row.forEach((cell: any, i: number) => {
              const cellStr = String(cell ?? '').replace(/<[^>]+>/g, '').trim() || '---';
              obj[`col_${i}`] = cellStr;
            });
            // Extract ID from action column HTML (last column usually)
            const actionHtml = String(row[row.length - 1] ?? '');
            const idMatch = actionHtml.match(/Save\/(\d+)/) || actionHtml.match(/DeleteConfirmation[^']*\('(\d+)'\)/);
            if (idMatch) obj['id'] = idMatch[1];
            return obj;
          }
          return row;
        });
        return NextResponse.json({
          responseCode: 'success',
          responseMessage: 'OK',
          responseData: dtRows,
          totalCount: json.recordsTotal || json.recordsFiltered || dtRows.length,
          headers: [],
        });
      }
      // Already structured JSON
      return NextResponse.json(json);
    } catch {
      // Not JSON — parse HTML table
    }

    const { headers, rows, totalCount } = parseHtmlTable(text);

    return NextResponse.json({
      responseCode: 'success',
      responseMessage: 'OK',
      responseData: rows,
      totalCount,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { responseCode: 'error', responseMessage: error.message, responseData: null },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const sessionCookie = await getSessionCookie();

    const res = await fetch(`${ADMIN_API}/${endpoint}`, {
      method: 'GET',
      headers: {
        Cookie: sessionCookie || '',
        'User-Agent': 'ShowUnited-Admin-Dashboard/1.0',
      },
    });

    const html = await res.text();

    if (html.includes('home.UserName')) {
      return NextResponse.json(
        { responseCode: 'unauthorized', responseMessage: 'Session expired', responseData: null },
        { status: 401 }
      );
    }

    // Try JSON first (in case some endpoints return JSON)
    try {
      const json = JSON.parse(html);
      return NextResponse.json(json);
    } catch {
      // Parse HTML
      const { headers, rows, totalCount } = parseHtmlTable(html);
      return NextResponse.json({
        responseCode: 'success',
        responseData: rows,
        totalCount,
        headers,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { responseCode: 'error', responseMessage: error.message, responseData: null },
      { status: 500 }
    );
  }
}
