from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import base64


# Command to generate a 256-bit key: openssl rand -hex 32
def get_aes_key() -> bytes:
    """
    Retrieves the AES encryption key from the environment variable `AES_KEY`.

    Ensures the key is a valid hexadecimal string and is 32 bytes long
    (for AES-256 encryption). If any condition is not met, raises an exception.

    Returns:
        bytes: The AES key as a byte array.

    Raises:
        ValueError: If `AES_KEY` is not set.
        TypeError: If `AES_KEY` is not a valid hexadecimal string.
        ValueError: If `AES_KEY` is not 32 bytes long.
    """
    master_key = os.getenv("AES_KEY")

    if master_key is None:
        raise ValueError("AES_KEY is not set in the environment variables.")

    try:
        master_key_bytes = bytes.fromhex(master_key)
    except ValueError as e:
        raise TypeError("AES_KEY must be a valid hexadecimal string.") from e

    if len(master_key_bytes) != 32:
        raise ValueError("AES_KEY must be 32 bytes (64 hex characters) for AES-256.")

    return master_key_bytes


def encrypt_token(data: str) -> str:
    """
    Encrypts a given string using AES-256 in GCM mode.

    This function generates a random Initialization Vector (IV), encrypts
    the input string, and returns the IV, ciphertext, and authentication tag
    encoded in Base64.

    Args:
        data (str): The plaintext string to encrypt.

    Returns:
        str: The encrypted string in Base64 containing IV, ciphertext, and tag.
    """
    key = get_aes_key()
    iv = os.urandom(12)  # IV (nonce) of 12 bytes for AES-GCM

    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    ciphertext = encryptor.update(data.encode()) + encryptor.finalize()
    tag = encryptor.tag  # Authentication tag

    # Concatenate IV, ciphertext, and tag
    encrypted_data = iv + ciphertext + tag

    # Encode to Base64
    return base64.b64encode(encrypted_data).decode('utf-8')


def decrypt_token(encrypted_data: str) -> str:
    """
    Decrypts a given Base64-encoded encrypted token containing IV, ciphertext,
    and authentication tag using AES-256 in GCM mode.

    This function extracts the IV, ciphertext, and tag, then decrypts and
    verifies the authenticity of the data.

    Args:
        encrypted_data (str): The Base64-encoded string containing IV, ciphertext, and tag.

    Returns:
        str: The decrypted plaintext string.
    """
    key = get_aes_key()
    encrypted_data_bytes = base64.b64decode(encrypted_data)

    iv = encrypted_data_bytes[:12]  # First 12 bytes = IV
    tag = encrypted_data_bytes[-16:]  # Last 16 bytes = Authentication tag
    ciphertext = encrypted_data_bytes[12:-16]  # Middle part = Ciphertext

    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
    decryptor = cipher.decryptor()

    decrypted_data = decryptor.update(ciphertext) + decryptor.finalize()

    return decrypted_data.decode()
