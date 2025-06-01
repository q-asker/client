import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MakeQuiz from "./pages/MakeQuiz";
import SolveQuiz from "./pages/SolveQuiz";
import QuizResult from "./pages/QuizResult";
import QuizExplanation from "./pages/QuizExplanation";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MakeQuiz />} />
        <Route path="/quiz/:problemSetId" element={<SolveQuiz />} />
        <Route path="/result/:problemSetId" element={<QuizResult />} />
        <Route
          path="/explanation/:problemSetId"
          element={<QuizExplanation />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
