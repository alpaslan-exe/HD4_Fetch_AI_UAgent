"""
Configuration file for Fetch.AI UAgent
"""

# Agent Configuration
AGENT_NAME = "my_agent"
AGENT_PORT = 8000
AGENT_SEED = "my_agent_seed_phrase"  # Change this for production
AGENT_ENDPOINT = "http://localhost:8000/submit"

# Network Configuration
# Options: "mainnet", "testnet", "local"
NETWORK = "local"

# Logging Configuration
LOG_LEVEL = "INFO"  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL

# Mailbox Configuration (for persistent agent communication)
MAILBOX_ENABLED = False
MAILBOX_SERVER_URL = "https://agentverse.ai"
MAILBOX_API_KEY = ""  # Add your Agentverse API key here

# Protocol Configuration
PROTOCOL_DIGEST = ""  # Add protocol digest if using specific protocols
