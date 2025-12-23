from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    # Truncate password to 72 bytes before hashing
    # bcrypt has a maximum password length of 72 bytes
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8'))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate password to 72 bytes before verification
    password_bytes = plain_password.encode('utf-8')[:72]
    return pwd_context.verify(password_bytes.decode('utf-8'), hashed_password)