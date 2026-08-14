import secrets
import string


def generate_meeting_code(length: int = 10) -> str:
    characters = string.ascii_uppercase + string.digits

    return "".join(
        secrets.choice(characters)
        for _ in range(length)
    )