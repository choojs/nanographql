/*
 * nanographql - template literal GraphQL processor
 */

var nameRe = /^\s*(?:query|mutation)\s+([\w\d-_]+)\s*(?:\(.*?\))?\s*{/

function finalBuilder (str) {
  return function (variables, variablesAsObject) {
    var data = { query: str }
    var matched = nameRe.exec(str)

    if (variables) {
      data.variables = variablesAsObject ? variables : JSON.stringify(variables)
    }
    if (matched) {
      data.operationName = matched[1]
    }
    return JSON.stringify(data)
  }
}

function nanographql () {
  var args = Array.prototype.slice.call(arguments)
  var literals = args[0]
  var str = (typeof literals === 'string') ? literals : literals[0]

  for (var i = 1; i < args.length; i++) {
    str += args[i] + literals[i]
  }
  return finalBuilder(str)
}

module.exports = nanographql
