# Quick Reference Guide

A quick reference for common Fetch.AI UAgent patterns and commands.

## Agent Creation

```python
from uagents import Agent

# Basic agent
agent = Agent(name="my_agent")

# With all options
agent = Agent(
    name="my_agent",
    port=8000,
    seed="unique_seed_phrase",
    endpoint=["http://localhost:8000/submit"],
)
```

## Message Models

```python
from uagents import Model

class SimpleMessage(Model):
    text: str

class ComplexMessage(Model):
    id: str
    value: int
    data: dict
    tags: list[str]
```

## Event Handlers

```python
# Startup
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("Agent started")

# Shutdown
@agent.on_event("shutdown")
async def shutdown(ctx: Context):
    ctx.logger.info("Agent stopped")
```

## Message Handlers

```python
# Receive message
@agent.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    ctx.logger.info(f"From {sender}: {msg.text}")
    await ctx.send(sender, Response(text="Got it!"))

# Query handler (returns response)
@agent.on_query(model=Request)
async def handle_query(ctx: Context, sender: str, msg: Request):
    return Response(result="data")
```

## Periodic Tasks

```python
# Every 10 seconds
@agent.on_interval(period=10.0)
async def periodic(ctx: Context):
    ctx.logger.info("Running periodic task")

# Every minute
@agent.on_interval(period=60.0)
async def every_minute(ctx: Context):
    # Your code here
    pass
```

## Sending Messages

```python
# Send to specific agent
await ctx.send(agent_address, Message(text="Hello"))

# Send to multiple agents
for addr in agent_addresses:
    await ctx.send(addr, Message(text="Broadcast"))
```

## Storage Operations

```python
# Set value
ctx.storage.set("key", "value")
ctx.storage.set("count", 42)
ctx.storage.set("data", {"item": "value"})

# Get value
value = ctx.storage.get("key")
count = ctx.storage.get("count", default=0)  # With default

# Check existence
if ctx.storage.has("key"):
    # Key exists
    pass

# Remove
ctx.storage.remove("key")
```

## Logging

```python
ctx.logger.debug("Debug message")
ctx.logger.info("Info message")
ctx.logger.warning("Warning message")
ctx.logger.error("Error message")
ctx.logger.critical("Critical message")
```

## Protocols

```python
from uagents import Protocol

# Create protocol
my_protocol = Protocol("MyProtocol")

# Add handlers to protocol
@my_protocol.on_message(model=Message)
async def handle(ctx: Context, sender: str, msg: Message):
    pass

# Include in agent
agent.include(my_protocol)

# Multiple protocols
agent.include(protocol1)
agent.include(protocol2)
```

## Context Properties

```python
ctx.name          # Agent name
ctx.address       # Agent address
ctx.storage       # Storage interface
ctx.logger        # Logger instance
```

## Running Agents

```python
# Single agent
agent.run()

# Multiple agents (async)
import asyncio

async def run_multiple():
    task1 = asyncio.create_task(agent1.run_async())
    task2 = asyncio.create_task(agent2.run_async())
    await asyncio.gather(task1, task2)

asyncio.run(run_multiple())
```

## Common Patterns

### Request-Response

```python
class Request(Model):
    query: str

class Response(Model):
    result: str

@agent.on_message(model=Request)
async def handle_request(ctx: Context, sender: str, msg: Request):
    result = process(msg.query)
    await ctx.send(sender, Response(result=result))
```

### State Machine

```python
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.storage.set("state", "idle")

@agent.on_message(model=Command)
async def handle_command(ctx: Context, sender: str, msg: Command):
    state = ctx.storage.get("state")
    
    if state == "idle" and msg.command == "start":
        ctx.storage.set("state", "running")
    elif state == "running" and msg.command == "stop":
        ctx.storage.set("state", "idle")
```

### Data Collection

```python
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.storage.set("data", [])

@agent.on_message(model=DataPoint)
async def collect(ctx: Context, sender: str, msg: DataPoint):
    data = ctx.storage.get("data", [])
    data.append(msg.value)
    ctx.storage.set("data", data)

@agent.on_interval(period=60.0)
async def process_data(ctx: Context):
    data = ctx.storage.get("data", [])
    if data:
        avg = sum(data) / len(data)
        ctx.logger.info(f"Average: {avg}")
        ctx.storage.set("data", [])  # Clear
```

### Error Handling

```python
@agent.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    try:
        result = process(msg)
        await ctx.send(sender, Success(result=result))
    except Exception as e:
        ctx.logger.error(f"Error: {e}")
        await ctx.send(sender, Error(message=str(e)))
```

## Configuration

```python
import os

# Environment variables
AGENT_NAME = os.getenv("AGENT_NAME", "default")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))
AGENT_SEED = os.getenv("AGENT_SEED", "seed")

# Use in agent
agent = Agent(
    name=AGENT_NAME,
    port=AGENT_PORT,
    seed=AGENT_SEED,
)
```

## CLI Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run agent
python agent.py

# Run in background (Linux/Mac)
nohup python agent.py > agent.log 2>&1 &

# Check running agents
ps aux | grep agent.py

# Kill agent
kill -9 <PID>

# View logs (if using systemd)
journalctl -u my-agent -f

# Docker
docker build -t my-agent .
docker run -d -p 8000:8000 my-agent
```

## Useful Code Snippets

### Timer

```python
import time

@agent.on_message(model=Request)
async def timed_handler(ctx: Context, sender: str, msg: Request):
    start = time.time()
    result = process(msg)
    duration = time.time() - start
    ctx.logger.info(f"Processed in {duration:.2f}s")
    await ctx.send(sender, Response(result=result))
```

### Rate Limiting

```python
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.storage.set("last_run", 0)

@agent.on_message(model=Message)
async def rate_limited(ctx: Context, sender: str, msg: Message):
    import time
    last_run = ctx.storage.get("last_run", 0)
    now = time.time()
    
    if now - last_run < 5:  # 5 second cooldown
        ctx.logger.warning("Rate limited")
        return
    
    ctx.storage.set("last_run", now)
    # Process message
```

### Batch Processing

```python
@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.storage.set("queue", [])

@agent.on_message(model=Task)
async def queue_task(ctx: Context, sender: str, msg: Task):
    queue = ctx.storage.get("queue", [])
    queue.append((sender, msg))
    ctx.storage.set("queue", queue)

@agent.on_interval(period=30.0)
async def process_batch(ctx: Context):
    queue = ctx.storage.get("queue", [])
    if not queue:
        return
    
    ctx.logger.info(f"Processing {len(queue)} tasks")
    for sender, msg in queue:
        result = process(msg)
        await ctx.send(sender, Result(data=result))
    
    ctx.storage.set("queue", [])
```

## Testing

```python
# Get agent address for testing
print(f"Agent address: {agent.address}")

# Send test message
test_message = Message(text="test")
# Use agent address in another agent to send messages
```

## Debugging

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Add debug handlers
@agent.on_message(model=Message)
async def debug_handler(ctx: Context, sender: str, msg: Message):
    ctx.logger.debug(f"Received: {msg}")
    ctx.logger.debug(f"From: {sender}")
    ctx.logger.debug(f"Storage: {ctx.storage.get('key')}")
```

## Common Issues

### Port in Use
```python
# Try different port
agent = Agent(name="my_agent", port=8001)
```

### Storage Not Persisting
```python
# Ensure you're using ctx.storage.set()
ctx.storage.set("key", value)  # ✓ Correct
my_dict["key"] = value          # ✗ Won't persist
```

### Messages Not Received
```python
# Verify addresses match
ctx.logger.info(f"My address: {ctx.address}")
ctx.logger.info(f"Sending to: {recipient_address}")
```

---

**Need more details?** Check the full README.md or GETTING_STARTED.md
