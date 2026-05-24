import imaplib
import email
from email.header import decode_header
import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_EMAIL = os.getenv("GMAIL_EMAIL", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
IMAP_SERVER = "imap.gmail.com"
MAX_EMAILS = 5


def _decode_header_value(value: str) -> str:
    """Decode encoded email header (handles UTF-8, base64, etc.)."""
    parts = decode_header(value)
    decoded = []
    for part, charset in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            decoded.append(part)
    return "".join(decoded)


def get_unread_emails() -> str:
    """Fetch up to 5 most recent unread emails via IMAP and return a spoken-friendly summary."""
    if not GMAIL_EMAIL or not GMAIL_APP_PASSWORD:
        return (
            "Gmail is not configured. "
            "Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD in your .env file. "
            "Use a Gmail App Password, not your regular password."
        )

    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
        mail.select("inbox")

        # Search for UNSEEN (unread) emails
        status, data = mail.search(None, "UNSEEN")
        if status != "OK":
            mail.logout()
            return "Failed to search inbox."

        email_ids = data[0].split()
        if not email_ids:
            mail.logout()
            return "You have no unread emails."

        # Take the most recent MAX_EMAILS (last in list = most recent)
        recent_ids = email_ids[-MAX_EMAILS:][::-1]  # reverse so newest first

        emails = []
        for eid in recent_ids:
            status, msg_data = mail.fetch(eid, "(RFC822)")
            if status != "OK":
                continue

            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)

            sender = _decode_header_value(msg.get("From", "Unknown sender"))
            subject = _decode_header_value(msg.get("Subject", "No subject"))

            # Extract plain text body snippet
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
                            break
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode(msg.get_content_charset() or "utf-8", errors="replace")

            # Trim body to a short spoken snippet
            snippet = " ".join(body.split())[:120]

            # Clean up sender: extract name from "Name <email>" format
            if "<" in sender:
                sender = sender.split("<")[0].strip().strip('"')

            emails.append({"sender": sender, "subject": subject, "snippet": snippet})

        mail.logout()

        if not emails:
            return "You have no unread emails."

        count = len(emails)
        
        # Return raw formatted emails for the backend to process
        emails_text = f"You have {count} unread email{'s' if count != 1 else ''}:\n\n"
        for i, e in enumerate(emails, 1):
            emails_text += f"{i}. From: {e['sender']}\n   Subject: {e['subject']}\n   Preview: {e['snippet']}\n\n"
        
        return emails_text

    except imaplib.IMAP4.error as e:
        return f"Gmail login failed. Check your email and app password. Error: {e}"
    except Exception as e:
        return f"Failed to fetch emails: {e}"
