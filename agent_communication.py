"""
Agent-to-Agent Communication Example
This example shows how two agents can communicate with each other
"""

from uagents import Agent, Context, Model
import asyncio


class Greeting(Model):
    """Greeting message"""
    text: str
    from_agent: str


class GreetingResponse(Model):
    """Response to greeting"""
    text: str
    from_agent: str


# Create first agent (Alice)
alice = Agent(
    name="alice",
    port=8002,
    seed="alice_seed_phrase",
    endpoint=["http://localhost:8002/submit"],
)


# Create second agent (Bob)
bob = Agent(
    name="bob",
    port=8003,
    seed="bob_seed_phrase",
    endpoint=["http://localhost:8003/submit"],
)


@alice.on_event("startup")
async def alice_startup(ctx: Context):
    """Alice's startup handler"""
    ctx.logger.info(f"Alice is starting up")
    ctx.logger.info(f"Alice's address: {ctx.address}")
    
    # Store Bob's address for communication
    ctx.storage.set("bob_address", bob.address)


@alice.on_interval(period=15.0)
async def alice_send_greeting(ctx: Context):
    """Alice sends a greeting to Bob periodically"""
    bob_address = ctx.storage.get("bob_address")
    if bob_address:
        ctx.logger.info("Alice is sending greeting to Bob")
        await ctx.send(
            bob_address,
            Greeting(text="Hello Bob!", from_agent="Alice")
        )


@alice.on_message(model=GreetingResponse)
async def alice_handle_response(ctx: Context, sender: str, msg: GreetingResponse):
    """Alice handles Bob's response"""
    ctx.logger.info(f"Alice received response from {msg.from_agent}: {msg.text}")


@bob.on_event("startup")
async def bob_startup(ctx: Context):
    """Bob's startup handler"""
    ctx.logger.info(f"Bob is starting up")
    ctx.logger.info(f"Bob's address: {ctx.address}")


@bob.on_message(model=Greeting)
async def bob_handle_greeting(ctx: Context, sender: str, msg: Greeting):
    """Bob handles Alice's greeting"""
    ctx.logger.info(f"Bob received greeting from {msg.from_agent}: {msg.text}")
    
    # Send response back
    await ctx.send(
        sender,
        GreetingResponse(text="Hello Alice! Nice to hear from you!", from_agent="Bob")
    )


async def run_agents():
    """Run both agents concurrently"""
    # Create tasks for both agents
    alice_task = asyncio.create_task(alice.run_async())
    bob_task = asyncio.create_task(bob.run_async())
    
    # Wait for both to complete
    await asyncio.gather(alice_task, bob_task)


if __name__ == "__main__":
    # Print agent addresses for reference
    print(f"Alice's address: {alice.address}")
    print(f"Bob's address: {bob.address}")
    
    # Run both agents
    asyncio.run(run_agents())
