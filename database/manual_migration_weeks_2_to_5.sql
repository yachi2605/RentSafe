-- RentPilot manual migration for existing databases
-- Covers Weeks 2 through 5 in one idempotent script.
-- Safe to run on a database that already has the original base schema.

BEGIN;

-- Week 2: moderation reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.reports
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Week 3: saved history payload fields
ALTER TABLE IF EXISTS public.lease_analyses
  ADD COLUMN IF NOT EXISTS extracted_text TEXT;

ALTER TABLE IF EXISTS public.scam_checks
  ADD COLUMN IF NOT EXISTS tips JSONB;

-- Week 4: campus profile fields
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS campus TEXT,
  ADD COLUMN IF NOT EXISTS preferred_city TEXT,
  ADD COLUMN IF NOT EXISTS preferred_state TEXT,
  ADD COLUMN IF NOT EXISTS budget_goal_min NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_goal_max NUMERIC,
  ADD COLUMN IF NOT EXISTS preferred_move_in_date DATE,
  ADD COLUMN IF NOT EXISTS prefers_furnished BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prefers_parking BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prefers_laundry BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prefers_pets BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prefers_ac BOOLEAN DEFAULT FALSE;

-- Week 5: curated rights source registry
CREATE TABLE IF NOT EXISTS public.rights_sources (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  organization TEXT NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_official BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.rights_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rights_sources_select" ON public.rights_sources;
CREATE POLICY "rights_sources_select" ON public.rights_sources
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.rights_sources
  (id, state, organization, title, source_url, topic, summary, keywords, is_official)
VALUES
  (
    'ca-security-deposit-courts',
    'California',
    'California Courts Self-Help',
    'Guide to security deposits in California',
    'https://selfhelp.courts.ca.gov/guide-security-deposits-california',
    'security_deposit',
    'California Courts explains that a landlord generally has 21 days after move-out to return the deposit or give an itemized statement. The guide also explains which deductions are allowed and when receipts or invoices must back up repair charges.',
    ARRAY['security deposit','deposit return','21 days','itemized statement','receipts','move out','deductions','wear and tear'],
    TRUE
  ),
  (
    'ca-entry-civil-code-1954',
    'California',
    'California Legislative Information',
    'California Civil Code section 1954',
    'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1954.&lawCode=CIV',
    'entry_privacy',
    'Civil Code section 1954 limits when a landlord may enter and says landlords cannot abuse the right of access. For many non-emergency entries, the statute requires written notice with the date, approximate time, and purpose, and it says 24 hours is presumed reasonable notice.',
    ARRAY['entry','privacy','notice','24 hours','inspection','showing','repairs','landlord enter'],
    TRUE
  ),
  (
    'ca-habitability-ag',
    'California',
    'California Department of Justice',
    'California Tenants: Habitability Guide',
    'https://oag.ca.gov/system/files/media/Know-Your-Rights-Habitability-English.pdf',
    'repairs_habitability',
    'The California Attorney General''s habitability guide says landlords must keep rental homes safe and livable, including basics like plumbing, electricity, weather protection, locks, and sanitation. It tells tenants to document repair requests and warns that self-help remedies like withholding rent can carry legal risk if done incorrectly.',
    ARRAY['repairs','habitability','mold','plumbing','heat','electricity','unsafe','withhold rent'],
    TRUE
  ),
  (
    'ca-eviction-rights-ag',
    'California',
    'California Department of Justice',
    'California Tenants: Evictions',
    'https://oag.ca.gov/consumers/general/landlord-tenant-issues',
    'eviction_basics',
    'The California Attorney General says a landlord usually cannot remove a tenant without going through court, and self-help lockouts or utility shutoffs are illegal. The page also notes that many tenants have statewide or local protections against some rent increases and some evictions.',
    ARRAY['eviction','notice to quit','lockout','utilities','court order','just cause','remove tenant'],
    TRUE
  ),
  (
    'ca-eviction-notices-courts',
    'California',
    'California Courts Self-Help',
    'Eviction notices from your landlord',
    'https://selfhelp.courts.ca.gov/eviction-landlord/notice-types',
    'eviction_notices',
    'California Courts explains the common notice types that come before an eviction case, such as notices to pay rent, fix a lease violation, or move out. The court guide makes clear that the notice is a first step before the landlord files in court.',
    ARRAY['eviction notice','3 day notice','pay or quit','notice to cure','move out notice','quit notice'],
    TRUE
  ),
  (
    'il-general-rights-ag',
    'Illinois',
    'Illinois Attorney General',
    'Landlord and Tenant Rights Laws',
    'https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf',
    'general_rights',
    'The Illinois Attorney General''s brochure says landlords generally must keep units fit to live in, make necessary repairs, and follow state and local housing codes. It also reminds renters that local ordinances may add protections beyond statewide law.',
    ARRAY['rights','repairs','habitability','fit to live in','housing code','retaliation','general'],
    TRUE
  ),
  (
    'il-security-deposit-ag',
    'Illinois',
    'Illinois Attorney General',
    'Security deposit rules in Landlord and Tenant Rights Laws',
    'https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf',
    'security_deposit',
    'The Illinois Attorney General explains that buildings with five or more units are subject to state security-deposit timing rules. The brochure describes the 30-day itemized-statement requirement for deductions and the 45-day deadline for returning the balance when no qualifying deductions are claimed.',
    ARRAY['security deposit','deposit return','30 days','45 days','itemized statement','receipts','move out'],
    TRUE
  ),
  (
    'il-eviction-lockout-ag',
    'Illinois',
    'Illinois Attorney General',
    'Eviction and lockout rules in Landlord and Tenant Rights Laws',
    'https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf',
    'eviction_basics',
    'The Illinois Attorney General says a landlord must use the eviction process in court and cannot legally remove a tenant by self-help. The brochure says only the sheriff can carry out the physical eviction and that lock changes or utility shutoffs are not lawful shortcuts.',
    ARRAY['eviction','lockout','sheriff','court','utilities','remove tenant','self help'],
    TRUE
  ),
  (
    'il-nonpayment-notice-ilga',
    'Illinois',
    'Illinois General Assembly',
    '735 ILCS 5/9-209: demand for rent and possession',
    'https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=073500050K9-209',
    'nonpayment_notice',
    'Section 9-209 of the Illinois eviction statute says a landlord can serve a written demand for rent and give at least 5 days to pay before treating the lease as terminated for nonpayment. The statute also says acceptance of full rent during that notice window waives the termination unless the parties agreed otherwise in writing.',
    ARRAY['5 day notice','nonpayment','late rent','pay rent','rent demand','eviction notice'],
    TRUE
  ),
  (
    'il-cook-county-rtlo',
    'Illinois',
    'Cook County Government',
    'Summary of the Residential Tenant and Landlord Ordinance',
    'https://www.cookcountyil.gov/sites/g/files/ywwepo161/files/service/summary_of_residential_tenant_landlord_ordinance_en_may_2021.pdf',
    'local_cook_county',
    'Cook County''s RTLO summary adds important local rules for many suburban Cook County renters, including 48-hour entry notice in many cases, repair remedies after written notice, anti-lockout protections, and local security-deposit timelines. This is local coverage rather than statewide Illinois law.',
    ARRAY['Cook County','Chicago area','48 hour notice','entry notice','repairs','security deposit','local ordinance','RTLO'],
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  state = EXCLUDED.state,
  organization = EXCLUDED.organization,
  title = EXCLUDED.title,
  source_url = EXCLUDED.source_url,
  topic = EXCLUDED.topic,
  summary = EXCLUDED.summary,
  keywords = EXCLUDED.keywords,
  is_official = EXCLUDED.is_official;

COMMIT;
