import os

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            print(f"\n📄 {path}")
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().startswith("def "):
                        print("   ", line.strip())