import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

K = 30  # minimum group size for any admin metric

_key: bytes | None = None


def _get_key() -> bytes:
    global _key
    if _key is None:
        raw = base64.b64decode(settings.journal_encryption_key)
        if len(raw) != 32:
            raise ValueError("JOURNAL_ENCRYPTION_KEY must be 32 bytes (256-bit) base64-encoded")
        _key = raw
    return _key


def enforce_k_anonymity(obj):
    if isinstance(obj, dict):
        n = obj.get("count") or obj.get("n") or obj.get("total")
        if n is not None and isinstance(n, (int, float)) and n < K:
            return {"suppressed": True, "reason": f"Group size below minimum threshold ({K})", "count": None}
        return {k: enforce_k_anonymity(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [enforce_k_anonymity(i) for i in obj]
    return obj


def encrypt_journal(text: str) -> str:
    """AES-256-GCM encrypt. Returns base64(nonce):base64(ciphertext+tag)."""
    nonce = os.urandom(12)
    ct    = AESGCM(_get_key()).encrypt(nonce, text.encode("utf-8"), None)
    return base64.b64encode(nonce).decode() + ":" + base64.b64encode(ct).decode()


def decrypt_journal(blob: str, requesting_user_id: str, entry_user_id: str) -> str:
    if requesting_user_id != entry_user_id:
        raise PermissionError("Journal entries are private to their author")
    nonce_b64, ct_b64 = blob.split(":", 1)
    nonce = base64.b64decode(nonce_b64)
    ct    = base64.b64decode(ct_b64)
    return AESGCM(_get_key()).decrypt(nonce, ct, None).decode("utf-8")
