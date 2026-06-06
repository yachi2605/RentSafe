from fastapi import APIRouter
from models.schemas import RightsQuestionRequest, RightsAnswerResponse
from services.claude_service import answer_tenant_rights
from services.rag_service import get_context

router = APIRouter()


@router.post("/ask", response_model=RightsAnswerResponse)
async def ask_rights(body: RightsQuestionRequest):
    context = get_context(body.question, body.state)
    answer = answer_tenant_rights(body.question, body.state, context)
    sources = []
    if context:
        sources = ["Tenant law documents"]
    return RightsAnswerResponse(answer=answer, sources=sources)
