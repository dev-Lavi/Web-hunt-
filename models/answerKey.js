import mongoose from 'mongoose';

const answerKeySchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true,     
    unique: true,       
  },
  correctAnswer: {
    type: String,
    required: false,     
  }
});

const AnswerKey = mongoose.model('AnswerKey', answerKeySchema);
export default AnswerKey;
