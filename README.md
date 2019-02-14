# nanographql [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Tiny graphQL client library. Does everything you need with GraphQL 15 lines of
code.

## Usage
```js
var gql = require('nanographql')

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

### `json = query([data])`
Create a new query object that can be sent as `application/json` to a server.

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/nanographql.svg?style=flat-square
[3]: https://npmjs.org/package/nanographql
[4]: https://img.shields.io/travis/yoshuawuyts/nanographql/master.svg?style=flat-square
[5]: https://travis-ci.org/yoshuawuyts/nanographql
[6]: https://img.shields.io/codecov/c/github/yoshuawuyts/nanographql/master.svg?style=flat-square
[7]: https://codecov.io/github/yoshuawuyts/nanographql
[8]: http://img.shields.io/npm/dm/nanographql.svg?style=flat-square
[9]: https://npmjs.org/package/nanographql
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
