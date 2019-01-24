# micrographql-client [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

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

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/micrographql-client.svg?style=flat-square
[3]: https://npmjs.org/package/micrographql-client
[4]: https://img.shields.io/travis/Meettya/micrographql-client/master.svg?style=flat-square
[5]: https://travis-ci.org/Meettya/micrographql-client
[8]: http://img.shields.io/npm/dm/micrographql-client.svg?style=flat-square
[9]: https://npmjs.org/package/micrographql-client
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[12]: https://npmjs.org/package/nanographql
