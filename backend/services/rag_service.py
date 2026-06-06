import os
from functools import lru_cache

import faiss
from llama_index.core import Settings, SimpleDirectoryReader, StorageContext, VectorStoreIndex
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.faiss import FaissVectorStore

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "tenant_laws")


@lru_cache(maxsize=1)
def _load_index() -> VectorStoreIndex | None:
    if not os.path.isdir(DATA_DIR):
        return None

    documents = SimpleDirectoryReader(DATA_DIR).load_data()
    if not documents:
        return None

    embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    Settings.embed_model = embed_model

    faiss_index = faiss.IndexFlatL2(embed_model.embed_dim)
    vector_store = FaissVectorStore(faiss_index=faiss_index)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    return VectorStoreIndex.from_documents(documents, storage_context=storage_context)


def get_context(question: str, state: str) -> str:
    index = _load_index()
    if not index:
        return ""

    query_engine = index.as_query_engine(similarity_top_k=5)
    response = query_engine.query(f"{state} tenant law guidance: {question}")
    return str(response)
