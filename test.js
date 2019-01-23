var tape = require('tape')
var gql = require('./')

tape('should create a query', function (test) {
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
  var parsedData = JSON.parse(data)

  test.plan(2)
  test.ok(typeof parsedData.query === 'string', 'query should be a string')
  test.equal(parsedData.variables, JSON.stringify(variables), 'variables processed as a string')
  test.end()
})

tape('should have a name', function (test) {
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
  var parsedData = JSON.parse(data)

  test.plan(3)
  test.ok(typeof parsedData.query === 'string', 'query should be a string')
  test.equal(parsedData.operationName, 'foo', 'operationName as a string')
  test.equal(parsedData.variables, JSON.stringify(variables), 'variables processed as a string')
  test.end()
})

tape('should have a name for mutations also', function (test) {
  var query = gql`
    mutation CreateSomethingBig($input: Idea!) {
      createSomething(input: $input) {
        result
      }
    }
  `
  var data = query()
  var parsedData = JSON.parse(data)

  test.plan(2)
  test.ok(typeof parsedData.query === 'string', 'query should be a string')
  test.equal(parsedData.operationName, 'CreateSomethingBig', 'operationName as a string')
  test.end()
})

tape('should have a name without args', function (test) {
  var query = gql`
    query foo {
      viewer {
        name
        repositories {
          nodes {
            name
          }
        }
      }
    }
  `
  var data = query()
  var parsedData = JSON.parse(data)

  test.plan(2)
  test.ok(typeof parsedData.query === 'string', 'query should be a string')
  test.equal(parsedData.operationName, 'foo', 'operationName as a string')
  test.end()
})

tape('should support a fragment', function (test) {
  var fragment = `
    fragment RepositoryFragment on Repository {
      nodes {
        name
      }
    }
  `
  var query = gql`
    query foo {
      viewer {
        name
        repositories {
          ...RepositoryFragment
        }
      }
    }
    ${fragment}
  `

  var data = query()
  test.plan(2)
  test.ok(data.indexOf('...RepositoryFragment') !== -1, 'fragment link exists')
  test.ok(data.indexOf('fragment RepositoryFragment on Repository') !== -1, 'fragment body exists')
  test.end()
})

tape('should not stringify variables', function (test) {
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
  var data = query(variables, true)
  var parsedData = JSON.parse(data)

  test.plan(2)
  test.ok(typeof parsedData.query === 'string', 'query should be a string')
  test.deepEqual(parsedData.variables, variables, 'variables processed as an object')
  test.end()
})
