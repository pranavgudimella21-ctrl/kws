from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from database import get_db
from services.llm_service import evaluate_answer, generate_reference_answer
from services.export_service import generate_pdf_report
import json
import time

router = APIRouter()

@router.post("/analyze/{session_id}")
async def analyze_session(session_id: str):
    max_db_retries = 3
    retry_count = 0

    while retry_count < max_db_retries:
        try:
            with get_db() as db:
                session = db.interview_sessions.find_one({"id": session_id})

                if not session:
                    raise HTTPException(status_code=404, detail="Session not found")

                session.pop("_id", None)

                if not session.get("questions"):
                    db.interview_sessions.update_one(
                        {"id": session_id},
                        {"$set": {"status": "analyzed"}}
                    )
                    return {"status": "success", "message": "Analysis complete"}

                jd_text = (
                    session.get("job_description")
                    or session.get("jd")
                    or session.get("jd_text")
                    or ""
                )
                resume_text = (
                    session.get("resume_text")
                    or session.get("resume")
                    or session.get("resume_content")
                    or ""
                )
                # Get interview type from session, default to "technical" for backward compatibility
                interview_type = session.get("interview_type", "technical")

                answers = list(db.interview_answers.find({"session_id": session_id}))

                for answer in answers:
                    answer.pop("_id", None)

                reference_cache = {}
                q_text_by_id = {q["id"]: q.get("text", "") for q in session["questions"]}

                for answer in answers:
                    if answer.get("score") is not None or not answer.get("transcript"):
                        continue

                    qid = answer.get("question_id")
                    question_text = q_text_by_id.get(qid, "")

                    if not question_text:
                        continue

                    try:
                        if qid not in reference_cache:
                            reference_cache[qid] = generate_reference_answer(
                                question=question_text,
                                jd=jd_text,
                                resume=resume_text,
                                interview_type=interview_type
                            )
                        reference_answer = reference_cache[qid]
                    except Exception as ref_err:
                        print(f"Error generating reference for question {qid}: {ref_err}")
                        continue

                    try:
                        evaluation = evaluate_answer(
                            question=question_text,
                            transcript=answer["transcript"],
                            reference_answer=reference_answer,
                            interview_type=interview_type
                        )

                        if not isinstance(evaluation, dict):
                            raise ValueError(f"Invalid evaluation response: {evaluation}")

                        score = evaluation.get("total_score")
                        if score is None:
                            score = evaluation.get("score")

                        feedback = evaluation.get("feedback", [])
                        if not isinstance(feedback, list):
                            feedback = [feedback] if feedback else []

                        model_answer = reference_answer or evaluation.get("model_answer", "")

                        db.interview_answers.update_one(
                            {"id": answer["id"]},
                            {"$set": {
                                "score": score,
                                "feedback": feedback,
                                "model_answer": model_answer
                            }}
                        )

                    except Exception as eval_error:
                        print(f"Error evaluating answer {answer.get('id')}: {str(eval_error)}")
                        continue

                db.interview_sessions.update_one(
                    {"id": session_id},
                    {"$set": {"status": "analyzed"}}
                )

            return {"status": "success", "message": "Analysis complete"}

        except Exception as db_error:
            retry_count += 1
            if retry_count >= max_db_retries:
                if isinstance(db_error, HTTPException):
                    raise db_error
                raise HTTPException(
                    status_code=500,
                    detail=f"Database error during analysis after {max_db_retries} retries: {str(db_error)}"
                )
            time.sleep(0.2 * retry_count)

    raise HTTPException(status_code=500, detail="Analysis failed after retries")

@router.get("/export-pdf/{session_id}")
async def export_pdf(session_id: str):
    try:
        with get_db() as db:
            session = db.interview_sessions.find_one({"id": session_id})

            if not session:
                raise HTTPException(status_code=404, detail="Session not found")

            session.pop("_id", None)

            answers = list(db.interview_answers.find({"session_id": session_id}))

            for answer in answers:
                answer.pop("_id", None)

        pdf_bytes = generate_pdf_report(session, answers)

        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=interview_results_{session_id[:8]}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
