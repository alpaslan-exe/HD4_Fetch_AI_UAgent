"""
Example Usage: How to use the agent template for your own project
"""

from uagents import Agent, Context, Model


# Step 1: Define your custom message models
class TaskRequest(Model):
    """Define what data your agent will receive"""
    task_id: str
    task_description: str
    priority: int


class TaskResult(Model):
    """Define what data your agent will send back"""
    task_id: str
    status: str
    result: str


# Step 2: Create your agent
my_custom_agent = Agent(
    name="task_processor",
    port=8010,
    seed="task_processor_unique_seed",  # Change this!
    endpoint=["http://localhost:8010/submit"],
)


# Step 3: Add startup logic
@my_custom_agent.on_event("startup")
async def initialize_agent(ctx: Context):
    """Initialize your agent with any setup needed"""
    ctx.logger.info("Task Processor Agent is starting...")
    
    # Initialize storage or load data
    ctx.storage.set("tasks_processed", 0)
    ctx.storage.set("tasks_pending", [])
    
    ctx.logger.info(f"Agent ready at address: {ctx.address}")


# Step 4: Add your business logic
@my_custom_agent.on_message(model=TaskRequest)
async def process_task(ctx: Context, sender: str, msg: TaskRequest):
    """Handle incoming task requests"""
    ctx.logger.info(f"Received task {msg.task_id} from {sender}")
    ctx.logger.info(f"Task: {msg.task_description} (Priority: {msg.priority})")
    
    # Your custom processing logic here
    # For example: process the task based on priority
    if msg.priority > 5:
        result = f"High priority task {msg.task_id} processed immediately"
        status = "completed"
    else:
        # Store for batch processing
        pending = ctx.storage.get("tasks_pending") or []
        pending.append(msg.task_id)
        ctx.storage.set("tasks_pending", pending)
        result = f"Task {msg.task_id} queued for processing"
        status = "queued"
    
    # Update counter
    count = ctx.storage.get("tasks_processed") or 0
    ctx.storage.set("tasks_processed", count + 1)
    
    # Send result back
    await ctx.send(
        sender,
        TaskResult(
            task_id=msg.task_id,
            status=status,
            result=result
        )
    )


# Step 5: Add periodic tasks (optional)
@my_custom_agent.on_interval(period=30.0)
async def batch_process_tasks(ctx: Context):
    """Process queued tasks every 30 seconds"""
    pending = ctx.storage.get("tasks_pending") or []
    
    if pending:
        ctx.logger.info(f"Processing {len(pending)} queued tasks...")
        # Process tasks
        ctx.storage.set("tasks_pending", [])
        ctx.logger.info("Batch processing completed")
    else:
        ctx.logger.info("No pending tasks to process")


# Step 6: Add cleanup logic (optional)
@my_custom_agent.on_event("shutdown")
async def cleanup(ctx: Context):
    """Clean up when agent stops"""
    total_processed = ctx.storage.get("tasks_processed") or 0
    ctx.logger.info(f"Agent shutting down. Total tasks processed: {total_processed}")


# Step 7: Run your agent
if __name__ == "__main__":
    print("=" * 60)
    print("Task Processor Agent Example")
    print("=" * 60)
    print(f"Agent Address: {my_custom_agent.address}")
    print(f"Agent Port: 8010")
    print("=" * 60)
    print("\nAgent is now running. Press Ctrl+C to stop.\n")
    
    my_custom_agent.run()
