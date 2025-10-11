"""
Fetch.AI UAgent Template
This is a basic template for creating a Fetch.AI UAgent
"""

from uagents import Agent, Context, Model


# Define message models
class Message(Model):
    """
    Example message model for agent communication
    """
    message: str


# Create agent with a name and optional parameters
agent = Agent(
    name="my_agent",
    port=8000,
    seed="my_agent_seed_phrase",  # Optional: for consistent agent address
    endpoint=["http://localhost:8000/submit"],  # Optional: agent endpoint
)


@agent.on_event("startup")
async def startup(ctx: Context):
    """
    Event handler that runs when the agent starts up
    """
    ctx.logger.info(f"Agent {ctx.name} is starting up")
    ctx.logger.info(f"Agent address: {ctx.address}")


@agent.on_interval(period=10.0)
async def periodic_task(ctx: Context):
    """
    Periodic task that runs every 10 seconds
    """
    ctx.logger.info(f"Periodic task running for agent: {ctx.name}")


@agent.on_message(model=Message)
async def handle_message(ctx: Context, sender: str, msg: Message):
    """
    Message handler that processes incoming messages
    """
    ctx.logger.info(f"Received message from {sender}: {msg.message}")
    
    # Send a response back
    await ctx.send(sender, Message(message=f"Response to: {msg.message}"))


@agent.on_event("shutdown")
async def shutdown(ctx: Context):
    """
    Event handler that runs when the agent shuts down
    """
    ctx.logger.info(f"Agent {ctx.name} is shutting down")


if __name__ == "__main__":
    # Run the agent
    agent.run()
