'use strict'

var getOpname = /query ([\w\d-_]+)? ?\(.*?\)? \{/

function nanogql (str) {
  str = Array.isArray(str) ? str.reduce(merge, '') : str
  var name = getOpname.exec(str)
  return function (variables) {
    var data = { query: str }
    if (variables) data.variables = JSON.stringify(variables)
    if (name) data.operationName = name[1]
    return data
  }
}

function merge (str, chunk) {
  return str + chunk
}

function taggify () {
  var args = new Array(arguments.length)
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i]
  }

  var string = args.shift()
  var raw = string.raw
  var result = ''

  args.forEach(applySubstitutions)
  result += raw[raw.length - 1]
  return nanogql(result)

  function applySubstitutions (arg, i) {
    var lit = raw[i]
    if (Array.isArray(arg)) {
      arg = arg.join('')
    }
    result += lit + arg
  }
}

module.exports = taggify
