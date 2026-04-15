import { NextRequest, NextResponse } from 'next/server';
import { getDb, sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, data } = body;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const pool = await getDb();

    // ── Change Password ──
    if (action === 'changePassword') {
      const { currentPassword, newPassword } = data || {};
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { ok: false, error: 'Missing password fields' },
          { status: 400 }
        );
      }

      // Verify current password
      const check = await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .input('pwd', sql.NVarChar(500), currentPassword)
        .query(
          'SELECT IndividualUserId FROM MasterIndividualUser WHERE IndividualUserId = @uid AND Password = @pwd'
        );

      if (!check.recordset.length) {
        return NextResponse.json(
          { ok: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .input('newPwd', sql.NVarChar(500), newPassword)
        .query(
          'UPDATE MasterIndividualUser SET Password = @newPwd WHERE IndividualUserId = @uid'
        );

      return NextResponse.json({ ok: true, message: 'Password updated' });
    }

    // ── Change Email ──
    if (action === 'changeEmail') {
      const { newEmail } = data || {};
      if (!newEmail) {
        return NextResponse.json(
          { ok: false, error: 'Missing email' },
          { status: 400 }
        );
      }

      // Check if email already in use
      const exists = await pool
        .request()
        .input('email', sql.NVarChar(500), newEmail.trim())
        .input('uid', sql.Int, Number(userId))
        .query(
          'SELECT IndividualUserId FROM MasterIndividualUser WHERE Email = @email AND IndividualUserId != @uid'
        );

      if (exists.recordset.length) {
        return NextResponse.json(
          { ok: false, error: 'Email already in use' },
          { status: 400 }
        );
      }

      await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .input('email', sql.NVarChar(500), newEmail.trim())
        .query(
          'UPDATE MasterIndividualUser SET Email = @email WHERE IndividualUserId = @uid'
        );

      return NextResponse.json({ ok: true, message: 'Email updated' });
    }

    // ── Get Subscription ──
    if (action === 'getSubscription') {
      const result = await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .query(`
          SELECT
            u.SubscriptionPlanId,
            u.SubscriptionPlanDate,
            u.SubscriptionExpiryDate,
            p.SubscriptionPlanName,
            p.SubscriptionPlanPrice,
            p.SubscriptionPlanDuration
          FROM MasterIndividualUser u
          LEFT JOIN MasterSubscriptionPlan p ON p.SubscriptionPlanId = u.SubscriptionPlanId
          WHERE u.IndividualUserId = @uid
        `);

      if (!result.recordset.length) {
        return NextResponse.json(
          { ok: false, error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true, data: result.recordset[0] });
    }

    // ── Get Blocked Users ──
    if (action === 'getBlockedUsers') {
      const result = await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .query(`
          SELECT
            b.UserBlockId,
            b.ToIndividualUserId,
            u.FirstName,
            u.LastName,
            u.ProfileImage
          FROM UserBlock b
          INNER JOIN MasterIndividualUser u ON u.IndividualUserId = b.ToIndividualUserId
          WHERE b.FromIndividualUserId = @uid AND b.StatusId = 1
        `);

      return NextResponse.json({ ok: true, data: result.recordset });
    }

    // ── Unblock User ──
    if (action === 'unblockUser') {
      const { blockedUserId } = data || {};
      if (!blockedUserId) {
        return NextResponse.json(
          { ok: false, error: 'Missing blockedUserId' },
          { status: 400 }
        );
      }

      await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .input('bid', sql.Int, Number(blockedUserId))
        .query(
          'UPDATE UserBlock SET StatusId = 0 WHERE FromIndividualUserId = @uid AND ToIndividualUserId = @bid'
        );

      return NextResponse.json({ ok: true, message: 'User unblocked' });
    }

    // ── Delete Account (soft delete) ──
    if (action === 'deleteAccount') {
      await pool
        .request()
        .input('uid', sql.Int, Number(userId))
        .query(
          'UPDATE MasterIndividualUser SET StatusId = 0 WHERE IndividualUserId = @uid'
        );

      return NextResponse.json({ ok: true, message: 'Account deleted' });
    }

    return NextResponse.json(
      { ok: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('account route error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
