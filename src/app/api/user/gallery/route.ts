import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

const IMAGE_BASE = 'https://api.showunited.com/IndividualUserImage/';

/**
 * GET /api/user/gallery?userId=123
 * Returns all active images for the user.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const pool = await getDb();
    const result = await pool
      .request()
      .input('uid', sql.Int, Number(userId))
      .query(`
        SELECT
          IndividualUserImageId,
          IndividualUserImage,
          IndividualUserImageThumbnails,
          DTStamp
        FROM IndividualUserImage
        WHERE IndividualUserId = @uid AND StatusId = 1
        ORDER BY IndividualUserImageId ASC
      `);

    const images = result.recordset.map((img: any) => ({
      id: img.IndividualUserImageId,
      image: img.IndividualUserImage
        ? `${IMAGE_BASE}${img.IndividualUserImage}`
        : '',
      thumbnail: img.IndividualUserImageThumbnails
        ? `${IMAGE_BASE}${img.IndividualUserImageThumbnails}`
        : '',
      date: img.DTStamp,
    }));

    return NextResponse.json({ ok: true, images });
  } catch (error: any) {
    console.error('gallery GET error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/gallery
 * Body: { imageId: number, userId: number }
 * Soft-deletes an image by setting StatusId = 0.
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, userId } = body;

    if (!imageId || !userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing imageId or userId' },
        { status: 400 }
      );
    }

    const pool = await getDb();
    await pool
      .request()
      .input('imgId', sql.Int, Number(imageId))
      .input('uid', sql.Int, Number(userId))
      .query(`
        UPDATE IndividualUserImage
        SET StatusId = 0
        WHERE IndividualUserImageId = @imgId
          AND IndividualUserId = @uid
      `);

    return NextResponse.json({ ok: true, message: 'Image deleted' });
  } catch (error: any) {
    console.error('gallery DELETE error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
