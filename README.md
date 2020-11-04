# nanographql [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Tiny GraphQL client library. Compiles queries, fetches them and caches them, all
in one tiny pacakge.

## Usage
```js
const { gql, nanographql } = require('nanographql')

const Query = gql`
  query($name: String!) {
    movie (name: $name) {
      releaseDate
    }
  }
`

const graphql = nanographql('/graphql')
const { errors, data } = graphql(Query({ name: 'Back to the Future' }))

```

```js
const { gql, nanographql } = require('nanographql')

const { user } = gql`
  fragment user on User {
    id
    name
  }
`

const { GetUser, SaveUser } = gql`
  query GetUser($id: ID!) {
    user: getUser(id: $id) {
      ...${user}
    }
  }
  mutation SaveUser($id: ID!, $name: String) {
    user: saveUser(id: $id, name: $name) {
      ...${user}
    }
  }
`

const graphql = nanographql('/graphql', render)

function render () {
  const { errors, data } = graphql(GetUser({ id: 'abc123' }))
  if (errors) return html`<p>User not found</p>`
  if (!data) return html`<p>Loading</p>`

  return html`
    <form onsubmit=${onsubmit}>
      Name: <input value="${data.user.name}" name="username">
      <button>Save</button
    </form>
  `

  function onsubmit (event) {
    graphql(SaveUser({ id: 'abc123', name: this.username }))
    event.preventDefault()
  }
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
