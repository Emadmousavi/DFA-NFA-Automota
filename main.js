function main() {
  let states = document.getElementById("states").value.split(",").map(item => item.trim())
  let alphabets = document.getElementById("alphabets").value.split(",").map(item => item.trim())
  let finalStates = document.getElementById("finalStates").value.split(",").map(item => item.trim())
  let numberOfTransitions = document.getElementById("numberOfTransitions").value
  let transitions = document.getElementById("transitions").value.split("\n")
  let string = document.getElementById("string").value

  let nfa = new NFA(states, alphabets, finalStates, transitions, numberOfTransitions)
  nfa.createEquivalentDFA(false)
  let dfa = new DFA(nfa.statesDFA, alphabets, nfa.finalStatesDFA, nfa.transitionsDFA, nfa.transitionsDFA.length)
  if (document.getElementById("isAcceptedByDFA").checked) {
    alert(dfa.isAcceptedByDFA(string))
  }
  else if (document.getElementById("makeSimpleDFA").checked) {
    dfa.makeSimpleDFA();
  }
  else if (document.getElementById("showSchematicDFA").checked) {
    dfa.showSchematicDFA(dfa.transitions, dfa.initialState, dfa.finalStates, "graphContainer")
  }
  else if (document.getElementById("isAcceptedByNFA").checked) {
    alert(nfa.isAcceptByNFA(string))
  }
  else if (document.getElementById("createEquivalentDFA").checked) {
    nfa.createEquivalentDFA(true)
  }
  else if (document.getElementById("findRegExp").checked) {
    alert(nfa.findRegExp())
  }
  else if (document.getElementById("showSchematicNFA").checked) {
    nfa.showSchematicNFA(transitions, states[0], finalStates, "graphContainer")
  }
}

