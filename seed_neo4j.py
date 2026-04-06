"""
Seed script to populate Neo4j Aura instance with sample Digital Warranty Vault data.
Creates Vendor, Product, Serial, Owner, and AuthCheck nodes with relationships.
"""

from neo4j import GraphDatabase

URI = "neo4j+s://969de964.databases.neo4j.io"
USERNAME = "969de964"
PASSWORD = "0L8KrJL5Z-f86pRQ6x4jRhlxzk1yvJ-rpLM6Vq8DrIM"
DATABASE = "969de964"


def clear_database(tx):
    tx.run("MATCH (n) DETACH DELETE n")


def create_graph(tx):
    query = """
    // ── Vendors ──
    CREATE (v1:Vendor {vendor_id: 1, name: 'Samsung Electronics', contact_email: 'support@samsung.com'})
    CREATE (v2:Vendor {vendor_id: 2, name: 'Apple Inc.', contact_email: 'support@apple.com'})
    CREATE (v3:Vendor {vendor_id: 3, name: 'Sony Corporation', contact_email: 'support@sony.com'})

    // ── Products ──
    CREATE (p1:Product {product_id: 101, name: 'Galaxy S24 Ultra', model_code: 'SM-S928B', category: 'Smartphone'})
    CREATE (p2:Product {product_id: 102, name: 'Galaxy Tab S9', model_code: 'SM-X710', category: 'Tablet'})
    CREATE (p3:Product {product_id: 103, name: 'iPhone 16 Pro', model_code: 'A3101', category: 'Smartphone'})
    CREATE (p4:Product {product_id: 104, name: 'AirPods Pro 3', model_code: 'MQJD3', category: 'Audio'})
    CREATE (p5:Product {product_id: 105, name: 'WH-1000XM5', model_code: 'WH1000XM5B', category: 'Headphones'})

    // ── Product Serials ──
    CREATE (s1:Serial {serial_id: 1001, serial_hash: 'a1b2c3d4e5f6', status: 'sold'})
    CREATE (s2:Serial {serial_id: 1002, serial_hash: 'f6e5d4c3b2a1', status: 'sold'})
    CREATE (s3:Serial {serial_id: 1003, serial_hash: 'x7y8z9w0v1u2', status: 'registered'})
    CREATE (s4:Serial {serial_id: 1004, serial_hash: 'p3q4r5s6t7u8', status: 'sold'})
    CREATE (s5:Serial {serial_id: 1005, serial_hash: 'm9n0o1p2q3r4', status: 'sold'})

    // ── Owners ──
    CREATE (o1:Owner {owner_id: 1, name: 'Kaviarasan R', email: 'kavi@example.com'})
    CREATE (o2:Owner {owner_id: 2, name: 'Rahul Sharma', email: 'rahul@example.com'})
    CREATE (o3:Owner {owner_id: 3, name: 'Priya Nair', email: 'priya@example.com'})
    CREATE (o4:Owner {owner_id: 4, name: 'Arjun Menon', email: 'arjun@example.com'})

    // ── Authenticity Checks ──
    CREATE (ac1:AuthCheck {check_id: 'chk-001', checked_at: datetime('2026-01-15T10:30:00'), verification_result: true, details: 'Signature valid'})
    CREATE (ac2:AuthCheck {check_id: 'chk-002', checked_at: datetime('2026-02-20T14:15:00'), verification_result: true, details: 'Signature valid'})
    CREATE (ac3:AuthCheck {check_id: 'chk-003', checked_at: datetime('2026-03-10T09:00:00'), verification_result: false, details: 'Serial not found'})
    CREATE (ac4:AuthCheck {check_id: 'chk-004', checked_at: datetime('2026-03-25T16:45:00'), verification_result: true, details: 'Signature valid'})

    // ═══════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════

    // ── Vendor MANUFACTURES Product ──
    CREATE (v1)-[:MANUFACTURES {since: date('2024-01-01')}]->(p1)
    CREATE (v1)-[:MANUFACTURES {since: date('2023-06-15')}]->(p2)
    CREATE (v2)-[:MANUFACTURES {since: date('2024-09-01')}]->(p3)
    CREATE (v2)-[:MANUFACTURES {since: date('2024-09-01')}]->(p4)
    CREATE (v3)-[:MANUFACTURES {since: date('2023-03-01')}]->(p5)

    // ── Product HAS_SERIAL ──
    CREATE (p1)-[:HAS_SERIAL {manufactured_at: date('2025-06-10')}]->(s1)
    CREATE (p1)-[:HAS_SERIAL {manufactured_at: date('2025-07-22')}]->(s2)
    CREATE (p3)-[:HAS_SERIAL {manufactured_at: date('2025-10-01')}]->(s3)
    CREATE (p4)-[:HAS_SERIAL {manufactured_at: date('2025-11-15')}]->(s4)
    CREATE (p5)-[:HAS_SERIAL {manufactured_at: date('2025-08-05')}]->(s5)

    // ── Serial OWNED_BY Owner (with temporal data) ──
    // s1: Kaviarasan bought it, then sold to Rahul, who sold to Priya
    CREATE (s1)-[:OWNED_BY {acquired_at: datetime('2025-07-01T00:00:00'), relinquished_at: datetime('2025-12-01T00:00:00'), proof_document: 'invoice_hash_001'}]->(o1)
    CREATE (s1)-[:OWNED_BY {acquired_at: datetime('2025-12-01T00:00:00'), relinquished_at: datetime('2026-02-15T00:00:00'), proof_document: 'invoice_hash_002'}]->(o2)
    CREATE (s1)-[:OWNED_BY {acquired_at: datetime('2026-02-15T00:00:00'), proof_document: 'invoice_hash_003'}]->(o3)

    // s3: Arjun is the sole owner
    CREATE (s3)-[:OWNED_BY {acquired_at: datetime('2025-10-20T00:00:00'), proof_document: 'invoice_hash_004'}]->(o4)

    // s4: Priya owns AirPods
    CREATE (s4)-[:OWNED_BY {acquired_at: datetime('2025-12-25T00:00:00'), proof_document: 'invoice_hash_005'}]->(o3)

    // s5: Kaviarasan owns Sony headphones
    CREATE (s5)-[:OWNED_BY {acquired_at: datetime('2025-09-10T00:00:00'), proof_document: 'invoice_hash_006'}]->(o1)

    // ── Owner TRANSFERRED_TO Owner ──
    CREATE (o1)-[:TRANSFERRED_TO {date: datetime('2025-12-01T00:00:00'), serial_id: 1001, transfer_type: 'sale'}]->(o2)
    CREATE (o2)-[:TRANSFERRED_TO {date: datetime('2026-02-15T00:00:00'), serial_id: 1001, transfer_type: 'sale'}]->(o3)

    // ── Serial VERIFIED by AuthCheck ──
    CREATE (s1)-[:VERIFIED {checked_at: datetime('2026-01-15T10:30:00'), result: true}]->(ac1)
    CREATE (s3)-[:VERIFIED {checked_at: datetime('2026-02-20T14:15:00'), result: true}]->(ac2)
    CREATE (s1)-[:VERIFIED {checked_at: datetime('2026-03-25T16:45:00'), result: true}]->(ac4)
    """
    tx.run(query)


def main():
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))

    try:
        driver.verify_connectivity()
        print("✅ Connected to Neo4j Aura successfully!")

        with driver.session(database=DATABASE) as session:
            # Clear existing data
            session.execute_write(clear_database)
            print("🗑️  Cleared existing data")

            # Create graph
            session.execute_write(create_graph)
            print("🌐 Created sample graph data!")

            # Verify counts
            result = session.run("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label")
            print("\n📊 Node counts:")
            for record in result:
                print(f"   {record['label']}: {record['count']}")

            result = session.run("MATCH ()-[r]->() RETURN type(r) AS rel, count(r) AS count ORDER BY rel")
            print("\n🔗 Relationship counts:")
            for record in result:
                print(f"   {record['rel']}: {record['count']}")

            print("\n✅ Done! Open Neo4j Aura console to visualize the graph.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        driver.close()


if __name__ == "__main__":
    main()
