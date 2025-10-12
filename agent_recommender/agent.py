from uagents import Agent, Context, Protocol
from agent_recommender.agent_lite import RecommendRequestMsg, RecommendResponseMsg
from agent_recommender.scoring import base_score, naive_keyword_match, blend_score
from agent_recommender.config import MAX_EVALS

agent = Agent(name="instructor_recommender", seed="prof-reco-seed-dev")
protocol = Protocol(name="professor_recommender_protocol")


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Agent is running at address: {agent.address}")


@protocol.on_message(model=RecommendRequestMsg,
                     replies=RecommendResponseMsg,
                     allow_unverified=True)
async def handle_request(ctx: Context, sender: str, msg: RecommendRequestMsg):
    try:
        ctx.logger.info(f"Received recommendation request from {sender}")

        recommendations = []
        pref_tags = msg.preference_tags or []

        for course in msg.courses:
            instrs = course.instructors or []
            scored = []

            for inst in instrs:
                try:
                    # Extract raw values
                    rating_raw = inst.get("score_overall", 0.0)
                    ta_raw = inst.get("would_take_again_pct", 0.0)
                    diff_raw = inst.get("difficulty", 3.0)
                    reviews_raw = inst.get("recent_evals", []) or []

                    # Calculate scores
                    b = base_score(rating_raw, ta_raw, diff_raw)
                    m = naive_keyword_match(pref_tags, [str(r) for r in reviews_raw][:MAX_EVALS])
                    s = blend_score(b, m)

                    scored.append((s, inst))

                except Exception as ee:
                    # If anything fails, provide detailed error info
                    error_msg = (
                        f"Agent error while scoring: {type(ee).__name__}: {ee} "
                        f"(rating={repr(rating_raw)}[{type(rating_raw).__name__}], "
                        f"take_again={repr(ta_raw)}[{type(ta_raw).__name__}], "
                        f"difficulty={repr(diff_raw)}[{type(diff_raw).__name__}])"
                    )
                    ctx.logger.error(error_msg)
                    recommendations.append(error_msg)

            if scored:
                # Sort by score (highest first)
                scored.sort(key=lambda t: t[0], reverse=True)
                top_inst = scored[0][1]
                name = str(top_inst.get("name", "Unknown"))
                score_str = top_inst.get("score_overall", "n/a")
                recommendations.append(f"For {course.course}: take {name} (score {score_str})")
            elif not recommendations or not recommendations[-1].startswith("Agent error while scoring:"):
                recommendations.append(f"No instructors found for {course.course}.")

        await ctx.send(sender, RecommendResponseMsg(recommendations=recommendations))

    except Exception as e:
        error_msg = f"Agent outer error: {type(e).__name__}: {e}"
        ctx.logger.error(error_msg)
        await ctx.send(sender, RecommendResponseMsg(recommendations=[error_msg]))


agent.include(protocol)

if __name__ == "__main__":
    agent.run()