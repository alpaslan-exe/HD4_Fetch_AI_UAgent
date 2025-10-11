"""
Advanced Fetch.AI UAgent Template
This template demonstrates more advanced features like:
- Multiple message types
- Agent protocols
- Storage
- Query handlers
"""

from uagents import Agent, Context, Model, Protocol
from uagents.setup import fund_agent_if_low


# Define multiple message models
class Request(Model):
    """Request message model"""
    query: str


class Response(Model):
    """Response message model"""
    result: str
    status: str


class DataUpdate(Model):
    """Data update message model"""
    key: str
    value: str


# Create agent
agent = Agent(
    name="advanced_agent",
    port=8001,
    seed="advanced_agent_seed",
    endpoint=["http://localhost:8001/submit"],
)

# Fund agent if low on tokens (for testnet/mainnet)
# fund_agent_if_low(agent.wallet.address())


# Create a protocol for specific functionality
data_protocol = Protocol("DataProtocol")


@data_protocol.on_message(model=Request)
async def handle_request(ctx: Context, sender: str, msg: Request):
    """Handle data request"""
    ctx.logger.info(f"Received request from {sender}: {msg.query}")
    
    # Process the request
    result = f"Processed: {msg.query}"
    
    # Send response
    await ctx.send(
        sender,
        Response(result=result, status="success")
    )


@data_protocol.on_message(model=DataUpdate)
async def handle_data_update(ctx: Context, sender: str, msg: DataUpdate):
    """Handle data update and store in agent storage"""
    ctx.logger.info(f"Updating data: {msg.key} = {msg.value}")
    
    # Store data in agent's storage
    ctx.storage.set(msg.key, msg.value)
    
    # Confirm update
    await ctx.send(
        sender,
        Response(result=f"Updated {msg.key}", status="success")
    )


# Include protocol in agent
agent.include(data_protocol)


@agent.on_event("startup")
async def startup(ctx: Context):
    """Startup event handler"""
    ctx.logger.info(f"Advanced agent {ctx.name} starting up")
    ctx.logger.info(f"Agent address: {ctx.address}")
    
    # Initialize storage if needed
    if ctx.storage.get("initialized") is None:
        ctx.storage.set("initialized", "true")
        ctx.logger.info("Storage initialized")


@agent.on_query(model=Request)
async def handle_query(ctx: Context, sender: str, msg: Request):
    """Handle query requests"""
    ctx.logger.info(f"Query from {sender}: {msg.query}")
    
    # Check if we have data in storage
    stored_value = ctx.storage.get(msg.query)
    
    if stored_value:
        return Response(result=stored_value, status="found")
    else:
        return Response(result="Not found", status="not_found")


@agent.on_interval(period=30.0)
async def periodic_cleanup(ctx: Context):
    """Periodic cleanup task"""
    ctx.logger.info("Running periodic cleanup")
    # Implement cleanup logic here


if __name__ == "__main__":
    agent.run()
