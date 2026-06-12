import { NextRequest, NextResponse } from 'next/server';

type NominatimRow = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

/** Proxy léger vers Nominatim (OpenStreetMap), sans clé API payante. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json(
      { error: 'Requête trop courte (min. 3 caractères).' },
      { status: 400 },
    );
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'bj');
  url.searchParams.set('addressdetails', '0');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AlloLabo/1.0 (order client location)',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Service de géocodage indisponible.' },
        { status: 502 },
      );
    }

    const rows = (await res.json()) as NominatimRow[];
    const results = rows
      .filter((row) => row.lat && row.lon && row.display_name)
      .map((row) => ({
        displayName: row.display_name as string,
        latitude: Number(row.lat),
        longitude: Number(row.lon),
      }))
      .filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: 'Impossible de contacter le service de géocodage.' },
      { status: 502 },
    );
  }
}
