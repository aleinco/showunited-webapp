import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

const IMAGE_BASE = 'https://api.showunited.com/IndividualUserImage/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, data } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    }

    const pool = await getDb();
    const uid = Number(userId);

    // ── GET FOLDERS ──
    if (action === 'getFolders') {
      const result = await pool
        .request()
        .input('uid', sql.Int, uid)
        .query(`
          SELECT
            f.UserFavoriteFolderId,
            f.FavoriteFolderName,
            f.DTStamp,
            (SELECT COUNT(*) FROM UserFavoriteFolderUser fu
             WHERE fu.UserFavoriteFolderId = f.UserFavoriteFolderId AND fu.StatusId = 1
            ) AS UserCount
          FROM UserFavoriteFolder f
          WHERE f.IndividualUserId = @uid AND f.StatusId = 1
          ORDER BY f.DTStamp DESC
        `);

      return NextResponse.json({
        ok: true,
        folders: result.recordset.map((r: any) => ({
          id: r.UserFavoriteFolderId,
          name: r.FavoriteFolderName,
          userCount: r.UserCount,
          createdAt: r.DTStamp,
        })),
      });
    }

    // ── GET FOLDER USERS ──
    if (action === 'getFolderUsers') {
      const folderId = data?.folderId;
      if (!folderId) {
        return NextResponse.json({ ok: false, error: 'Missing folderId' }, { status: 400 });
      }

      // Verify folder belongs to this user
      const check = await pool
        .request()
        .input('fid', sql.Int, Number(folderId))
        .input('uid', sql.Int, uid)
        .query(`
          SELECT UserFavoriteFolderId, FavoriteFolderName
          FROM UserFavoriteFolder
          WHERE UserFavoriteFolderId = @fid AND IndividualUserId = @uid AND StatusId = 1
        `);

      if (!check.recordset.length) {
        return NextResponse.json({ ok: false, error: 'Folder not found' }, { status: 404 });
      }

      const result = await pool
        .request()
        .input('fid', sql.Int, Number(folderId))
        .query(`
          SELECT
            fu.UserFavoriteFolderUserId,
            fu.FavoriteIndividualUserId,
            u.FirstName,
            u.LastName,
            (SELECT TOP 1 IndividualUserImage FROM IndividualUserImage
             WHERE IndividualUserId = u.IndividualUserId AND StatusId = 1
             ORDER BY IndividualUserImageId ASC) AS Photo
          FROM UserFavoriteFolderUser fu
          INNER JOIN MasterIndividualUser u ON u.IndividualUserId = fu.FavoriteIndividualUserId
          WHERE fu.UserFavoriteFolderId = @fid AND fu.StatusId = 1
          ORDER BY fu.DTStamp DESC
        `);

      return NextResponse.json({
        ok: true,
        folderName: check.recordset[0].FavoriteFolderName,
        users: result.recordset.map((r: any) => ({
          foldUserId: r.UserFavoriteFolderUserId,
          userId: r.FavoriteIndividualUserId,
          name: ((r.FirstName || '') + ' ' + (r.LastName || '')).trim() || 'Unknown',
          photo: r.Photo ? `${IMAGE_BASE}${r.Photo}` : '',
        })),
      });
    }

    // ── CREATE FOLDER ──
    if (action === 'createFolder') {
      const name = data?.name?.trim();
      if (!name) {
        return NextResponse.json({ ok: false, error: 'Missing folder name' }, { status: 400 });
      }

      const result = await pool
        .request()
        .input('uid', sql.Int, uid)
        .input('name', sql.NVarChar(200), name)
        .input('now', sql.DateTime, new Date())
        .query(`
          INSERT INTO UserFavoriteFolder (CompanyUserId, IndividualUserId, FavoriteFolderName, StatusId, DTStamp)
          VALUES (0, @uid, @name, 1, @now);
          SELECT SCOPE_IDENTITY() AS NewId;
        `);

      return NextResponse.json({
        ok: true,
        folder: {
          id: result.recordset[0].NewId,
          name,
          userCount: 0,
        },
      });
    }

    // ── RENAME FOLDER ──
    if (action === 'renameFolder') {
      const folderId = data?.folderId;
      const name = data?.name?.trim();
      if (!folderId || !name) {
        return NextResponse.json({ ok: false, error: 'Missing folderId or name' }, { status: 400 });
      }

      await pool
        .request()
        .input('fid', sql.Int, Number(folderId))
        .input('uid', sql.Int, uid)
        .input('name', sql.NVarChar(200), name)
        .query(`
          UPDATE UserFavoriteFolder
          SET FavoriteFolderName = @name
          WHERE UserFavoriteFolderId = @fid AND IndividualUserId = @uid AND StatusId = 1
        `);

      return NextResponse.json({ ok: true });
    }

    // ── DELETE FOLDER (soft) ──
    if (action === 'deleteFolder') {
      const folderId = data?.folderId;
      if (!folderId) {
        return NextResponse.json({ ok: false, error: 'Missing folderId' }, { status: 400 });
      }

      // Soft-delete folder
      await pool
        .request()
        .input('fid', sql.Int, Number(folderId))
        .input('uid', sql.Int, uid)
        .query(`
          UPDATE UserFavoriteFolder SET StatusId = 0
          WHERE UserFavoriteFolderId = @fid AND IndividualUserId = @uid;
          UPDATE UserFavoriteFolderUser SET StatusId = 0
          WHERE UserFavoriteFolderId = @fid;
        `);

      return NextResponse.json({ ok: true });
    }

    // ── REMOVE USER FROM FOLDER ──
    if (action === 'removeUser') {
      const foldUserId = data?.foldUserId;
      const folderId = data?.folderId;
      if (!foldUserId && !folderId) {
        return NextResponse.json({ ok: false, error: 'Missing foldUserId or folderId' }, { status: 400 });
      }

      if (foldUserId) {
        await pool
          .request()
          .input('fuid', sql.Int, Number(foldUserId))
          .query('UPDATE UserFavoriteFolderUser SET StatusId = 0 WHERE UserFavoriteFolderUserId = @fuid');
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('favorites API error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
