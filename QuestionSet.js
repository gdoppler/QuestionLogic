var reducedWeightOfAnsweredGroup=20; 
var reducedWeightOfAskedQuestion=50; 
var fullWeight=100; 

class Question{
    constructor(question, questionId, answerId){
        this.question=question; 
        this.questionId = questionId; // to identify one specific question 
        this.answerId=answerId; 
        this.wasAsked=false; 
        this.wasCorrectlyAnswered=false;
        this.questionGroup=null; // this might be an easy way to find the group of this question
    }
    simpleDisplay(){
        return this.question+ " ("+this.answerId+")"; 
    }
}

// all questions with the same answer are in one QuestionGroup
class QuestionGroup{
    constructor(answerId){
        this.answerId = answerId; // to find this specific QuestionGroup in the lists. 
        this.newQuestions=[]; 
        this.askedQuestions=[]; 
        this.correctlyAnsweredQuestions=[];
        this.numOfQuestions=0; 
    }

    hasReducedWeight(){
        return this.newQuestions.length !=this.numOfQuestions; 
    }
    hasZeroWeight(){
        return this.correctlyAnsweredQuestions.length == this.numOfQuestions; 
    }
    weight(){
        return this.newQuestions.length * fullWeight + this.askedQuestions.length * reducedWeightOfAskedQuestion; 
    }

    simpleDisplay(){
        return this.answerId+" "+this.numOfQuestions+" (new: "+
            this.newQuestions.length+"/ asked: "+
            this.askedQuestions.length+"/ correct: "+
            this.correctlyAnsweredQuestions.length+")"; 
    }

    addQuestion(question){
        question.questionGroup=this; 
        this.newQuestions.push(question); 
        this.numOfQuestions++; 
    }
    getNextQuestion(){
        // this QuestionGroup was selected to provide the next question. 
        // it should be impossible to call this if there are no more unanswered questions in this group. 
        if(this.hasZeroWeight()) throw new Error("this group has no more questions"); 
        var index=Math.floor(Math.random()*this.weight()); 
        var newQuestionIndex= Math.floor(index / Math.floor(fullWeight)); 
        // fullWeight shall always be an integer, but let's make sure

        if(newQuestionIndex<this.newQuestions.length){
            // we are within the boundary of new questions, so we can return it
            return this.newQuestions[newQuestionIndex]; 
        } 
        else{
            // we are over the boundary of new questions, so it must be one of the askedQuestions
            index-= this.newQuestions.length * Math.floor(fullWeight); 
            var askedQuestionIndex= Math.floor(index / Math.floor(reducedWeightOfAskedQuestion)); 
            return this.askedQuestions[askedQuestionIndex]; 
        }
    }

    // now update the lists in this QuestionGroup
    questionAnswered(question,wasCorrectlyAnswered){
        // for sure the question has to be removed from newQuestions
        this.newQuestions=this.newQuestions.filter(x=> x.questionId != question.questionId); 
        // let's remove it from askedQuestions as well, this should be fast
        this.askedQuestions=this.askedQuestions.filter(x=> x.questionId != question.questionId); 
        // but then it depends if the question was answered correctly where it arrives to 
        if(wasCorrectlyAnswered){
            this.correctlyAnsweredQuestions.push(question); 
        }
        else{
            this.askedQuestions.push(question); 
        }
        // 
    } 
}

// the QuestionSet contains all questions
class QuestionSet{
    constructor(questions){
        this.fullWeightQuestionGroups=[]; 
        this.reducedWeightQuestionGroups=[]; 
        this.zeroWeightQuestionGroups=[]; 
        
        // create a QuestionGroup per answerId 
        var groups=new Map(); 
        for(var x=0; x<questions.length; x++){
            var q=questions[x]; 
            if(!groups.has(q.answerId)){
                var qg=new QuestionGroup(q.answerId); 
                groups.set(q.answerId, qg);
                this.fullWeightQuestionGroups.push(qg); 
            }
            groups.get(q.answerId).addQuestion(q); 
        }

    }
    totalWeight(){
        return this.fullWeightQuestionGroups.length * fullWeight + 
               this.reducedWeightQuestionGroups.length * reducedWeightOfAnsweredGroup; 
    }
    getNextQuestion(){
        // 1. find the QuestionGroup very similar to how we found the question in the QuestionGroup
        var index=Math.floor(Math.random()*this.totalWeight()); 
        var fullWeightIndex=Math.floor(index / Math.floor(fullWeight)); 
        var questionGroupForNextQuestion=null; 
        if(fullWeightIndex<this.fullWeightQuestionGroups.length){
            questionGroupForNextQuestion = this.fullWeightQuestionGroups[fullWeightIndex]; 
        }
        else{
            index -= this.fullWeightQuestionGroups.length * Math.floor(fullWeight); 
            var reducedWeightIndex= Math.floor(index / Math.floor(reducedWeightOfAnsweredGroup)); 
            questionGroupForNextQuestion = this.reducedWeightQuestionGroups[reducedWeightIndex]; 
        }
        
        // 2. find the Question in the QuestionGroup
        return questionGroupForNextQuestion.getNextQuestion(); 

    }

    questionAnswered(question,wasCorrectlyAnswered){
        // if wasCorrectlyAnswered is false we just need to mark that this question was already asked. 
        question.wasAsked=true; 
        if(wasCorrectlyAnswered){
            question.wasCorrectlyAnswered=true;      

        }
        // now update the question's QuestionGroup
        question.questionGroup.questionAnswered(question,wasCorrectlyAnswered); 
        // finally manage the lists - where we just have to do something if the answer was correct
        if(wasCorrectlyAnswered){
            // definitely remove the QuestionGroup from the fullWeightQuestionGroups
            this.fullWeightQuestionGroups=this.fullWeightQuestionGroups.filter(
                x=>x.answerId != question.questionGroup.answerId
            ); 
            // and remove it from the reducedWeightQuestionGroups, too, to not add it twice
            this.reducedWeightQuestionGroups=this.reducedWeightQuestionGroups.filter(
                x=>x.answerId != question.questionGroup.answerId 
            )
            // now depending if the QuestionGroup still has some not correctly answered questions 
            // = if the QuestionGroup still has some weight
            // put it into the reducedWeightGroups 
            if(question.questionGroup.weight()>0){
                this.reducedWeightQuestionGroups.push(question.questionGroup); 
            }
            else{
                this.zeroWeightQuestionGroups.push(question.questionGroup); 
            }
        }
    }
    simpleDisplay(property){
        var p=this[property];
        var result=[];  
        for(var x=0; x<p.length; x++){
            result.push(p[x].simpleDisplay()); 
        }
        return result; 
    }
}

class QuestionSetTester{
    constructor(){
        var answers=['Alhadas','Quiaios','Maiorca']; 
        var questions=[]; 
        
        for(var x=0; x<answers.length; x++){
            // have between 3 and 5 questions for each answer
            var n=3+Math.floor(Math.random()*3); 
            for(var y=0; y<n; y++){
                var id=questions.length+1; 
                questions.push(new Question("question_"+id,id,answers[x]))
            }

        }
        this.questionset=new QuestionSet(questions); 
    }

}
/*
qt=new QuestionSetTester(); 
for(var x=0; x<3; x++){
    var q=qt.questionset.getNextQuestion(); 
    console.log(q); 
    var correct=Math.random()<0.2; 
    qt.questionset.questionAnswered(q,correct); 
}
*/
