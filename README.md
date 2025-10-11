# HD4 Fetch.AI UAgent Template

A comprehensive Python template for creating Fetch.AI UAgents with examples and best practices.

## Overview

This template provides a complete starting point for building autonomous agents using the Fetch.AI UAgents framework. It includes basic examples, advanced features, and agent-to-agent communication patterns.

## Features

- ✅ Basic agent template with essential handlers
- ✅ Advanced agent with protocols and storage
- ✅ Agent-to-agent communication examples
- ✅ Configuration management
- ✅ Comprehensive documentation
- ✅ Production-ready structure

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/alpaslan-exe/HD4_Fetch_AI_UAgent.git
cd HD4_Fetch_AI_UAgent
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Quick Start

### Running the Basic Agent

The simplest way to get started is with the basic agent template:

```bash
python agent.py
```

This will start an agent that:
- Logs startup events
- Runs periodic tasks every 10 seconds
- Handles incoming messages
- Logs shutdown events

### Agent Structure

```python
from uagents import Agent, Context, Model

# Define message models
class Message(Model):
    message: str

# Create agent
agent = Agent(
    name="my_agent",
    port=8000,
    seed="my_agent_seed_phrase",
    endpoint=["http://localhost:8000/submit"],
)

# Add handlers
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("Agent starting...")

# Run agent
if __name__ == "__main__":
    agent.run()
```

## Examples

### 1. Basic Agent (`agent.py`)

A simple agent with:
- Startup and shutdown handlers
- Periodic tasks
- Message handling

**Usage:**
```bash
python agent.py
```

### 2. Advanced Agent (`agent_advanced.py`)

Demonstrates advanced features:
- Multiple message types
- Protocols for organizing functionality
- Storage for persistent data
- Query handlers

**Usage:**
```bash
python agent_advanced.py
```

**Features:**
- Request/Response pattern
- Data storage and retrieval
- Protocol-based organization
- Query handling

### 3. Agent Communication (`agent_communication.py`)

Shows how agents communicate:
- Two agents (Alice and Bob)
- Message exchange
- Response handling

**Usage:**
```bash
python agent_communication.py
```

## Configuration

Edit `config.py` to customize your agent:

```python
AGENT_NAME = "my_agent"
AGENT_PORT = 8000
AGENT_SEED = "my_agent_seed_phrase"
NETWORK = "local"  # or "testnet", "mainnet"
```

## Agent Handlers

### Event Handlers

```python
@agent.on_event("startup")
async def startup(ctx: Context):
    # Runs when agent starts
    pass

@agent.on_event("shutdown")
async def shutdown(ctx: Context):
    # Runs when agent stops
    pass
```

### Message Handlers

```python
@agent.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    # Process incoming messages
    ctx.logger.info(f"From {sender}: {msg.message}")
```

### Interval Handlers

```python
@agent.on_interval(period=10.0)
async def periodic_task(ctx: Context):
    # Runs every 10 seconds
    pass
```

### Query Handlers

```python
@agent.on_query(model=Request)
async def handle_query(ctx: Context, sender: str, msg: Request):
    # Handle query and return response
    return Response(result="data")
```

## Agent Storage

Agents can store persistent data:

```python
# Store data
ctx.storage.set("key", "value")

# Retrieve data
value = ctx.storage.get("key")

# Check if key exists
if ctx.storage.has("key"):
    # Key exists
    pass
```

## Protocols

Organize agent functionality using protocols:

```python
from uagents import Protocol

# Create protocol
my_protocol = Protocol("MyProtocol")

@my_protocol.on_message(model=Message)
async def handle(ctx: Context, sender: str, msg: Message):
    pass

# Include in agent
agent.include(my_protocol)
```

## Sending Messages

```python
# Send message to another agent
await ctx.send(recipient_address, Message(message="Hello!"))

# Broadcast to multiple agents
for address in agent_addresses:
    await ctx.send(address, Message(message="Broadcast"))
```

## Best Practices

1. **Use unique seeds**: Change the seed phrase in production
2. **Handle errors**: Add try-except blocks in handlers
3. **Log appropriately**: Use ctx.logger for debugging
4. **Test locally**: Test on local network before deploying
5. **Secure endpoints**: Use HTTPS in production
6. **Version messages**: Include version info in message models
7. **Rate limiting**: Implement rate limits for periodic tasks
8. **Resource cleanup**: Clean up resources in shutdown handler

## Development

### Project Structure

```
HD4_Fetch_AI_UAgent/
├── agent.py                    # Basic agent template
├── agent_advanced.py           # Advanced features
├── agent_communication.py      # Agent communication example
├── config.py                   # Configuration file
├── requirements.txt            # Python dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

### Adding New Features

1. Create message models
2. Add handlers (on_message, on_interval, etc.)
3. Test locally
4. Deploy

## Troubleshooting

### Common Issues

**Issue: Agent won't start**
- Check if port is already in use
- Verify dependencies are installed
- Check Python version (3.8+)

**Issue: Messages not received**
- Verify agent addresses are correct
- Check network connectivity
- Ensure agents are running

**Issue: Import errors**
- Reinstall dependencies: `pip install -r requirements.txt`
- Check virtual environment is activated

## Resources

- [Fetch.AI Documentation](https://docs.fetch.ai/)
- [UAgents Framework](https://github.com/fetchai/uAgents)
- [Agentverse Platform](https://agentverse.ai/)
- [Developer Community](https://discord.gg/fetchai)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions and support:
- Open an issue on GitHub
- Join the Fetch.AI Discord community
- Check the official documentation

---

**Happy Agent Building! 🤖**
