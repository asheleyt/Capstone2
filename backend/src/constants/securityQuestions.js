// Predefined security questions for admin password recovery
// These questions and answers can only be changed by editing this file directly

const SECURITY_QUESTIONS = {
  q1: "What is my birthday?",
  q2: "Birthplace?",
  q3: "My first job?"
};

const SECURITY_ANSWERS = {
  a1: "july 2 2004",
  a2: "pasig", 
  a3: "waiter"
};

// Hash the predefined answers for storage
const bcrypt = require('bcrypt');

async function getHashedAnswers() {
  return {
    a1: await bcrypt.hash(SECURITY_ANSWERS.a1.toLowerCase().trim(), 10),
    a2: await bcrypt.hash(SECURITY_ANSWERS.a2.toLowerCase().trim(), 10),
    a3: await bcrypt.hash(SECURITY_ANSWERS.a3.toLowerCase().trim(), 10)
  };
}

function getQuestions() {
  return SECURITY_QUESTIONS;
}

function getAnswers() {
  return SECURITY_ANSWERS;
}

module.exports = {
  SECURITY_QUESTIONS,
  SECURITY_ANSWERS,
  getHashedAnswers,
  getQuestions,
  getAnswers
};

