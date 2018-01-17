var spok = require('spok')
var tape = require('tape')
var gql = require('./')

tape('should create a query', function (assert) {
  var query = gql`
    query($number_of_repos:Int!) {
      viewer {
        name
        repositories(last: $number_of_repos) {
          nodes {
            name
          }
        }
      }
    }
  `

  var variables = { number_of_repos: 3 }
  var data = query(variables)
  spok(assert, JSON.parse(data), {
    query: spok.string,
    variables: JSON.stringify(variables)
  })
  assert.end()
})

tape('should have a name', function (assert) {
  var query = gql`
    query foo ($number_of_repos:Int!) {
      viewer {
        name
        repositories(last: $number_of_repos) {
          nodes {
            name
          }
        }
      }
    }
  `

  var variables = { number_of_repos: 3 }
  var data = query(variables)
  spok(assert, JSON.parse(data), {
    query: spok.string,
    operationName: 'foo',
    variables: JSON.stringify(variables)
  })
  assert.end()
})

tape('should have a name for mutations also', function (assert) {
  var query = gql`
    mutation CreateSomethingBig($input: Idea!) {
      createSomething(input: $input) {
        result
      }
    }
  `

  var data = query()
  spok(assert, JSON.parse(data), {
    query: spok.string,
    operationName: 'CreateSomethingBig'
  })
  assert.end()
})
