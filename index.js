/*
 * micrographql - template literal GraphQL processor
 */

const nameRe = /^\s*(?:query|mutation)\s+([\w\d-_]+)\s*(?:\(.*?\))?\s*{/

function finalBuilder (str) {
  return function (variables, variablesAsObject) {
    const data = { query: str }
    const matched = nameRe.exec(str)

    if (variables) {
      data.variables = variablesAsObject ? variables : JSON.stringify(variables)
    }
    if (matched) {
      data.operationName = matched[1]
    }
    return JSON.stringify(data)
  }
}

function micrographql () {
  const args = Array.prototype.slice.call(arguments)
  const literals = args[0]
  let str = (typeof literals === 'string') ? literals : literals[0]

  for (let i = 1; i < args.length; i++) {
    str += args[i] + literals[i]
  }
  return finalBuilder(str)
}

module.exports = micrographql
