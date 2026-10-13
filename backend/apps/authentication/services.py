import os
import bcrypt
import jwt

from datetime import datetime, timedelta
from dotenv import load_dotenv


load_dotenv()


JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "drivilx-jwt-secret"
)


def hash_password(password):
    """
    Hash user password before storing it in MongoDB.
    """

    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(password, hashed_password):
    """
    Verify plain password against hashed password.
    """

    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def generate_token(user_id, email, role):
    """
    Generate JWT token.
    """

    payload = {
        "user_id": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=1)
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm="HS256"
    )

    return token


def decode_token(token):
    """
    Decode and validate JWT token.
    """

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        return payload

    except jwt.ExpiredSignatureError:

        return None

    except jwt.InvalidTokenError:

        return None