# Getting Started with Fetch.AI UAgent Template

Welcome! This guide will help you get started with the Fetch.AI UAgent template in just a few minutes.

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

**On Linux/Mac:**
```bash
./quickstart.sh
```

**On Windows:**
```bash
quickstart.bat
```

**Manual Installation:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate.bat  # Windows

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Run Your First Agent

```bash
python agent.py
```

You should see output like:
```
[INFO] Agent my_agent is starting up
[INFO] Agent address: agent1q...
[INFO] Periodic task running for agent: my_agent
```

**Congratulations! 🎉 Your first agent is running!**

Press `Ctrl+C` to stop the agent.

## 📚 What's Included

This template provides everything you need to build Fetch.AI agents:

### Core Files

| File | Description |
|------|-------------|
| `agent.py` | Basic agent template - **Start here!** |
| `agent_advanced.py` | Advanced features (protocols, storage, queries) |
| `agent_communication.py` | Two agents talking to each other |
| `example_usage.py` | Custom task processor example |
| `config.py` | Configuration settings |

### Documentation

| File | Description |
|------|-------------|
| `README.md` | Complete documentation and API reference |
| `GETTING_STARTED.md` | This file - quick start guide |
| `DEPLOYMENT.md` | How to deploy to production |
| `CONTRIBUTING.md` | How to contribute to the project |

### Other Files

| File | Description |
|------|-------------|
| `requirements.txt` | Python dependencies |
| `setup.py` | Package configuration |
| `.gitignore` | Git ignore rules |
| `LICENSE` | MIT License |

## 🎯 Next Steps

### 1. Understand the Basic Agent

Open `agent.py` and look at the structure:

```python
# 1. Import required modules
from uagents import Agent, Context, Model

# 2. Define message types
class Message(Model):
    message: str

# 3. Create your agent
agent = Agent(name="my_agent", port=8000)

# 4. Add handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("Starting...")

# 5. Run the agent
agent.run()
```

### 2. Customize Your Agent

Edit `agent.py`:

1. Change the agent name:
```python
agent = Agent(name="YOUR_AGENT_NAME", port=8000)
```

2. Update the seed (important for production):
```python
agent = Agent(
    name="YOUR_AGENT_NAME",
    seed="your_unique_seed_phrase_here"
)
```

3. Modify what the agent does:
```python
@agent.on_interval(period=10.0)
async def my_task(ctx: Context):
    # Your custom logic here
    ctx.logger.info("Doing something cool!")
```

### 3. Try Agent Communication

Run the communication example to see agents talking:

```bash
python agent_communication.py
```

You'll see Alice and Bob exchanging greetings!

### 4. Build Your Own Agent

Use `example_usage.py` as a template:

1. Copy the file:
```bash
cp example_usage.py my_agent.py
```

2. Customize the message models
3. Implement your business logic
4. Test it out!

## 🔑 Key Concepts

### Agents

Agents are autonomous programs that can:
- Send and receive messages
- Run periodic tasks
- Store data
- Make decisions
- Interact with other agents

### Message Models

Define the structure of messages:

```python
class MyMessage(Model):
    field1: str
    field2: int
    field3: bool
```

### Handlers

Functions that respond to events:

```python
@agent.on_event("startup")        # When agent starts
@agent.on_event("shutdown")       # When agent stops
@agent.on_interval(period=10.0)   # Every 10 seconds
@agent.on_message(model=Message)  # When message received
```

### Context

The `ctx` parameter gives you access to:
- `ctx.logger` - Logging
- `ctx.storage` - Persistent storage
- `ctx.send()` - Send messages
- `ctx.name` - Agent name
- `ctx.address` - Agent address

## 📖 Common Tasks

### Sending Messages

```python
await ctx.send(recipient_address, Message(message="Hello!"))
```

### Storing Data

```python
# Store
ctx.storage.set("key", "value")

# Retrieve
value = ctx.storage.get("key")
```

### Logging

```python
ctx.logger.info("Information message")
ctx.logger.warning("Warning message")
ctx.logger.error("Error message")
```

### Periodic Tasks

```python
@agent.on_interval(period=30.0)  # Every 30 seconds
async def periodic_task(ctx: Context):
    ctx.logger.info("Running periodic task")
```

## 🛠️ Troubleshooting

### Port Already in Use

Change the port number:
```python
agent = Agent(name="my_agent", port=8001)  # Try different port
```

### Dependencies Won't Install

Try upgrading pip:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Agent Won't Start

1. Check Python version: `python3 --version` (need 3.8+)
2. Verify virtual environment is activated
3. Check the logs for specific errors

## 🎓 Learning Path

1. **Beginner**: Run and modify `agent.py`
2. **Intermediate**: Try `agent_communication.py`
3. **Advanced**: Explore `agent_advanced.py`
4. **Expert**: Build your own multi-agent system

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Examples**: Check the `examples/` directory
- **Fetch.AI Docs**: https://docs.fetch.ai/
- **Community**: https://discord.gg/fetchai

## 💡 Example Projects

Here are ideas for what you can build:

1. **Weather Agent**: Fetch and share weather data
2. **Price Oracle**: Monitor and report cryptocurrency prices
3. **Task Scheduler**: Coordinate tasks between agents
4. **Data Aggregator**: Collect data from multiple sources
5. **Smart Home Controller**: Control IoT devices
6. **Trading Bot**: Automated trading logic
7. **Alert System**: Monitor and send notifications
8. **Data Marketplace**: Buy and sell data between agents

## 🤝 Getting Help

- **GitHub Issues**: Open an issue for bugs or questions
- **Community**: Join the Fetch.AI Discord
- **Documentation**: Check README.md and DEPLOYMENT.md
- **Examples**: Study the provided examples

## ✨ Best Practices

1. Always use unique seeds in production
2. Test locally before deploying
3. Use meaningful agent names
4. Add error handling
5. Log important events
6. Store configuration separately
7. Document your code
8. Version your agents

## 🎉 You're Ready!

You now have everything you need to build amazing agents with Fetch.AI!

Start with `agent.py`, experiment, and build something awesome! 🚀

---

**Questions?** Check the README.md or open an issue on GitHub!
