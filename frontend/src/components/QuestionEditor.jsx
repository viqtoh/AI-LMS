import React from "react";
import { FaCheck, FaTimes, FaGripVertical } from "react-icons/fa";

function QuestionEditor({ index, data, onChange, onDelete, onOptDelete }) {
  const handleQuestionChange = (e) => {
    onChange({ ...data, question: e.target.value });
  };

  const handleAnswerChange = (answerId, text) => {
    const updatedAnswers = data.answers.map((a) => (a.id === answerId ? { ...a, text } : a));
    onChange({ ...data, answers: updatedAnswers });
  };

  const toggleCorrect = (answerId) => {
    const updatedAnswers = data.answers.map((a) =>
      a.id === answerId ? { ...a, correct: !a.correct } : a
    );
    onChange({ ...data, answers: updatedAnswers });
  };

  const addAnswer = () => {
    const newId = Math.max(0, ...data.answers.map((a) => a.id)) + 1;
    const newAnswer = {
      qid: newId,
      text: "",
      correct: false
    };
    onChange({ ...data, answers: [...data.answers, newAnswer] });
  };

  const deleteAnswer = (answerId) => {
    onOptDelete(answerId, data.id);
  };

  return (
    <div className="examcard p-4 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Question {index}</h5>
        <button className="btn-close" onClick={() => onDelete(data.id)} />
      </div>

      <textarea
        className="form-control mb-4"
        placeholder="The highest peak in Poland is:"
        value={data.question}
        onChange={handleQuestionChange}
        rows="3"
      />

      {data.answers.map(
        (answer, index) =>
          !answer.delete && (
            <div key={answer.id} className="d-flex align-items-center mb-2">
              <div className="me-2 text-muted">
                <FaGripVertical />
              </div>
              <div className="me-2 fw-bold">{String.fromCharCode(65 + index)}</div>
              <input
                type="text"
                className="form-control me-2"
                value={answer.text}
                onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
              />
              <button
                className={`btn btn-sm me-1 ${answer.correct ? "btn-success" : "btn-outline-success"}`}
                onClick={() => toggleCorrect(answer.id)}
              >
                <FaCheck />
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => deleteAnswer(answer.id)}
              >
                <FaTimes />
              </button>
            </div>
          )
      )}
      <div className="w-100 d-flex justify-content-center mt-5">
        <button className="addOptionBtn" onClick={addAnswer}>
          More Options +
        </button>
      </div>
    </div>
  );
}

export default QuestionEditor;
