import time
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()


class FeGenerationRequest(BaseModel):
    uploadedUrl: str
    quizCount: int
    type: str


class SelectionResponse(BaseModel):
    content: str
    correct: bool


class QuizResponse(BaseModel):
    number: int
    title: str
    selections: List[SelectionResponse]
    explanation: str


class AiGenerationResponse(BaseModel):
    title: str
    quiz: List[QuizResponse]


@app.post("/generation", response_model=AiGenerationResponse)
def generate_quiz(request_body: FeGenerationRequest):
    # time.sleep(20)
    print("Request JSON:")
    print(request_body.model_dump_json(indent=2))

    return {
        "title": "EXAMPLE QUIZ 1",
        "quiz": [
            {
                "number": 1,
                "title": "WHICH NUMBER IS THE LARGEST?",
                "selections": [
                    {"content": "1", "correct": False},
                    {"content": "10", "correct": False},
                    {"content": "100", "correct": True},
                    {"content": "50", "correct": False},
                ],
                "explanation": "100 IS THE LARGEST.",
            },
            {
                "number": 2,
                "title": "WHICH OF THE FOLLOWING IS A WARM COLOR?",
                "selections": [
                    {"content": "RED", "correct": True},
                    {"content": "BLUE", "correct": False},
                    {"content": "BLACK", "correct": False},
                    {"content": "GRAY", "correct": False},
                ],
                "explanation": "RED IS A WARM COLOR.",
            },
            {
                "number": 3,
                "title": "WHICH OF THE FOLLOWING IS AN ANIMAL?",
                "selections": [
                    {"content": "APPLE", "correct": False},
                    {"content": "BOOK", "correct": False},
                    {"content": "ROCK", "correct": False},
                    {"content": "CAT", "correct": True},
                ],
                "explanation": "A CAT IS AN ANIMAL.",
            },
            {
                "number": 4,
                "title": "WHAT IS 2 + 2?",
                "selections": [
                    {"content": "3", "correct": False},
                    {"content": "4", "correct": True},
                    {"content": "5", "correct": False},
                    {"content": "6", "correct": False},
                ],
                "explanation": "2 + 2 = 4.",
            },
        ],
    }
