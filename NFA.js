class NFA {

  constructor(states, alphabets, finalStates, transitions, numberOfTransitions) {
    this.states = states
    this.initialState = this.states[0]
    this.alphabets = alphabets
    this.finalStates = finalStates
    if (finalStates.length == 1 && finalStates[0] == "") {
      this.finalStates = []
    }
    this.numberOfTransitions = numberOfTransitions
    this.transitions = transitions
    this.createGraph()
  }

  createGraph() {
    this.graph = {}
    this.states.forEach(state => {
      this.graph[state] = { isFinal: false, adjs: [] }
    })
    this.finalStates.forEach(finalState => {
      this.graph[finalState].isFinal = true
    })
    for (let i = 0; i < this.numberOfTransitions; i++) {
      const element = this.transitions[i].split(",").map(item => item.trim());
      let from = element[0]
      let to = element[1]
      let label = element[2]
      if (label == "") {
        label = "lambda"
      }
      this.graph[from].adjs.push([to, label])
    }
  }

  isAccept(inputString, currentState, charPos) {
    if (charPos == inputString.length) {
      if (this.graph[currentState].isFinal) {
        return true
      } else {
        return false
      }
    }
    let acceptFlag = false
    let nextStates = []
    let char = inputString[charPos]
    this.graph[currentState].adjs.forEach(element => {
      if (element[1] == char || element[1] == "lambda") {
        nextStates.push(element)
      }
    });
    if (nextStates.length == 0) {
      return false
    }
    nextStates.forEach(element => {
      if (element[1] == "lambda") {
        acceptFlag = acceptFlag || this.isAccept(inputString, element[0], charPos)
      } else {
        acceptFlag = acceptFlag || this.isAccept(inputString, element[0], charPos + 1)
      }
    });
    return acceptFlag
  }

  isAcceptByNFA(inputString) {
    if (inputString == "lambda") {
      return this.graph[this.initialState].isFinal
    }
    return this.isAccept(inputString, this.initialState, 0)
  }

  deltaStar(currentState, char) {
    if (currentState == "") {
      return [""]
    }
    let nextStates = []
    let nextLambdaStates = []
    this.graph[currentState].adjs.forEach(element => {
      if (element[1] == char) {
        nextStates.push(element[0])
      }
      if (element[1] == "lambda") {
        nextLambdaStates.push(element[0])
      }
    })
    nextStates = new Set(nextStates)
    nextLambdaStates.forEach(nextLambdaState => {
      nextStates = new Set([...nextStates].concat(this.deltaStar(nextLambdaState, char)))
    })
    nextStates.forEach(nextState => {
      nextStates = new Set([...nextStates].concat(this.deltaStar(nextState, "lambda")))
    })
    return [...nextStates]
  }

  createEquivalentDFA(print_bool) {
    this.graphDFA = {}
    this.initialStateDFA = this.initialState
    let queue = []
    this.statesDFA = new Set()
    queue.push(this.initialStateDFA)
    while (queue.length != 0) {
      let currentStates = queue.pop()
      this.statesDFA.add(currentStates)
      this.graphDFA[currentStates] = { "isFinal": false, "adjs": [] }
      currentStates = currentStates.split(" ")
      this.alphabets.forEach(alphabet => {
        let nextStates = []
        currentStates.forEach(currentState => {
          let reachableStates = this.deltaStar(currentState, alphabet)
          reachableStates.forEach(reachableState => {
            if (!nextStates.includes(reachableState)) {
              nextStates.push(reachableState)
            }
          })
        })
        nextStates = nextStates.sort().join(" ")
        this.graphDFA[currentStates.join(" ")].adjs.push([nextStates, alphabet])
        if (!(nextStates in this.graphDFA)) {
          queue.push(nextStates)
        }
      })
    }
    this.transitionsDFA = []
    for (const [key, value] of Object.entries(this.graphDFA)) {
      this.graphDFA[key].adjs.forEach(element => {
        this.transitionsDFA.push(`${key}, ${element[0]}, ${element[1]}`)
      })
    }
    this.finalStatesDFA = new Set()
    this.finalStates.forEach(finalState => {
      for (const [key, value] of Object.entries(this.graphDFA)) {
        if (key.split(" ").includes(finalState)) {
          this.graphDFA[key].isFinal = true
          this.finalStatesDFA.add(key)
        }
      }
    })
    this.finalStatesDFA = [...this.finalStatesDFA]
    this.statesDFA = [...this.statesDFA]
    if (print_bool) {
      console.log("The Equivalent DFA Transitions: ", this.transitionsDFA)
      console.log("The Equivalent DFA Initial State: ", this.initialStateDFA)
      console.log("The Equivalent DFA Final States: ", this.finalStatesDFA)
      console.log("The Equivalent DFA States: ", this.statesDFA)
      this.showSchematicNFA(this.transitionsDFA, this.initialStateDFA, this.finalStatesDFA, "graphContainer")
    }
  }

  buildDotData(transitions, initialState, finalStates) {
    let newTransitionsDictionary = {}
    transitions.forEach(element => {
      element = element.split(",").map(item => item.trim())
      let from = element[0]
      if (from == "") {
        from = "trap"
      }
      let to = element[1]
      if (to == "") {
        to = "trap"
      }
      let label = element[2]
      if (label == "") {
        label = "lambda"
      }
      if (!(from in newTransitionsDictionary)) {
        newTransitionsDictionary[from] = {}
      }
      if (to in newTransitionsDictionary[from]) {
        newTransitionsDictionary[from][to] += `,${label}`
      } else {
        newTransitionsDictionary[from][to] = label
      }
    })
    let newTransitions = []
    Object.entries(newTransitionsDictionary).forEach(([from, v]) => {
      Object.entries(v).forEach(([to, label]) => {
        newTransitions.push(`${from} % ${to} % ${label}`)
      })
    })

    let res = `digraph {
      node [shape=circle fontsize=25]
      edge [length=200, color=gray, fontcolor=black]`
    res += `
      hidden -> "${initialState}"[label=""]`
    newTransitions.forEach(element => {
      element = element.split("%").map(item => item.trim())
      let from = element[0]
      if (from == "") {
        from = "trap"
      }
      let to = element[1]
      if (to == "") {
        to = "trap"
      }
      let label = element[2]
      if (label == "") {
        label = "lambda"
      }
      res += `
        "${from}" -> "${to}"[label="${label}"]`
    });
    if (finalStates[0] != "") {
      finalStates.forEach(element => {
        res += `
          "${element}" [
            label="${element}",
            shape="doublecircle",
            color="#ff0000",
          ]`
      })
    }
    res += `
    hidden [
      shape="circle",
      color="#ffffff",
      opacity=0,
      font="1px solid white",
    ]`

    res += `
    }`
    return res
  }

  showSchematicNFA(transitions, initialState, finalStates, containerId) {
    let dotData = this.buildDotData(transitions, initialState, finalStates)
    let container = document.getElementById(containerId)
    let data = vis.parseDOTNetwork(dotData)
    let options = {
      nodes: {
        borderWidth: 2,
        size: 50,
        color: {
          border: "#000000",
          background: "#ffffff",
        },
        font: "1px arial black",
      },
    }
    let network = new vis.Network(container, data, options)
  }

  findRegExp() {
    //making gtg graph
    this.gtg = {}
    Object.entries(this.graph).forEach(([k, v]) => {
      this.gtg[k] = {}
      v["adjs"].forEach(element => {
        let to = element[0]
        let label = element[1]
        if (label == "lambda") {
          label = "~"
        }
        if (this.gtg[k][to] == undefined) {
          this.gtg[k][to] = label
        } else {
          this.gtg[k][to] += `+${label}`
        }
      })
    })
    this.gtg["start"] = {}
    this.gtg["start"][this.initialState] = "~"
    this.gtg["finish"] = {}
    this.finalStates.forEach(finalState => {
      this.gtg[finalState]["finish"] = "~"
    })
    this.states.forEach(state => {
      let inEdges = this.findInEdges(state)
      let outEdges = this.findOutEdges(state)
      inEdges.forEach(inEdge => {
        outEdges.forEach(outEdge => {
          if (this.gtg[inEdge][state] != undefined && this.gtg[inEdge][state].length > 1) {
            this.gtg[inEdge][state] = "(" + this.gtg[inEdge][state] + ")"
          }
          if (this.gtg[inEdge][outEdge]!= undefined && this.gtg[inEdge][outEdge].length > 1) {
            this.gtg[inEdge][outEdge] = "(" + this.gtg[inEdge][outEdge] + ")"
          }
          if (this.gtg[state][outEdge] != undefined && this.gtg[state][outEdge].length > 1) {
            this.gtg[state][outEdge] = "(" + this.gtg[state][outEdge] + ")"
          }
          if (this.gtg[state][state] != undefined && this.gtg[state][state].length > 1) {
            this.gtg[state][state] = "(" + this.gtg[state][state] + ")"
          }
          if (this.gtg[state][state] == undefined) {
            if (this.gtg[inEdge][outEdge] == undefined) {
              this.gtg[inEdge][outEdge] = `${this.gtg[inEdge][state]}${this.gtg[state][outEdge]}`
            } else {
              this.gtg[inEdge][outEdge] =`${this.gtg[inEdge][outEdge]}+${this.gtg[inEdge][state]}${this.gtg[state][outEdge]}`
            }
          } else {
            if (this.gtg[inEdge][outEdge] == undefined) {
              this.gtg[inEdge][outEdge] = `${this.gtg[inEdge][state]}${this.gtg[state][state]}*${this.gtg[state][outEdge]}`
            } else {
              this.gtg[inEdge][outEdge] = `${this.gtg[inEdge][outEdge]}+${this.gtg[inEdge][state]}${this.gtg[state][state]}*${this.gtg[state][outEdge]}`
            }
          }
        })
      })
      this.deleteState(state)
    })
    if (this.gtg["start"]["finish"] == undefined) {
      return "Nothing is accepted!"
    }
    let flag = true
    let res = this.gtg["start"]["finish"].replaceAll("~","")
    for (let i = 0; i < res.length; i++) {
      if(res[i] != "~"){
        flag = false
        break
      }
    }
    if (flag) {
      return "~"
    }
    res = res.replaceAll("~","")
    console.log(res)
    return res
  }
  deleteState(state) {
    delete this.gtg[state]
    Object.entries(this.gtg).forEach(([k, v]) => {
      delete this.gtg[k][state]
    })
  }
  findInEdges(state) {
    let inEdges = []
    Object.entries(this.gtg).forEach(([k, v]) => {
      if (k != state) {
        if (this.gtg[k][state] != undefined) {
          inEdges.push(k)
        }
      }
    })
    return inEdges
  }
  findOutEdges(state) {
    let outEdges = []
    Object.entries(this.gtg[state]).forEach(([k, v]) => {
      if (k != state) {
        outEdges.push(k)
      }
    })
    return outEdges
  }

}
