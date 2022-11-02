[![Test status](https://github.com/Meettya/micrographql-client/actions/workflows/tests.yml/badge.svg)](https://github.com/Meettya/micrographql-client/actions/workflows/tests.yml) &emsp; [![CodeQL status](https://github.com/Meettya/micrographql-client/actions/workflows/codeql.yml/badge.svg)](https://github.com/Meettya/micrographql-client/actions/workflows/codeql.yml) &emsp; ![Dependenies](https://img.shields.io/badge/dependencies-ZERO-green)

# micrographql-client

Small graphQL client library.

Its [nanographql][12] successor with some more features:
  - convert GraphQL query schema to stringify query object
  - support named query
  - support pack variables to query object
  - have options to prevent double stringify variables
  - support fragments

It may be used with HTTP or WAMP transport.

## Installation

`$ npm install micrographql-client`

## Usage
```js
var gql = require('micrographql-client')

var query = gql`
  query($name: String!) {
    movie (name: $name) {
      releaseDate
    }
  }
`

try {
  var res = await fetch('/query', {
    body: query({ name: 'Back to the Future' }),
    method: 'POST'
  })
  var json = res.json()
  console.log(json)
} catch (err) {
  console.error(err)
}
```

## API
### `query = gql(string)`
Create a new graphql query function.

### `processedQuery = query({/*variables*/}, variablesAsObject)`
Create a new query object as string that can be sent as `application/json` to a server.

In case of use another transport set `variablesAsObject` to `true` to prevent double stringify variables.

## License
[MIT](https://tldrlegal.com/license/mit-license)

[12]: https://npmjs.org/package/nanographql
