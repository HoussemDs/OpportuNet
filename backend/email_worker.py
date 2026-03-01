import imaplib
import email
from email.header import decode_header
import time
import os
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import json

# Load environment variables
load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_PASS")
API_URL = "http://localhost:8000/messages/"

def clean_text(text):
    """Clean the email content."""
    if not text:
        return ""
    # Remove extra whitespace and newlines
    return " ".join(text.split())

def get_email_body(msg):
    """Extract the body from an email message."""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                return part.get_payload(decode=True).decode()
            elif content_type == "text/html" and "attachment" not in content_disposition:
                html = part.get_payload(decode=True).decode()
                soup = BeautifulSoup(html, "html.parser")
                return soup.get_text()
    else:
        content_type = msg.get_content_type()
        if content_type == "text/plain":
            return msg.get_payload(decode=True).decode()
        elif content_type == "text/html":
            html = msg.get_payload(decode=True).decode()
            soup = BeautifulSoup(html, "html.parser")
            return soup.get_text()
    return ""

def fetch_emails():
    """Fetch emails from alert@distill.io using IMAP."""
    print(f"Connecting to Gmail as {GMAIL_USER}...")
    try:
        # Connect to Gmail IMAP
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_USER, GMAIL_PASS)
        mail.select("inbox")

        # Search for emails from alert@distill.io
        # status, messages = mail.search(None, '(FROM "alert@distill.io" UNSEEN)')
        status, messages = mail.search(None, '(FROM "alert@distill.io")') # Search all for now to verify it works

        if status != "OK":
            print("No messages found!")
            return

        # Get the list of email IDs
        email_ids = messages[0].split()
        print(f"Found {len(email_ids)} emails from alert@distill.io")

        # Process the last 5 emails for testing (to avoid overload)
        for e_id in email_ids[-5:]:
            status, msg_data = mail.fetch(e_id, "(RFC822)")
            if status != "OK":
                continue

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    sender = msg.get("From")
                    date = msg.get("Date")
                    body = get_email_body(msg)

                    print(f"Processing email: {subject}")

                    # Determine source from subject or body
                    source = "Unknown"
                    if "LinkedIn" in subject or "LinkedIn" in body:
                        source = "LinkedIn"
                    elif "Upwork" in subject or "Upwork" in body:
                        source = "Upwork"
                    elif "Fiverr" in subject or "Fiverr" in body:
                        source = "Fiverr"
                    elif "Kaggle" in subject or "Kaggle" in body:
                        source = "Kaggle"
                    elif "ZipRecruiter" in subject or "ZipRecruiter" in body:
                        source = "ZipRecruiter"
                    elif "SimplyHired" in subject or "SimplyHired" in body:
                        source = "SimplyHired"
                    elif "Glassdoor" in subject or "Glassdoor" in body:
                        source = "Glassdoor"
                    elif "Freelancer" in subject or "Freelancer" in body:
                        source = "Freelancer"
                    elif "DEV" in subject or "DEV" in body:
                        source = "DEV"

                    # Send to backend API
                    payload = {
                        "subject": subject,
                        "content": body,
                        "source": source,
                        "sender_email": "alert@distill.io"
                    }

                    try:
                        resp = requests.post(API_URL, json=payload)
                        if resp.status_code == 200:
                            print(f"Successfully saved and analyzed: {subject}")
                            # Mark as read if it was unseen
                            # mail.store(e_id, '+FLAGS', '\\Seen')
                        else:
                            print(f"Failed to save email: {resp.text}")
                    except Exception as api_err:
                        print(f"API Error: {api_err}")

        mail.logout()
    except Exception as e:
        print(f"Error fetching emails: {e}")

if __name__ == "__main__":
    while True:
        fetch_emails()
        print("Waiting 5 minutes for next check...")
        time.sleep(300) # Check every 5 minutes
