module.exports = nanogql

var getOpname = /(query|mutation) ?([\w\d-_]+)? ?\(.*?\)? \{/

function nanogql (str) {
  str = Array.isArray(str) ? str.join('') : str
  var name = getOpname.exec(str)
  return function (variables) {
    var data = { query: str }
    if (variables) data.variables = JSON.stringify(variables)
    if (name) data.operationName = name[2]
    return data
  }
}
