"""Curated source registry for the Week 5 grounded tenant-rights launch."""

from __future__ import annotations

RIGHTS_SUPPORTED_STATES = ["California", "Illinois"]
RIGHTS_COVERAGE_TOPICS = [
    "Security deposits",
    "Repairs and habitability",
    "Landlord entry and privacy",
    "Eviction process basics",
]

RIGHTS_COVERAGE_MESSAGE = (
    "Launch coverage currently supports California and Illinois, with the strongest answers on "
    "security deposits, repairs and habitability, landlord entry and privacy, and eviction process basics. "
    "Local city or county rules may add protections beyond the statewide sources shown here."
)

CURATED_RIGHTS_SOURCES: list[dict] = [
    {
        "id": "ca-security-deposit-courts",
        "state": "California",
        "organization": "California Courts Self-Help",
        "title": "Guide to security deposits in California",
        "source_url": "https://selfhelp.courts.ca.gov/guide-security-deposits-california",
        "topic": "security_deposit",
        "summary": (
            "California Courts explains that a landlord generally has 21 days after move-out to return the deposit "
            "or give an itemized statement. The guide also explains which deductions are allowed and when receipts "
            "or invoices must back up repair charges."
        ),
        "keywords": [
            "security deposit",
            "deposit return",
            "21 days",
            "itemized statement",
            "receipts",
            "move out",
            "deductions",
            "wear and tear",
        ],
        "is_official": True,
    },
    {
        "id": "ca-entry-civil-code-1954",
        "state": "California",
        "organization": "California Legislative Information",
        "title": "California Civil Code section 1954",
        "source_url": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1954.&lawCode=CIV",
        "topic": "entry_privacy",
        "summary": (
            "Civil Code section 1954 limits when a landlord may enter and says landlords cannot abuse the right of access. "
            "For many non-emergency entries, the statute requires written notice with the date, approximate time, and purpose, "
            "and it says 24 hours is presumed reasonable notice."
        ),
        "keywords": [
            "entry",
            "privacy",
            "notice",
            "24 hours",
            "inspection",
            "showing",
            "repairs",
            "landlord enter",
        ],
        "is_official": True,
    },
    {
        "id": "ca-habitability-ag",
        "state": "California",
        "organization": "California Department of Justice",
        "title": "California Tenants: Habitability Guide",
        "source_url": "https://oag.ca.gov/system/files/media/Know-Your-Rights-Habitability-English.pdf",
        "topic": "repairs_habitability",
        "summary": (
            "The California Attorney General's habitability guide says landlords must keep rental homes safe and livable, "
            "including basics like plumbing, electricity, weather protection, locks, and sanitation. It tells tenants to document "
            "repair requests and warns that self-help remedies like withholding rent can carry legal risk if done incorrectly."
        ),
        "keywords": [
            "repairs",
            "habitability",
            "mold",
            "plumbing",
            "heat",
            "electricity",
            "unsafe",
            "withhold rent",
        ],
        "is_official": True,
    },
    {
        "id": "ca-eviction-rights-ag",
        "state": "California",
        "organization": "California Department of Justice",
        "title": "California Tenants: Evictions",
        "source_url": "https://oag.ca.gov/consumers/general/landlord-tenant-issues",
        "topic": "eviction_basics",
        "summary": (
            "The California Attorney General says a landlord usually cannot remove a tenant without going through court, "
            "and self-help lockouts or utility shutoffs are illegal. The page also notes that many tenants have statewide or local "
            "protections against some rent increases and some evictions."
        ),
        "keywords": [
            "eviction",
            "notice to quit",
            "lockout",
            "utilities",
            "court order",
            "just cause",
            "remove tenant",
        ],
        "is_official": True,
    },
    {
        "id": "ca-eviction-notices-courts",
        "state": "California",
        "organization": "California Courts Self-Help",
        "title": "Eviction notices from your landlord",
        "source_url": "https://selfhelp.courts.ca.gov/eviction-landlord/notice-types",
        "topic": "eviction_notices",
        "summary": (
            "California Courts explains the common notice types that come before an eviction case, such as notices to pay rent, "
            "fix a lease violation, or move out. The court guide makes clear that the notice is a first step before the landlord files in court."
        ),
        "keywords": [
            "eviction notice",
            "3 day notice",
            "pay or quit",
            "notice to cure",
            "move out notice",
            "quit notice",
        ],
        "is_official": True,
    },
    {
        "id": "il-general-rights-ag",
        "state": "Illinois",
        "organization": "Illinois Attorney General",
        "title": "Landlord and Tenant Rights Laws",
        "source_url": "https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf",
        "topic": "general_rights",
        "summary": (
            "The Illinois Attorney General's brochure says landlords generally must keep units fit to live in, make necessary repairs, "
            "and follow state and local housing codes. It also reminds renters that local ordinances may add protections beyond statewide law."
        ),
        "keywords": [
            "rights",
            "repairs",
            "habitability",
            "fit to live in",
            "housing code",
            "retaliation",
            "general",
        ],
        "is_official": True,
    },
    {
        "id": "il-security-deposit-ag",
        "state": "Illinois",
        "organization": "Illinois Attorney General",
        "title": "Security deposit rules in Landlord and Tenant Rights Laws",
        "source_url": "https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf",
        "topic": "security_deposit",
        "summary": (
            "The Illinois Attorney General explains that buildings with five or more units are subject to state security-deposit timing rules. "
            "The brochure describes the 30-day itemized-statement requirement for deductions and the 45-day deadline for returning the balance "
            "when no qualifying deductions are claimed."
        ),
        "keywords": [
            "security deposit",
            "deposit return",
            "30 days",
            "45 days",
            "itemized statement",
            "receipts",
            "move out",
        ],
        "is_official": True,
    },
    {
        "id": "il-eviction-lockout-ag",
        "state": "Illinois",
        "organization": "Illinois Attorney General",
        "title": "Eviction and lockout rules in Landlord and Tenant Rights Laws",
        "source_url": "https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf",
        "topic": "eviction_basics",
        "summary": (
            "The Illinois Attorney General says a landlord must use the eviction process in court and cannot legally remove a tenant by self-help. "
            "The brochure says only the sheriff can carry out the physical eviction and that lock changes or utility shutoffs are not lawful shortcuts."
        ),
        "keywords": [
            "eviction",
            "lockout",
            "sheriff",
            "court",
            "utilities",
            "remove tenant",
            "self help",
        ],
        "is_official": True,
    },
    {
        "id": "il-nonpayment-notice-ilga",
        "state": "Illinois",
        "organization": "Illinois General Assembly",
        "title": "735 ILCS 5/9-209: demand for rent and possession",
        "source_url": "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=073500050K9-209",
        "topic": "nonpayment_notice",
        "summary": (
            "Section 9-209 of the Illinois eviction statute says a landlord can serve a written demand for rent and give at least 5 days to pay before "
            "treating the lease as terminated for nonpayment. The statute also says acceptance of full rent during that notice window waives the termination "
            "unless the parties agreed otherwise in writing."
        ),
        "keywords": [
            "5 day notice",
            "nonpayment",
            "late rent",
            "pay rent",
            "rent demand",
            "eviction notice",
        ],
        "is_official": True,
    },
    {
        "id": "il-cook-county-rtlo",
        "state": "Illinois",
        "organization": "Cook County Government",
        "title": "Summary of the Residential Tenant and Landlord Ordinance",
        "source_url": "https://www.cookcountyil.gov/sites/g/files/ywwepo161/files/service/summary_of_residential_tenant_landlord_ordinance_en_may_2021.pdf",
        "topic": "local_cook_county",
        "summary": (
            "Cook County's RTLO summary adds important local rules for many suburban Cook County renters, including 48-hour entry notice in many cases, "
            "repair remedies after written notice, anti-lockout protections, and local security-deposit timelines. This is local coverage rather than statewide Illinois law."
        ),
        "keywords": [
            "Cook County",
            "Chicago area",
            "48 hour notice",
            "entry notice",
            "repairs",
            "security deposit",
            "local ordinance",
            "RTLO",
        ],
        "is_official": True,
    },
]
