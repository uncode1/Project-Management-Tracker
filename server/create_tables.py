#!/usr/bin/env python3
"""Script to create database tables."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
print(f"DATABASE_URL from env: {os.getenv('DATABASE_URL')}")

from app import create_app

app = create_app()

with app.app_context():
    # Import all models so SQLAlchemy knows about them
    from app.models import Tenant, User, Team, Board, BoardList, Card, RefreshToken
    from app.extensions import db
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    db.create_all()
    print("Database tables created successfully!")