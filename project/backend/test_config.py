import sys
print("Python version:", sys.version)
try:
    from config import YT_DLP_CONFIG
    print("✅ Config loaded successfully")
    print("Config has", len(YT_DLP_CONFIG), "keys")
    print("User-Agent present:", 'user_agent' in YT_DLP_CONFIG)
except Exception as e:
    print("❌ Error:", str(e))
    import traceback
    traceback.print_exc()
