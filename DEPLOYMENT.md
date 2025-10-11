# Deployment Guide

This guide covers different deployment scenarios for your Fetch.AI UAgent.

## Table of Contents
- [Local Development](#local-development)
- [Running in Production](#running-in-production)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Agentverse Deployment](#agentverse-deployment)

## Local Development

### Basic Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run your agent:
```bash
python agent.py
```

### Development Tips

- Use unique seeds for each agent
- Keep ports distinct (8000, 8001, 8002, etc.)
- Monitor logs for debugging
- Test message handling locally first

## Running in Production

### Prerequisites

- Python 3.8+
- Virtual environment
- Process manager (systemd, supervisor, or PM2)

### Setup with systemd (Linux)

1. Create a service file `/etc/systemd/system/my-agent.service`:

```ini
[Unit]
Description=Fetch.AI UAgent
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/HD4_Fetch_AI_UAgent
Environment="PATH=/path/to/HD4_Fetch_AI_UAgent/venv/bin"
ExecStart=/path/to/HD4_Fetch_AI_UAgent/venv/bin/python agent.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start the service:
```bash
sudo systemctl enable my-agent
sudo systemctl start my-agent
sudo systemctl status my-agent
```

3. View logs:
```bash
sudo journalctl -u my-agent -f
```

### Setup with Supervisor

1. Install supervisor:
```bash
pip install supervisor
```

2. Create config file `/etc/supervisor/conf.d/my-agent.conf`:

```ini
[program:my-agent]
command=/path/to/venv/bin/python agent.py
directory=/path/to/HD4_Fetch_AI_UAgent
user=youruser
autostart=true
autorestart=true
stderr_logfile=/var/log/my-agent.err.log
stdout_logfile=/var/log/my-agent.out.log
```

3. Start supervisor:
```bash
supervisorctl reread
supervisorctl update
supervisorctl start my-agent
```

## Docker Deployment

### Create Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent files
COPY agent.py .
COPY config.py .

# Expose port
EXPOSE 8000

# Run agent
CMD ["python", "agent.py"]
```

### Build and Run

```bash
# Build image
docker build -t my-fetchai-agent .

# Run container
docker run -d \
  --name my-agent \
  -p 8000:8000 \
  --restart unless-stopped \
  my-fetchai-agent

# View logs
docker logs -f my-agent
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  agent:
    build: .
    container_name: my-fetchai-agent
    ports:
      - "8000:8000"
    restart: unless-stopped
    environment:
      - AGENT_NAME=my_agent
      - AGENT_PORT=8000
    volumes:
      - ./data:/app/data
```

Run with:
```bash
docker-compose up -d
```

## Cloud Deployment

### AWS EC2

1. Launch an EC2 instance (Ubuntu 22.04 recommended)
2. SSH into the instance
3. Install Python and dependencies:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

4. Clone your repository:
```bash
git clone https://github.com/alpaslan-exe/HD4_Fetch_AI_UAgent.git
cd HD4_Fetch_AI_UAgent
```

5. Setup and run:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python agent.py
```

6. Configure security group to allow your agent's port

### Google Cloud Platform (GCP)

Similar to AWS, but using Google Compute Engine:

1. Create a VM instance
2. Follow the same setup steps as AWS
3. Configure firewall rules

### Heroku

1. Create `Procfile`:
```
worker: python agent.py
```

2. Deploy:
```bash
heroku create my-fetchai-agent
git push heroku main
heroku ps:scale worker=1
```

### DigitalOcean

1. Create a Droplet (Ubuntu)
2. Follow EC2 setup steps
3. Consider using App Platform for easier deployment

## Agentverse Deployment

Agentverse is Fetch.AI's hosted platform for agents.

### Prerequisites

- Agentverse account (https://agentverse.ai)
- Agent address and API key

### Configuration

1. Update your agent code with Mailbox:

```python
from uagents import Agent
from uagents.setup import fund_agent_if_low

agent = Agent(
    name="my_agent",
    seed="your_unique_seed",
    mailbox="your_mailbox_key@https://agentverse.ai",
)

# Fund agent on testnet
fund_agent_if_low(agent.wallet.address())
```

2. Register agent on Agentverse:
   - Go to https://agentverse.ai
   - Create new agent
   - Copy the mailbox key
   - Update your code with the mailbox key

3. Deploy:
   - Upload your agent code to Agentverse
   - Or run locally with mailbox connection

### Mailbox Benefits

- Agents don't need to be always online
- Messages are queued
- Works behind firewalls/NAT
- Easier agent discovery

## Environment Variables

For production, use environment variables:

```python
import os

AGENT_NAME = os.getenv("AGENT_NAME", "my_agent")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))
AGENT_SEED = os.getenv("AGENT_SEED", "default_seed")
MAILBOX_KEY = os.getenv("MAILBOX_KEY", "")
```

Create `.env` file:
```
AGENT_NAME=production_agent
AGENT_PORT=8000
AGENT_SEED=your_super_secret_seed_phrase_change_this
MAILBOX_KEY=your_mailbox_key
```

Load with python-dotenv:
```bash
pip install python-dotenv
```

```python
from dotenv import load_dotenv
load_dotenv()
```

## Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use HTTPS in production**
   - Configure reverse proxy (nginx/caddy)
   - Use Let's Encrypt for SSL certificates

3. **Firewall configuration**
   - Only open necessary ports
   - Use security groups

4. **Update dependencies regularly**
   ```bash
   pip install --upgrade uagents
   ```

5. **Monitor your agent**
   - Set up logging
   - Use monitoring tools (Prometheus, Grafana)
   - Set up alerts

## Monitoring

### Log to File

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)
```

### Health Check Endpoint

Add a simple health check:

```python
@agent.on_interval(period=60.0)
async def health_check(ctx: Context):
    ctx.logger.info(f"Agent {ctx.name} is healthy")
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Agent Not Receiving Messages
- Check firewall rules
- Verify agent address
- Check endpoint configuration
- Ensure agents are on same network

### High Memory Usage
- Monitor with `top` or `htop`
- Check for memory leaks
- Limit storage size
- Use pagination for large datasets

## Scaling

### Horizontal Scaling
- Run multiple agent instances
- Use load balancer
- Different agents for different tasks

### Vertical Scaling
- Increase server resources
- Optimize code
- Use async operations

## Backup and Recovery

1. **Backup agent storage**:
```bash
# Storage is usually in ~/.fetch directory
tar -czf agent-backup.tar.gz ~/.fetch/
```

2. **Backup configuration**:
```bash
cp config.py config.py.backup
```

3. **Version control**:
- Keep code in Git
- Tag releases
- Document changes

## Additional Resources

- [Fetch.AI Documentation](https://docs.fetch.ai/)
- [UAgents GitHub](https://github.com/fetchai/uAgents)
- [Agentverse Platform](https://agentverse.ai/)
- [Community Discord](https://discord.gg/fetchai)

---

**Need Help?** Open an issue on GitHub or join the Fetch.AI community!
