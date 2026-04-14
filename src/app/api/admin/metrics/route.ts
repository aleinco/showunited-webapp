import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Cache metrics for 2 minutes
let cachedMetrics: Record<string, number> | null = null;
let cacheTime = 0;

export async function GET() {
  try {
    if (cachedMetrics && Date.now() - cacheTime < 120_000) {
      return NextResponse.json(cachedMetrics);
    }

    const db = await getDb();

    const [
      individualUsers,
      companyUsers,
      subscriptions,
      plans,
      faqs,
      disputes,
      skills,
      categories,
    ] = await Promise.all([
      db.request().query('SELECT COUNT(*) as c FROM MasterIndividualUser WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM MasterCompanyUser WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM UserSubscriptionPlan WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM MasterSubscriptionPlan WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM MasterFAQ WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM UserDispute WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM MasterSkill WHERE StatusId = 1'),
      db.request().query('SELECT COUNT(*) as c FROM MasterCategory WHERE StatusId = 1'),
    ]);

    const metrics = {
      totalIndividualUsers: individualUsers.recordset[0].c,
      totalCompanyUsers: companyUsers.recordset[0].c,
      totalSubscriptions: subscriptions.recordset[0].c,
      totalPlans: plans.recordset[0].c,
      totalFaqs: faqs.recordset[0].c,
      totalDisputes: disputes.recordset[0].c,
      totalSkills: skills.recordset[0].c,
      totalCategories: categories.recordset[0].c,
    };

    cachedMetrics = metrics;
    cacheTime = Date.now();

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, totalIndividualUsers: 0, totalCompanyUsers: 0 },
      { status: 500 }
    );
  }
}
