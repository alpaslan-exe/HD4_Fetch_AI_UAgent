from uagents import Bureau
from agent_recommender.agent import agent

if __name__ == "__main__":
    bureau = Bureau(port=8000)
    bureau.add(agent)
    bureau.run()