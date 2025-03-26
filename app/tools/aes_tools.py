from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import os
import base64


# Command to generate a 256-bit key: openssl rand -hex 32

def get_aes_key() -> bytes:
    """
    Retrieves the AES encryption key from the environment variable `AES_KEY`.

    This function checks if the `AES_KEY` is set as an environment variable,
    ensures it is a valid hexadecimal string, and verifies that it is 32 bytes long
    (for AES-256 encryption). If any of these conditions are not met, an exception is raised.

    Returns:
        bytes: The AES key as a byte array.

    Raises:
        Exception: If `AES_KEY` is not set, is not a valid hexadecimal string,
                   or is not 32 bytes long.
    """
    # Retrieve the AES key from the environment variable
    master_key = os.getenv("AES_KEY")

    # Check if the key is set
    if master_key is None:
        raise Exception("AES_KEY is not set")

    # Check if the key is a valid hexadecimal string
    try:
        master_key_bytes = bytes.fromhex(master_key)
    except ValueError:
        raise Exception("AES_KEY must be a valid hexadecimal string")

    # Check if the key is 32 bytes long (64 hexadecimal characters)
    if len(master_key_bytes) != 32:
        raise Exception(
            "AES_KEY must be 32 bytes (64 hex characters) for AES-256")

    # Return the AES key as bytes
    return master_key_bytes


def encrypt_token(data: str) -> str:
    """
        Encrypts a given string using AES-256 in CBC mode with PKCS7 padding.

        This function generates a random Initialization Vector (IV), encrypts
        the input string, and returns the IV concatenated with the ciphertext
        encoded in Base64 for easier storage and transmission.

        Args:
            data (str): The plaintext string to encrypt.

        Returns:
            str: The encrypted string, encoded in Base64, containing both
                 the IV and the ciphertext.
    """
    # Generate a random Initialization Vector (IV)
    iv = os.urandom(16)

    # Apply padding to the input data to match the AES block size
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_token = padder.update(data.encode()) + padder.finalize()

    # Create the AES Cipher object with the key and IV
    cipher = Cipher(algorithms.AES(get_aes_key()), modes.CBC(iv),
                    backend=default_backend())
    encryptor = cipher.encryptor()

    # Encrypt the padded data
    ciphertext = encryptor.update(padded_token) + encryptor.finalize()

    # Concatenate the IV with the ciphertext for storage
    iv_and_ciphertext = iv + ciphertext

    # Encode the result to Base64 for a readable and storable format
    encrypted_token = base64.b64encode(iv_and_ciphertext).decode('utf-8')

    return encrypted_token


def decrypt_token(encrypted_data: str) -> str:
    """
    Decrypts a given Base64-encoded encrypted token containing both the IV
    and the ciphertext using AES-256 in CBC mode with PKCS7 padding.

    This function extracts the IV, decrypts the ciphertext, and removes
    the padding to return the original plaintext string.

    Args:
        encrypted_data (str): The Base64-encoded string containing both
                               the IV and the ciphertext.

    Returns:
        str: The decrypted plaintext string.
    """
    # Decode the Base64-encoded data to retrieve the IV and ciphertext
    encrypted_data_bytes = base64.b64decode(encrypted_data)

    # Extract the IV from the first 16 bytes
    iv = encrypted_data_bytes[:16]

    # The remaining part is the ciphertext
    ciphertext = encrypted_data_bytes[16:]

    # Create the AES Cipher object with the key and IV for decryption
    cipher = Cipher(algorithms.AES(get_aes_key()), modes.CBC(iv),
                    backend=default_backend())
    decryptor = cipher.decryptor()

    # Decrypt the ciphertext
    padded_token = decryptor.update(ciphertext) + decryptor.finalize()

    # Remove the padding using PKCS7 unpadding
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    token = unpadder.update(padded_token) + unpadder.finalize()

    # Return the decrypted token as a string
    return token.decode()
