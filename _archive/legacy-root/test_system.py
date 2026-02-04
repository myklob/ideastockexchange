"""
Quick test script to verify the system is working.
Run this after installing dependencies.
"""

import sys

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    try:
        import models
        print("  ✓ models.py")
        import database
        print("  ✓ database.py")
        import overlap_engine
        print("  ✓ overlap_engine.py")
        import services
        print("  ✓ services.py")
        import main
        print("  ✓ main.py")
        print("\n✅ All imports successful!\n")
        return True
    except Exception as e:
        print(f"\n❌ Import error: {e}\n")
        return False

def test_database():
    """Test database initialization."""
    print("Testing database initialization...")
    try:
        from database import init_db
        init_db()
        print("  ✓ Database schema created")
        print("\n✅ Database test successful!\n")
        return True
    except Exception as e:
        print(f"\n❌ Database error: {e}\n")
        return False

def test_overlap_engine():
    """Test overlap scoring engine."""
    print("Testing overlap scoring engine...")
    try:
        from overlap_engine import get_overlap_engine
        engine = get_overlap_engine()

        # Test embedding generation
        embedding = engine.generate_embedding("Test text")
        print(f"  ✓ Embedding generated (shape: {embedding.shape})")

        # Test semantic overlap
        emb1 = engine.generate_embedding("Climate change is caused by CO2 emissions")
        emb2 = engine.generate_embedding("Global warming from carbon dioxide")
        score = engine.calculate_semantic_overlap(emb1, emb2)
        print(f"  ✓ Semantic overlap calculated: {score}%")

        print("\n✅ Overlap engine test successful!\n")
        return True
    except Exception as e:
        print(f"\n❌ Overlap engine error: {e}\n")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("IDEA STOCK EXCHANGE - System Tests")
    print("="*60 + "\n")

    results = []
    results.append(("Imports", test_imports()))
    results.append(("Database", test_database()))
    results.append(("Overlap Engine", test_overlap_engine()))

    print("="*60)
    print("SUMMARY")
    print("="*60)
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")

    all_passed = all(result[1] for result in results)
    if all_passed:
        print("\n✅ All tests passed! System is ready.")
        print("\nNext steps:")
        print("  1. Run demo data: python demo_data.py")
        print("  2. Start server: uvicorn main:app --reload")
        print("  3. Visit: http://localhost:8000")
    else:
        print("\n❌ Some tests failed. Check errors above.")
        sys.exit(1)
