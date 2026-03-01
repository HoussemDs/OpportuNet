from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
import anthropic
import json

from database import get_db, engine
import models
import schemas

import os
from dotenv import load_dotenv

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Intel AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")

MONITORED_SITES = {
    "kaggle": {
        "name": "Kaggle Competitions",
        "url": "https://www.kaggle.com/competitions",
        "purpose": "Data science & ML competitions with cash prizes",
        "how_to_setup": "1. Create account at kaggle.com\n2. Go to Competitions section\n3. Copy the URL of your filtered competitions page\n4. Paste that URL into Distill.io as a new watch\n5. Set the selector to the competitions list container",
        "distill_tip": "Monitor the competitions list page for new entries",
        "icon": "🏆"
    },
    "scholar": {
        "name": "Google Scholar",
        "url": "https://scholar.google.com",
        "purpose": "Track academic papers & research alerts in your field",
        "how_to_setup": "1. Go to scholar.google.com\n2. Search your topic (e.g. 'large language models')\n3. Copy the search results URL\n4. Add that URL to Distill.io\n5. Select the results list as the monitored element",
        "distill_tip": "Monitor specific search query result pages for new papers",
        "icon": "📚"
    },
    "bluesky": {
        "name": "Bluesky",
        "url": "https://bsky.app",
        "purpose": "Social network — track industry discussions, job posts, networking",
        "how_to_setup": "1. Create account at bsky.app\n2. Search relevant hashtags like #AIJobs\n3. Copy the search result URL\n4. Add to Distill.io to watch for new posts",
        "distill_tip": "Track hashtags like #AIJobs #FreelanceAI #MLEngineer",
        "icon": "🦋"
    },
    "upwork": {
        "name": "Upwork Messages",
        "url": "https://www.upwork.com/ab/messaging/",
        "purpose": "Freelance platform — client messages, job invitations",
        "how_to_setup": "1. Create profile at upwork.com\n2. Navigate to your Messages section\n3. Add the messages page URL to Distill.io\n4. Select the unread count or message list as the element",
        "distill_tip": "Monitor the unread count badge so you get alerts on new messages",
        "icon": "💼"
    },
    "dev": {
        "name": "DEV Community",
        "url": "https://dev.to",
        "purpose": "Developer articles, job board, networking with tech community",
        "how_to_setup": "1. Create account at dev.to\n2. Navigate to Jobs or search 'AI' / 'ML'\n3. Copy the filtered jobs URL\n4. Add to Distill.io to monitor new job postings",
        "distill_tip": "Watch the jobs section filtered by your skills (AI, Python, ML)",
        "icon": "👨‍💻"
    },
    "ziprecruiter": {
        "name": "ZipRecruiter",
        "url": "https://www.ziprecruiter.com",
        "purpose": "Job search aggregator — AI/ML job listings",
        "how_to_setup": "1. Go to ziprecruiter.com\n2. Search 'AI Engineer Remote' or your target role\n3. Copy your filtered search URL\n4. Add to Distill.io to get alerts on new postings",
        "distill_tip": "Monitor the job count number at the top of search results",
        "icon": "🔍"
    },
    "simplyhired": {
        "name": "SimplyHired",
        "url": "https://www.simplyhired.com",
        "purpose": "Remote AI job listings aggregator",
        "how_to_setup": "1. Search 'AI jobs remote' on simplyhired.com\n2. Apply your preferred filters (salary, experience)\n3. Copy the search URL\n4. Add to Distill.io to watch for new listings",
        "distill_tip": "Track the total job count or the first few job titles in results",
        "icon": "🌐"
    },
    "glassdoor": {
        "name": "Glassdoor / DevsData",
        "url": "https://www.glassdoor.com",
        "purpose": "Company reviews + job listings with salary transparency",
        "how_to_setup": "1. Search for AI/ML roles on glassdoor.com\n2. Filter by location, experience, and salary\n3. Copy the search results URL\n4. Monitor with Distill.io for new job postings",
        "distill_tip": "Watch for new job postings from specific target companies",
        "icon": "🏢"
    },
    "fiverr": {
        "name": "Fiverr",
        "url": "https://www.fiverr.com",
        "purpose": "Freelance marketplace — buyer requests and order notifications",
        "how_to_setup": "1. Create seller profile at fiverr.com\n2. Optimize gigs for AI/ML services\n3. Go to Selling > Buyer Requests\n4. Add that page URL to Distill.io",
        "distill_tip": "Watch the Buyer Requests section for your AI/ML niche",
        "icon": "🟢"
    },
    "freelancer": {
        "name": "Freelancer",
        "url": "https://www.freelancer.com",
        "purpose": "Freelance project bidding platform",
        "how_to_setup": "1. Create account at freelancer.com\n2. Search 'Machine Learning' or 'AI' projects\n3. Copy the filtered search URL\n4. Add to Distill.io to watch for new projects posted",
        "distill_tip": "Track new projects in AI/ML/Data Science category daily",
        "icon": "🎯"
    },
    "linkedin": {
        "name": "LinkedIn",
        "url": "https://www.linkedin.com",
        "purpose": "Professional networking, job applications, recruiter messages",
        "how_to_setup": "1. Optimize LinkedIn profile with AI/ML keywords\n2. Go to Jobs and search your target role\n3. Apply filters (Remote, date posted: past week)\n4. Copy the filtered jobs URL\n5. Add to Distill.io",
        "distill_tip": "Monitor LinkedIn Jobs search and also your Messages inbox page",
        "icon": "💼"
    }
}


def analyze_with_ai(message_content: str, source: str) -> dict:
    """Use Claude AI to analyze the distill.io alert and provide actionable guidance."""
    # Note: Modern anthropic client (>=0.21.0) does not use the 'proxies' argument in __init__
    # However, some environments might have an older version cached.
    # Using the standard environment variables is the safest way.
    import httpx
    # Force use of a standard httpx client to bypass any legacy 'proxies' injection in the anthropic library's base class if it exists in this specific environment's version
    http_client = httpx.Client()
    client = anthropic.Anthropic(api_key=CLAUDE_API_KEY, http_client=http_client)

    prompt = f"""You are a professional career and freelance opportunity advisor for Raef, an AI Engineer.

I received an automated alert from Distill.io monitoring this source: {source}

Alert content:
{message_content}

Analyze this alert and provide:
1. A brief summary of what changed/what opportunity this is
2. Priority level (High/Medium/Low) with reasoning
3. Exact numbered action steps (very specific and actionable)
4. A suggested reply/response message if applicable (ready to copy-paste), or null if no reply needed
5. A realistic timeline (e.g. "Reply within 2 hours", "Submit proposal by EOD")
6. Any red flags or important notes to watch out for
7. **CRITICAL CHECK**: If this is a job or freelance opportunity, ask Raef if he has a landing page or social media presence (LinkedIn, Twitter, GitHub) that is ready to be shared with the client. If not, suggest he creates one.

Respond ONLY with valid JSON, no extra text:
{{
  "summary": "...",
  "priority": "High or Medium or Low",
  "priority_reason": "...",
  "action_steps": ["step1", "step2", "step3"],
  "suggested_reply": "...(or null if no reply needed)",
  "timeline": "...",
  "deadline": "...",
  "red_flags": ["flag1", "flag2"],
  "opportunity_score": 7,
  "estimated_value": "$500 contract or Strategic",
  "readiness_check": "Do you have a landing page or social media presence ready for this? (Yes/No - if No, suggested next steps to create one)"
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])

    return json.loads(text)


# ─── ROUTES ───────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Job Intel AI is running", "version": "1.0.0"}


@app.post("/messages/", response_model=schemas.MessageResponse)
def create_message(message: schemas.MessageCreate, db: Session = Depends(get_db)):
    """Receive a new alert message and auto-analyze it with AI."""
    db_message = models.Message(
        subject=message.subject,
        content=message.content,
        source=message.source,
        sender_email=message.sender_email,
        received_at=datetime.utcnow(),
        status="pending"
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    try:
        analysis = analyze_with_ai(message.content, message.source)
        db_message.ai_summary = analysis.get("summary")
        db_message.priority = analysis.get("priority", "Medium")
        db_message.priority_reason = analysis.get("priority_reason")
        db_message.action_steps = json.dumps(analysis.get("action_steps", []))
        db_message.suggested_reply = analysis.get("suggested_reply")
        db_message.timeline = analysis.get("timeline")
        db_message.deadline = analysis.get("deadline")
        db_message.red_flags = json.dumps(analysis.get("red_flags", []))
        db_message.opportunity_score = float(analysis.get("opportunity_score", 5))
        db_message.estimated_value = analysis.get("estimated_value")
        db_message.readiness_check = analysis.get("readiness_check")
        db_message.status = "analyzed"
        db.commit()
        db.refresh(db_message)
    except Exception as e:
        db_message.status = "error"
        db_message.ai_summary = f"Analysis failed: {str(e)}"
        db.commit()
        db.refresh(db_message)

    return db_message


@app.get("/messages/", response_model=List[schemas.MessageResponse])
def get_messages(
    skip: int = 0,
    limit: int = 50,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Message)
    if priority:
        query = query.filter(models.Message.priority == priority)
    if status:
        query = query.filter(models.Message.status == status)
    return query.order_by(models.Message.received_at.desc()).offset(skip).limit(limit).all()


@app.get("/messages/{message_id}", response_model=schemas.MessageResponse)
def get_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@app.post("/messages/{message_id}/reanalyze", response_model=schemas.MessageResponse)
def reanalyze_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    try:
        analysis = analyze_with_ai(msg.content, msg.source)
        msg.ai_summary = analysis.get("summary")
        msg.priority = analysis.get("priority", "Medium")
        msg.priority_reason = analysis.get("priority_reason")
        msg.action_steps = json.dumps(analysis.get("action_steps", []))
        msg.suggested_reply = analysis.get("suggested_reply")
        msg.timeline = analysis.get("timeline")
        msg.deadline = analysis.get("deadline")
        msg.red_flags = json.dumps(analysis.get("red_flags", []))
        msg.opportunity_score = float(analysis.get("opportunity_score", 5))
        msg.estimated_value = analysis.get("estimated_value")
        msg.readiness_check = analysis.get("readiness_check")
        msg.status = "analyzed"
        db.commit()
        db.refresh(msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return msg


@app.patch("/messages/{message_id}/status")
def update_status(message_id: int, status: str, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.status = status
    db.commit()
    return {"success": True, "status": status}


@app.delete("/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"success": True}


@app.get("/sites/")
def get_monitored_sites():
    return MONITORED_SITES


@app.get("/stats/")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(models.Message).count()
    high = db.query(models.Message).filter(models.Message.priority == "High").count()
    medium = db.query(models.Message).filter(models.Message.priority == "Medium").count()
    low = db.query(models.Message).filter(models.Message.priority == "Low").count()
    pending = db.query(models.Message).filter(models.Message.status == "pending").count()
    analyzed = db.query(models.Message).filter(models.Message.status == "analyzed").count()
    actioned = db.query(models.Message).filter(models.Message.status == "actioned").count()
    return {
        "total": total,
        "high_priority": high,
        "medium_priority": medium,
        "low_priority": low,
        "pending": pending,
        "analyzed": analyzed,
        "actioned": actioned
    }


@app.post("/simulate/")
def simulate_alert(source: str = "LinkedIn", db: Session = Depends(get_db)):
    """Simulate a Distill.io alert for testing."""
    samples = {
        "LinkedIn": "New message from Sarah Chen (Senior Recruiter at TechCorp AI): Hi Raef, I came across your profile and I'm really impressed with your AI/ML background, especially your work on LLMs and chatbots. We have an exciting Senior AI Engineer position - fully remote, $150k-$180k base + equity. We'd love to have a quick 15-min call this week. Are you open to it?",
        "Fiverr": "New Order Received! Client: john_startup has placed an order for your 'Custom AI Chatbot Development' gig. Order value: $500. Project brief: Build a customer service chatbot for my e-commerce store using Python + OpenAI. Must handle returns, order tracking, FAQs. Deadline: 7 days.",
        "Kaggle": "New Competition Alert: 'Medical Image Segmentation Challenge 2025' has been posted. Prize pool: $25,000 (1st: $15k, 2nd: $7k, 3rd: $3k). Task: Segment tumors in MRI scans using deep learning. Data: 10,000 annotated scans provided. Submission deadline: 45 days. Current participants: 234.",
        "ZipRecruiter": "3 new jobs match your saved search 'AI Engineer Remote': 1) Senior AI Research Scientist - Anthropic - Remote - $200k-250k 2) ML Engineer - Mistral AI - Remote/Paris - $180k + equity 3) Applied AI Engineer - Cohere - Remote - $160k-190k. Apply before these close!"
    }

    content = samples.get(source, f"Distill.io detected a change on your monitored {source} page. New content or updates were found that match your watch criteria.")

    msg_data = schemas.MessageCreate(
        subject=f"Distill.io Alert — {source} update detected",
        content=content,
        source=source,
        sender_email="alert@distill.io"
    )
    return create_message(msg_data, db)
