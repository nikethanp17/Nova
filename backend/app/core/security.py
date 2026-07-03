"""Security module for password encryption.

Provides password hashing and verification using argon2-cffi.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Instantiate the global PasswordHasher instance using default parameters
_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2.

    Args:
        password: The plaintext password string to encrypt.

    Returns:
        str: The hashed password string.
    """
    return _hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a pre-existing Argon2 hash.

    Args:
        password: The plaintext password candidate to check.
        hashed_password: The verified hash to compare against.

    Returns:
        bool: True if the password matches the hash, False otherwise.
    """
    try:
        return _hasher.verify(hashed_password, password)
    except VerifyMismatchError:
        return False
