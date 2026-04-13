"""
Populates Neo4j Aura with REAL data from MongoDB.

Graph model — Authenticity Audit Trail:
  (:User)-[:REQUESTED_VERIFICATION]->(:VerificationRequest)
  (:VerificationRequest)-[:FOR_PRODUCT]->(:Product)
  (:VerificationRequest)-[:SENT_TO]->(:Vendor)
  (:Vendor)-[:VERIFIED | :REJECTED]->(:VerificationRequest)
  (:VerificationRequest)-[:RESULTED_IN]->(:Certificate)

Graph model — Warranty Claim Lifecycle:
  (:User)-[:SUBMITTED_CLAIM]->(:WarrantyClaim)
  (:WarrantyClaim)-[:CLAIM_FOR_PRODUCT]->(:Product)
  (:WarrantyClaim)-[:ASSIGNED_TO]->(:Vendor)
  (:Vendor)-[:REVIEWED | :SCHEDULED | :COMPLETED | :REJECTED_CLAIM]->(:WarrantyClaim)
"""

from neo4j import GraphDatabase
from pymongo import MongoClient
from datetime import datetime, timezone

# ── Connection config ─────────────────────────────────────────────────────────

NEO4J_URI      = "neo4j+s://969de964.databases.neo4j.io"
NEO4J_USER     = "969de964"
NEO4J_PASSWORD = "0L8KrJL5Z-f86pRQ6x4jRhlxzk1yvJ-rpLM6Vq8DrIM"
NEO4J_DATABASE = "969de964"

MONGO_URI = (
    "mongodb+srv://kaviarasankavi1807_db_user:PRHfEgE98kCYdK6q"
    "@cluster0.bdiik7e.mongodb.net/warranty_vault"
    "?retryWrites=true&w=majority"
)

# ── Helper ────────────────────────────────────────────────────────────────────

def to_iso(dt):
    if dt is None:
        return datetime.now(timezone.utc).isoformat()
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)

# ═════════════════════════════════════════════════════════════════════════════
# Writers — Authentication / Verification
# ═════════════════════════════════════════════════════════════════════════════

def clear_database(tx):
    tx.run("MATCH (n) DETACH DELETE n")


def create_vr_node(tx, req, vendor_email):
    tx.run("""
        MERGE (u:User { userId: $userId })
          ON CREATE SET u.name = $userName, u.email = $userEmail
          ON MATCH  SET u.name = $userName, u.email = $userEmail

        MERGE (p:Product { productId: $productId })
          ON CREATE SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber
          ON MATCH  SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber

        MERGE (v:Vendor { email: $vendorEmail })
          ON CREATE SET v.name = $brand, v.brand = $brand
          ON MATCH  SET v.name = $brand, v.brand = $brand

        MERGE (vr:VerificationRequest { requestId: $requestId })
          ON CREATE SET
            vr.name         = $productName,
            vr.status       = $status,
            vr.requestedAt  = datetime($requestedAt),
            vr.productName  = $productName,
            vr.brand        = $brand,
            vr.serialNumber = $serialNumber,
            vr.vendorNote   = $vendorNote
          ON MATCH SET
            vr.name       = $productName,
            vr.status     = $status,
            vr.vendorNote = $vendorNote

        MERGE (u)-[:REQUESTED_VERIFICATION]->(vr)
        MERGE (vr)-[:FOR_PRODUCT]->(p)
        MERGE (vr)-[:SENT_TO]->(v)
    """,
        userId      = str(req.get("userId", "")),
        userName    = req.get("userName", "Unknown"),
        userEmail   = req.get("userEmail", ""),
        productId   = int(req.get("productId", 0)),
        productName = req.get("productName", "Unknown Product"),
        brand       = req.get("brand", "Unknown"),
        serialNumber= req.get("serialNumber", ""),
        vendorEmail = vendor_email,
        requestId   = str(req["_id"]),
        status      = req.get("status", "pending"),
        requestedAt = to_iso(req.get("requestedAt")),
        vendorNote  = req.get("vendorNote") or "",
    )


def mark_verified(tx, request_id, verified_at, vendor_note):
    tx.run("""
        MATCH (vr:VerificationRequest { requestId: $requestId })
        MATCH (vr)-[:SENT_TO]->(v:Vendor)
        SET vr.verifiedAt = datetime($verifiedAt)
        MERGE (v)-[:VERIFIED { verifiedAt: datetime($verifiedAt), note: $vendorNote }]->(vr)
    """, requestId=request_id, verifiedAt=to_iso(verified_at), vendorNote=vendor_note or "")


def mark_vr_rejected(tx, request_id, rejected_at, vendor_note):
    tx.run("""
        MATCH (vr:VerificationRequest { requestId: $requestId })
        MATCH (vr)-[:SENT_TO]->(v:Vendor)
        SET vr.rejectedAt = datetime($rejectedAt)
        MERGE (v)-[:REJECTED { rejectedAt: datetime($rejectedAt), note: $vendorNote }]->(vr)
    """, requestId=request_id, rejectedAt=to_iso(rejected_at), vendorNote=vendor_note or "")


def create_certificate(tx, cert, vr_id):
    tx.run("""
        MATCH (vr:VerificationRequest { requestId: $vrId })
        MATCH (u:User { userId: $userId })
        MERGE (c:Certificate { certificateId: $certId })
          ON CREATE SET c.name = $certId, c.issuedAt = datetime($issuedAt), c.isValid = true
          ON MATCH  SET c.name = $certId
        MERGE (vr)-[:RESULTED_IN]->(c)
        MERGE (u)-[:HOLDS_CERTIFICATE]->(c)
    """,
        vrId    = vr_id,
        userId  = str(cert.get("userId", "")),
        certId  = cert.get("certificateId", str(cert["_id"])),
        issuedAt= to_iso(cert.get("issuedAt")),
    )


# ═════════════════════════════════════════════════════════════════════════════
# Writers — Warranty Claim Lifecycle
# ═════════════════════════════════════════════════════════════════════════════

def create_claim_node(tx, claim, vendor_email):
    tx.run("""
        MERGE (u:User { userId: $userId })
          ON CREATE SET u.name = $userName, u.email = $userEmail
          ON MATCH  SET u.name = $userName, u.email = $userEmail

        MERGE (p:Product { productId: $productId })
          ON CREATE SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber
          ON MATCH  SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber

        MERGE (v:Vendor { email: $vendorEmail })
          ON CREATE SET v.name = $brand, v.brand = $brand
          ON MATCH  SET v.name = $brand, v.brand = $brand

        MERGE (wc:WarrantyClaim { claimId: $claimId })
          ON CREATE SET
            wc.name             = $claimNumber,
            wc.claimNumber      = $claimNumber,
            wc.status           = $status,
            wc.defectType       = $defectType,
            wc.defectDescription= $defectDesc,
            wc.productName      = $productName,
            wc.brand            = $brand,
            wc.submittedAt      = datetime($submittedAt),
            wc.isEscalated      = $isEscalated
          ON MATCH SET
            wc.name        = $claimNumber,
            wc.status      = $status,
            wc.isEscalated = $isEscalated

        MERGE (u)-[:SUBMITTED_CLAIM { submittedAt: datetime($submittedAt) }]->(wc)
        MERGE (wc)-[:CLAIM_FOR_PRODUCT]->(p)
        MERGE (wc)-[:ASSIGNED_TO]->(v)
    """,
        userId      = str(claim.get("userId", "")),
        userName    = claim.get("userName", "Unknown"),
        userEmail   = claim.get("userEmail", ""),
        productId   = int(claim.get("productId", 0)),
        productName = claim.get("productName", "Unknown Product"),
        brand       = claim.get("brand", "Unknown"),
        serialNumber= claim.get("serialNumber", ""),
        vendorEmail = vendor_email,
        claimId     = str(claim["_id"]),
        claimNumber = claim.get("claimNumber", str(claim["_id"])),
        status      = claim.get("status", "submitted"),
        defectType  = claim.get("defectType", ""),
        defectDesc  = claim.get("defectDescription", ""),
        submittedAt = to_iso(claim.get("submittedAt")),
        isEscalated = bool(claim.get("isEscalated", False)),
    )


def add_claim_lifecycle_rel(tx, claim):
    claim_id = str(claim["_id"])
    status   = claim.get("status", "submitted")

    rel_map = {
        "reviewed": "REVIEWED",
        "scheduled": "SCHEDULED",
        "completed": "COMPLETED",
        "rejected":  "REJECTED_CLAIM",
    }

    rel_type = rel_map.get(status)
    if not rel_type:
        return  # 'submitted' — no vendor action yet

    ts = claim.get("scheduledAt") or claim.get("completedAt") or claim.get("submittedAt")

    tx.run(
        f"""
        MATCH (wc:WarrantyClaim {{ claimId: $claimId }})
        MATCH (wc)-[:ASSIGNED_TO]->(v:Vendor)
        MERGE (v)-[:{rel_type} {{ actionAt: datetime($actionAt), message: $message }}]->(wc)
        """,
        claimId  = claim_id,
        actionAt = to_iso(ts),
        message  = claim.get("vendorMessage") or claim.get("rejectionReason") or "",
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("🔌 Connecting to MongoDB...")
    mongo = MongoClient(MONGO_URI)
    db    = mongo["warranty_vault"]

    requests = list(db["verificationrequests"].find({}))
    certs    = list(db["warrantycertificates"].find({}))
    claims   = list(db["warrantyclaims"].find({}))

    print(f"   📋 Found {len(requests)} verification request(s)")
    print(f"   📜 Found {len(certs)} certificate(s)")
    print(f"   🔧 Found {len(claims)} warranty claim(s)")

    print("\n🔌 Connecting to Neo4j Aura...")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    driver.verify_connectivity()
    print("   ✅ Connected!")

    with driver.session(database=NEO4J_DATABASE) as session:

        # Clear everything first
        session.execute_write(clear_database)
        print("\n🗑️  Cleared existing graph data")

        # ── A: Verification Requests ──────────────────────────────────────
        print("\n📦 Building Verification Request graph...")
        for req in requests:
            ve = req.get("vendorEmail") or f"vendor@{req.get('brand','unknown').lower()}.vault"
            session.execute_write(create_vr_node, req, ve)

            rid    = str(req["_id"])
            status = req.get("status", "pending")

            if status == "verified" and req.get("verifiedAt"):
                session.execute_write(mark_verified, rid, req["verifiedAt"], req.get("vendorNote"))
                print(f"   ✅ {req.get('productName')} — VERIFIED")
            elif status == "rejected" and req.get("verifiedAt"):
                session.execute_write(mark_vr_rejected, rid, req["verifiedAt"], req.get("vendorNote"))
                print(f"   ❌ {req.get('productName')} — REJECTED")
            else:
                print(f"   ⏳ {req.get('productName')} — PENDING")

        # ── B: Certificates ───────────────────────────────────────────────
        print("\n🏆 Creating Certificate nodes...")
        for cert in certs:
            vr_id = str(cert.get("verificationRequestId", ""))
            try:
                session.execute_write(create_certificate, cert, vr_id)
                print(f"   📜 {cert.get('certificateId')} linked")
            except Exception as e:
                print(f"   ⚠️  Skipped: {e}")

        # ── C: Warranty Claims ────────────────────────────────────────────
        print("\n🔧 Building Warranty Claim lifecycle graph...")
        for claim in claims:
            ve = claim.get("vendorEmail") or f"vendor@{claim.get('brand','unknown').lower()}.vault"
            session.execute_write(create_claim_node, claim, ve)
            session.execute_write(add_claim_lifecycle_rel, claim)
            status = claim.get("status", "submitted")
            icons  = {"submitted": "📨", "reviewed": "🔍", "scheduled": "📅",
                      "completed": "✅", "rejected": "❌"}
            esc    = " 🚨ESCALATED" if claim.get("isEscalated") else ""
            print(f"   {icons.get(status,'🔧')} {claim.get('productName')} [{claim.get('claimNumber')}] — {status.upper()}{esc}")

        # ── Summary ───────────────────────────────────────────────────────
        print("\n📊 Node counts:")
        for r in session.run("MATCH (n) RETURN labels(n)[0] AS l, count(n) AS c ORDER BY l"):
            print(f"   {r['l']}: {r['c']}")

        print("\n🔗 Relationship counts:")
        for r in session.run("MATCH ()-[r]->() RETURN type(r) AS t, count(r) AS c ORDER BY t"):
            print(f"   {r['t']}: {r['c']}")

    driver.close()
    mongo.close()
    print("\n✅ Done! Refresh Neo4j Aura → Explore to see the full graph.")


if __name__ == "__main__":
    main()
