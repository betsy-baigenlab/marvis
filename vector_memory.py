import os
import chromadb
from datetime import datetime

# Initialize persistent chroma client
DB_DIR = os.path.expanduser("~/JARVIS/chroma_data")
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

# Suppress telemetry/warnings in console
os.environ["CHROMA_TELEMETRY_IMPL"] = "None"

client = chromadb.PersistentClient(path=DB_DIR)
collection = client.get_or_create_collection(name="conversations")

def add_memory(text: str, role: str = "user"):
    """Embeds and saves a conversational turn into the vector DB."""
    if not text.strip():
        return
        
    doc_id = f"{role}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    try:
        collection.add(
            documents=[text],
            metadatas=[{"role": role, "timestamp": datetime.now().isoformat()}],
            ids=[doc_id]
        )
    except Exception as e:
        print(f"[Vector Memory Error]: {e}")

def search_memory(query: str, n_results: int = 3) -> list:
    """Searches the vector DB for the most relevant past memories."""
    try:
        count = collection.count()
        if count == 0:
            return []
            
        n = min(n_results, count)
        results = collection.query(
            query_texts=[query],
            n_results=n
        )
        
        memories = []
        if results and 'documents' in results and results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                memories.append(f"[{meta['role']}] {doc}")
                
        return memories
    except Exception as e:
        print(f"[Vector Search Error]: {e}")
        return []
