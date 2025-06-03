import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";
import MakeQuiz from "./pages/MakeQuiz";
import QuizExplanation from "./pages/QuizExplanation";
import QuizResult from "./pages/QuizResult";
import SolveQuiz from "./pages/SolveQuiz";

const App = () => {
  return (
    <BrowserRouter>
      <ToastContainer />
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
